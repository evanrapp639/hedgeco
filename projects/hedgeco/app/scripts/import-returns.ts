#!/usr/bin/env npx ts-node
/**
 * Import Returns Script
 * Bulk import historical returns for funds
 *
 * Usage:
 *   npx ts-node scripts/import-returns.ts data/returns.csv
 *   npx ts-node scripts/import-returns.ts data/returns.json --dry-run
 *
 * Expected CSV format:
 *   fundId,year,month,netReturn,grossReturn
 *   clxxxx,2024,1,0.0523,0.0612
 *
 * OR with fund name/slug (will lookup fundId):
 *   fundName,year,month,netReturn,grossReturn
 *   "Acme Capital Fund",2024,1,5.23%,6.12%
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Configuration
// ============================================================

const MIN_RETURN = -1.0; // -100%
const MAX_RETURN = 10.0; // +1000%
const BATCH_SIZE = 100;

// ============================================================
// Setup
// ============================================================

const prisma = new PrismaClient();

// Parse CLI args
const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const updateExisting = args.includes('--update-existing');
const calculateYtd = !args.includes('--no-ytd');

// ============================================================
// Types
// ============================================================

interface ReturnInput {
  fundId?: string;
  fundName?: string;
  fundSlug?: string;
  year: number | string;
  month: number | string;
  netReturn: number | string;
  grossReturn?: number | string;
  provisional?: boolean | string;
  source?: string;
}

interface ProcessedReturn {
  fundId: string;
  year: number;
  month: number;
  netReturn: number;
  grossReturn?: number;
  provisional: boolean;
  source?: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

// ============================================================
// Parsing Functions
// ============================================================

function parseCSV(content: string): ReturnInput[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const returns: ReturnInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Warning: Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      continue;
    }

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx];
    });
    returns.push(record as unknown as ReturnInput);
  }

  return returns;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseJSON(content: string): ReturnInput[] {
  const data = JSON.parse(content);
  if (Array.isArray(data)) {
    return data;
  }
  if (data.returns && Array.isArray(data.returns)) {
    return data.returns;
  }
  throw new Error('JSON must be an array or an object with a "returns" array');
}

// ============================================================
// Utility Functions
// ============================================================

function parseReturn(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;

  // Handle percentage format (e.g., "5.23%" -> 0.0523)
  let normalized = value.trim();
  if (normalized.endsWith('%')) {
    normalized = normalized.slice(0, -1);
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? undefined : parsed / 100;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : parsed;
}

function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

// Fund lookup cache
const fundCache = new Map<string, string>();

async function lookupFundId(input: ReturnInput): Promise<string | null> {
  // Direct fundId provided
  if (input.fundId) {
    return input.fundId;
  }

  // Check cache
  const cacheKey = input.fundName || input.fundSlug || '';
  if (fundCache.has(cacheKey)) {
    return fundCache.get(cacheKey)!;
  }

  // Lookup by name or slug
  const fund = await prisma.fund.findFirst({
    where: {
      OR: [
        ...(input.fundName ? [{ name: { equals: input.fundName, mode: 'insensitive' as const } }] : []),
        ...(input.fundSlug ? [{ slug: input.fundSlug }] : []),
      ],
    },
    select: { id: true },
  });

  if (fund) {
    fundCache.set(cacheKey, fund.id);
    return fund.id;
  }

  return null;
}

// ============================================================
// Validation Functions
// ============================================================

function validateReturn(input: ReturnInput, row: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check fund identifier
  if (!input.fundId && !input.fundName && !input.fundSlug) {
    errors.push('Must provide fundId, fundName, or fundSlug');
  }

  // Check required fields
  if (!input.year) errors.push('Missing year');
  if (!input.month) errors.push('Missing month');
  if (input.netReturn === undefined || input.netReturn === '') {
    errors.push('Missing netReturn');
  }

  // Validate year
  const year = parseInt(String(input.year), 10);
  if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
    errors.push(`Invalid year: ${input.year}`);
  }

  // Validate month
  const month = parseInt(String(input.month), 10);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push(`Invalid month: ${input.month}`);
  }

  // Validate return ranges
  const netReturn = parseReturn(input.netReturn);
  if (netReturn !== undefined) {
    if (netReturn < MIN_RETURN || netReturn > MAX_RETURN) {
      errors.push(
        `Net return ${netReturn} out of range (${MIN_RETURN * 100}% to ${MAX_RETURN * 100}%)`
      );
    }
  }

  const grossReturn = parseReturn(input.grossReturn);
  if (grossReturn !== undefined) {
    if (grossReturn < MIN_RETURN || grossReturn > MAX_RETURN) {
      errors.push(
        `Gross return ${grossReturn} out of range (${MIN_RETURN * 100}% to ${MAX_RETURN * 100}%)`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// YTD Calculation
// ============================================================

async function calculateYtdForFund(fundId: string, year: number): Promise<void> {
  // Get all returns for this fund in this year, ordered by month
  const returns = await prisma.fundReturn.findMany({
    where: { fundId, year },
    orderBy: { month: 'asc' },
  });

  if (returns.length === 0) return;

  // Calculate cumulative YTD for each month
  let ytdCumulative = 1.0;

  for (const returnRecord of returns) {
    const monthlyReturn = Number(returnRecord.netReturn);
    ytdCumulative *= 1 + monthlyReturn;
    const ytdReturn = ytdCumulative - 1;

    await prisma.fundReturn.update({
      where: { id: returnRecord.id },
      data: { ytdReturn },
    });
  }
}

// ============================================================
// Import Functions
// ============================================================

async function importReturn(
  processed: ProcessedReturn
): Promise<{ action: 'created' | 'updated' | 'skipped'; id: string }> {
  // Check if return already exists
  const existing = await prisma.fundReturn.findUnique({
    where: {
      fundId_year_month: {
        fundId: processed.fundId,
        year: processed.year,
        month: processed.month,
      },
    },
  });

  if (existing) {
    if (updateExisting) {
      const updated = await prisma.fundReturn.update({
        where: { id: existing.id },
        data: {
          netReturn: processed.netReturn,
          grossReturn: processed.grossReturn,
          provisional: processed.provisional,
          source: processed.source,
        },
      });
      return { action: 'updated', id: updated.id };
    }
    return { action: 'skipped', id: existing.id };
  }

  const created = await prisma.fundReturn.create({
    data: {
      fundId: processed.fundId,
      year: processed.year,
      month: processed.month,
      netReturn: processed.netReturn,
      grossReturn: processed.grossReturn,
      provisional: processed.provisional,
      source: processed.source,
    },
  });

  return { action: 'created', id: created.id };
}

// ============================================================
// Entry Point
// ============================================================

async function main(): Promise<void> {
  console.log('\n📈 Import Returns Script');
  console.log('================================');

  if (!filePath) {
    console.error('❌ Please provide a file path');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/import-returns.ts <file.csv|file.json> [options]');
    console.log('\nOptions:');
    console.log('  --dry-run         Preview changes without importing');
    console.log('  --update-existing Update existing returns instead of skipping');
    console.log('  --no-ytd          Skip YTD calculation');
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Read and parse file
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📄 Reading: ${absolutePath}`);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  let returns: ReturnInput[];
  try {
    if (ext === '.csv') {
      returns = parseCSV(content);
    } else if (ext === '.json') {
      returns = parseJSON(content);
    } else {
      console.error('❌ Unsupported file format. Use .csv or .json');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Failed to parse file: ${error}`);
    process.exit(1);
  }

  console.log(`📋 Found ${returns.length} returns to import\n`);

  // Validate
  console.log('🔍 Validating...');
  let hasErrors = false;
  const validatedReturns: Array<{ input: ReturnInput; row: number }> = [];

  for (let i = 0; i < returns.length; i++) {
    const { valid, errors } = validateReturn(returns[i], i + 1);
    if (!valid) {
      hasErrors = true;
      console.error(`❌ Row ${i + 2}: ${errors.join(', ')}`);
    } else {
      validatedReturns.push({ input: returns[i], row: i + 2 });
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validation failed. Fix errors and retry.');
    process.exit(1);
  }

  console.log('✅ Validation passed\n');

  // Process returns
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const fundsToRecalculate = new Map<string, Set<number>>(); // fundId -> Set of years

  for (let i = 0; i < validatedReturns.length; i++) {
    const { input, row } = validatedReturns[i];
    const progress = `[${i + 1}/${validatedReturns.length}]`;

    try {
      // Lookup fund ID
      const fundId = await lookupFundId(input);
      if (!fundId) {
        throw new Error(`Fund not found: ${input.fundName || input.fundSlug || input.fundId}`);
      }

      const processed: ProcessedReturn = {
        fundId,
        year: parseInt(String(input.year), 10),
        month: parseInt(String(input.month), 10),
        netReturn: parseReturn(input.netReturn)!,
        grossReturn: parseReturn(input.grossReturn),
        provisional: parseBoolean(input.provisional),
        source: input.source,
      };

      if (!dryRun) {
        const { action, id } = await importReturn(processed);

        const label = `${processed.year}-${String(processed.month).padStart(2, '0')}`;
        if (action === 'created') {
          console.log(
            `${progress} ✅ ${fundId} ${label}: ${(processed.netReturn * 100).toFixed(2)}%`
          );
          result.created++;
        } else if (action === 'updated') {
          console.log(
            `${progress} 🔄 ${fundId} ${label}: ${(processed.netReturn * 100).toFixed(2)}%`
          );
          result.updated++;
        } else {
          console.log(`${progress} ⏭️  ${fundId} ${label} (exists)`);
          result.skipped++;
        }

        // Track funds/years that need YTD recalculation
        if (calculateYtd && (action === 'created' || action === 'updated')) {
          if (!fundsToRecalculate.has(fundId)) {
            fundsToRecalculate.set(fundId, new Set());
          }
          fundsToRecalculate.get(fundId)!.add(processed.year);
        }
      } else {
        const label = `${processed.year}-${String(processed.month).padStart(2, '0')}`;
        console.log(
          `${progress} 🔍 ${fundId} ${label}: ${(processed.netReturn * 100).toFixed(2)}%`
        );
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${progress} ❌ Row ${row}: ${errorMessage}`);
      result.failed++;
      result.errors.push({ row, error: errorMessage });
    }
  }

  // Calculate YTD
  if (calculateYtd && fundsToRecalculate.size > 0 && !dryRun) {
    console.log('\n📊 Calculating YTD returns...');
    const fundEntries = Array.from(fundsToRecalculate.entries());
    for (const [fundId, years] of fundEntries) {
      const yearsArray = Array.from(years);
      for (const year of yearsArray) {
        try {
          await calculateYtdForFund(fundId, year);
          console.log(`  ✅ ${fundId} ${year}`);
        } catch (error) {
          console.error(`  ❌ ${fundId} ${year}: ${error}`);
        }
      }
    }
  }

  // Summary
  console.log('\n================================');
  console.log('📊 Summary');
  console.log('================================');
  console.log(`✅ Created: ${result.created}`);
  console.log(`🔄 Updated: ${result.updated}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`❌ Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((e) => {
      console.log(`  Row ${e.row}: ${e.error}`);
    });
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No returns were actually imported');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
