#!/usr/bin/env npx ts-node
/**
 * Import Funds Script
 * Import funds from CSV or JSON files
 *
 * Usage:
 *   npx ts-node scripts/import-funds.ts data/funds.csv
 *   npx ts-node scripts/import-funds.ts data/funds.json --dry-run
 */

import { PrismaClient, FundType, FundStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Configuration
// ============================================================

const REQUIRED_FIELDS = ['name', 'type', 'managerId'] as const;
const VALID_FUND_TYPES = Object.values(FundType);

// ============================================================
// Setup
// ============================================================

const prisma = new PrismaClient();

// Parse CLI args
const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const skipDuplicates = args.includes('--skip-duplicates');
const updateExisting = args.includes('--update-existing');

// ============================================================
// Types
// ============================================================

interface FundInput {
  name: string;
  type: string;
  managerId: string;
  slug?: string;
  strategy?: string;
  subStrategy?: string;
  investmentFocus?: string;
  description?: string;
  aum?: number | string;
  inceptionDate?: string;
  managementFee?: number | string;
  performanceFee?: number | string;
  hurdleRate?: number | string;
  highWaterMark?: boolean | string;
  minInvestment?: number | string;
  lockupPeriod?: string;
  redemptionTerms?: string;
  legalStructure?: string;
  domicile?: string;
  country?: string;
  state?: string;
  city?: string;
  status?: string;
  visible?: boolean | string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

// ============================================================
// Parsing Functions
// ============================================================

function parseCSV(content: string): FundInput[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const funds: FundInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Warning: Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      continue;
    }

    const fund: Record<string, string> = {};
    headers.forEach((header, idx) => {
      fund[header] = values[idx];
    });
    funds.push(fund as unknown as FundInput);
  }

  return funds;
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

function parseJSON(content: string): FundInput[] {
  const data = JSON.parse(content);
  if (Array.isArray(data)) {
    return data;
  }
  if (data.funds && Array.isArray(data.funds)) {
    return data.funds;
  }
  throw new Error('JSON must be an array or an object with a "funds" array');
}

// ============================================================
// Validation Functions
// ============================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

function parseNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value.replace(/[,$]/g, ''));
  return isNaN(parsed) ? undefined : parsed;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

function validateFund(fund: FundInput, rowNum: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!fund[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate fund type
  if (fund.type && !VALID_FUND_TYPES.includes(fund.type as FundType)) {
    errors.push(
      `Invalid fund type: "${fund.type}". Valid types: ${VALID_FUND_TYPES.join(', ')}`
    );
  }

  // Validate numeric fields
  const numericFields = ['aum', 'managementFee', 'performanceFee', 'hurdleRate', 'minInvestment'];
  for (const field of numericFields) {
    const value = fund[field as keyof FundInput];
    if (value !== undefined && value !== '' && parseNumber(value as string) === undefined) {
      warnings.push(`Invalid number for ${field}: "${value}"`);
    }
  }

  // Validate fee ranges
  const managementFee = parseNumber(fund.managementFee as string);
  if (managementFee !== undefined && (managementFee < 0 || managementFee > 0.1)) {
    warnings.push(`Management fee ${managementFee} seems unusual (expected 0-10%)`);
  }

  const performanceFee = parseNumber(fund.performanceFee as string);
  if (performanceFee !== undefined && (performanceFee < 0 || performanceFee > 0.5)) {
    warnings.push(`Performance fee ${performanceFee} seems unusual (expected 0-50%)`);
  }

  // Validate date
  if (fund.inceptionDate) {
    const date = parseDate(fund.inceptionDate);
    if (!date) {
      warnings.push(`Invalid inception date: "${fund.inceptionDate}"`);
    } else if (date > new Date()) {
      warnings.push(`Inception date is in the future: ${fund.inceptionDate}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// Import Functions
// ============================================================

async function checkDuplicate(name: string, slug: string): Promise<string | null> {
  const existing = await prisma.fund.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }],
    },
    select: { id: true, name: true, slug: true },
  });

  return existing?.id ?? null;
}

async function importFund(
  fund: FundInput,
  existingId: string | null
): Promise<{ action: 'created' | 'updated' | 'skipped'; id: string }> {
  const slug = fund.slug || generateSlug(fund.name);

  const fundData = {
    name: fund.name,
    slug,
    type: fund.type as FundType,
    managerId: fund.managerId,
    strategy: fund.strategy || null,
    subStrategy: fund.subStrategy || null,
    investmentFocus: fund.investmentFocus || null,
    description: fund.description || null,
    aum: parseNumber(fund.aum as string) || null,
    inceptionDate: parseDate(fund.inceptionDate) || null,
    managementFee: parseNumber(fund.managementFee as string) || null,
    performanceFee: parseNumber(fund.performanceFee as string) || null,
    hurdleRate: parseNumber(fund.hurdleRate as string) || null,
    highWaterMark: parseBoolean(fund.highWaterMark),
    minInvestment: parseNumber(fund.minInvestment as string) || null,
    lockupPeriod: fund.lockupPeriod || null,
    redemptionTerms: fund.redemptionTerms || null,
    legalStructure: fund.legalStructure || null,
    domicile: fund.domicile || null,
    country: fund.country || null,
    state: fund.state || null,
    city: fund.city || null,
    status: (fund.status as FundStatus) || FundStatus.DRAFT,
    visible: parseBoolean(fund.visible),
  };

  if (existingId) {
    if (updateExisting) {
      await prisma.fund.update({
        where: { id: existingId },
        data: fundData,
      });
      return { action: 'updated', id: existingId };
    }
    return { action: 'skipped', id: existingId };
  }

  const created = await prisma.fund.create({
    data: fundData,
  });
  return { action: 'created', id: created.id };
}

// ============================================================
// Entry Point
// ============================================================

async function main(): Promise<void> {
  console.log('\n📦 Import Funds Script');
  console.log('================================');

  if (!filePath) {
    console.error('❌ Please provide a file path');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/import-funds.ts <file.csv|file.json> [options]');
    console.log('\nOptions:');
    console.log('  --dry-run         Preview changes without importing');
    console.log('  --skip-duplicates Skip funds that already exist');
    console.log('  --update-existing Update existing funds instead of skipping');
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

  let funds: FundInput[];
  try {
    if (ext === '.csv') {
      funds = parseCSV(content);
    } else if (ext === '.json') {
      funds = parseJSON(content);
    } else {
      console.error('❌ Unsupported file format. Use .csv or .json');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Failed to parse file: ${error}`);
    process.exit(1);
  }

  console.log(`📋 Found ${funds.length} funds to import\n`);

  // Validate all funds first
  console.log('🔍 Validating...');
  const validationResults: Array<{ fund: FundInput; result: ValidationResult; row: number }> = [];
  let hasErrors = false;

  for (let i = 0; i < funds.length; i++) {
    const result = validateFund(funds[i], i + 1);
    validationResults.push({ fund: funds[i], result, row: i + 1 });

    if (!result.valid) {
      hasErrors = true;
      console.error(`\n❌ Row ${i + 2}: ${funds[i].name || 'Unknown'}`);
      result.errors.forEach((e) => console.error(`   - ${e}`));
    }
    if (result.warnings.length > 0) {
      console.warn(`\n⚠️  Row ${i + 2}: ${funds[i].name || 'Unknown'}`);
      result.warnings.forEach((w) => console.warn(`   - ${w}`));
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validation failed. Fix errors and retry.');
    process.exit(1);
  }

  console.log('✅ Validation passed\n');

  // Import funds
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < funds.length; i++) {
    const fund = funds[i];
    const slug = fund.slug || generateSlug(fund.name);
    const progress = `[${i + 1}/${funds.length}]`;

    try {
      // Check for duplicates
      const existingId = await checkDuplicate(fund.name, slug);

      if (existingId && skipDuplicates && !updateExisting) {
        console.log(`${progress} ⏭️  ${fund.name} (duplicate, skipped)`);
        result.skipped++;
        continue;
      }

      if (!dryRun) {
        const { action, id } = await importFund(fund, existingId);

        if (action === 'created') {
          console.log(`${progress} ✅ ${fund.name} (created: ${id})`);
          result.created++;
        } else if (action === 'updated') {
          console.log(`${progress} 🔄 ${fund.name} (updated: ${id})`);
          result.updated++;
        } else {
          console.log(`${progress} ⏭️  ${fund.name} (skipped: ${id})`);
          result.skipped++;
        }
      } else {
        const action = existingId ? (updateExisting ? 'would update' : 'would skip') : 'would create';
        console.log(`${progress} 🔍 ${fund.name} (${action})`);
        if (!existingId) result.created++;
        else if (updateExisting) result.updated++;
        else result.skipped++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${progress} ❌ ${fund.name}: ${errorMessage}`);
      result.failed++;
      result.errors.push({ row: i + 1, name: fund.name, error: errorMessage });
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
      console.log(`  Row ${e.row} (${e.name}): ${e.error}`);
    });
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No funds were actually imported');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
