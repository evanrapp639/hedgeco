/**
 * Legacy Fund Migration Script
 * 
 * Migrates funds and their performance data from the legacy HedgeCo database.
 * 
 * Usage:
 *   LEGACY_DB_URL="postgres://..." npx ts-node scripts/migrate-legacy/migrate-funds.ts
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --batch=50   Set batch size (default: 50)
 *   --skip=0     Skip first N records
 *   --with-returns  Include historical returns (slower)
 */

import { PrismaClient as NewPrismaClient, FundType, FundStatus } from '@prisma/client';
import { Client as PgClient } from 'pg';
import { createHash } from 'crypto';

// Configuration
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '50');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = parseInt(process.argv.find(a => a.startsWith('--skip='))?.split('=')[1] || '0');
const WITH_RETURNS = process.argv.includes('--with-returns');

// Initialize clients
const newDb = new NewPrismaClient();
const legacyDb = new PgClient({ connectionString: process.env.LEGACY_DB_URL });

// Fund type mapping
const fundTypeMapping: Record<string, FundType> = {
  'hedge_fund': 'HEDGE_FUND',
  'hedge fund': 'HEDGE_FUND',
  'private_equity': 'PRIVATE_EQUITY',
  'private equity': 'PRIVATE_EQUITY',
  'venture_capital': 'VENTURE_CAPITAL',
  'venture capital': 'VENTURE_CAPITAL',
  'vc': 'VENTURE_CAPITAL',
  'real_estate': 'REAL_ESTATE',
  'real estate': 'REAL_ESTATE',
  'crypto': 'CRYPTO',
  'cryptocurrency': 'CRYPTO',
  'digital_assets': 'CRYPTO',
  'spv': 'SPV',
  'fund_of_funds': 'FUND_OF_FUNDS',
  'fof': 'FUND_OF_FUNDS',
  'credit': 'CREDIT',
  'infrastructure': 'INFRASTRUCTURE',
};

// Status mapping
const statusMapping: Record<string, FundStatus> = {
  'draft': 'DRAFT',
  'pending': 'PENDING_REVIEW',
  'pending_review': 'PENDING_REVIEW',
  'approved': 'APPROVED',
  'active': 'APPROVED',
  'rejected': 'REJECTED',
  'suspended': 'SUSPENDED',
  'closed': 'CLOSED',
};

interface LegacyFund {
  id: number;
  manager_id: number;
  manager_email: string;
  name: string;
  slug: string;
  fund_type: string;
  strategy: string | null;
  sub_strategy: string | null;
  investment_focus: string | null;
  description: string | null;
  aum: string | null;
  aum_date: Date | null;
  inception_date: Date | null;
  management_fee: string | null;
  performance_fee: string | null;
  hurdle_rate: string | null;
  high_water_mark: boolean;
  min_investment: string | null;
  lockup_period: string | null;
  redemption_terms: string | null;
  legal_structure: string | null;
  domicile: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  is_visible: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

interface LegacyReturn {
  fund_id: number;
  year: number;
  month: number;
  net_return: string;
  gross_return: string | null;
  aum: string | null;
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  returnsMigrated: number;
  errors: Array<{ name: string; error: string }>;
}

async function fetchLegacyFunds(offset: number, limit: number): Promise<LegacyFund[]> {
  const result = await legacyDb.query<LegacyFund>(`
    SELECT 
      f.id, f.manager_id, u.email as manager_email,
      f.name, f.slug, f.fund_type,
      f.strategy, f.sub_strategy, f.investment_focus,
      f.description, f.aum, f.aum_date, f.inception_date,
      f.management_fee, f.performance_fee, f.hurdle_rate, f.high_water_mark,
      f.min_investment, f.lockup_period, f.redemption_terms,
      f.legal_structure, f.domicile, f.country, f.state, f.city,
      f.status, f.is_visible, f.is_featured,
      f.created_at, f.updated_at
    FROM funds f
    JOIN users u ON f.manager_id = u.id
    ORDER BY f.id
    OFFSET $1 LIMIT $2
  `, [offset, limit]);
  
  return result.rows;
}

async function fetchLegacyReturns(fundId: number): Promise<LegacyReturn[]> {
  const result = await legacyDb.query<LegacyReturn>(`
    SELECT fund_id, year, month, net_return, gross_return, aum
    FROM fund_returns
    WHERE fund_id = $1
    ORDER BY year, month
  `, [fundId]);
  
  return result.rows;
}

function generateSlug(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${id}`;
}

async function migrateFund(legacy: LegacyFund): Promise<{ migrated: boolean; returns: number }> {
  // Find the manager in the new database by email
  const manager = await newDb.user.findUnique({
    where: { email: legacy.manager_email.toLowerCase() },
  });

  if (!manager) {
    throw new Error(`Manager not found: ${legacy.manager_email}`);
  }

  // Check if fund already exists (by slug)
  const slug = legacy.slug || generateSlug(legacy.name, legacy.id);
  const existing = await newDb.fund.findUnique({
    where: { slug },
  });

  if (existing) {
    console.log(`  Skipping ${legacy.name} - already exists`);
    return { migrated: false, returns: 0 };
  }

  const fundType = fundTypeMapping[legacy.fund_type?.toLowerCase() || 'hedge_fund'] || 'HEDGE_FUND';
  const status = statusMapping[legacy.status?.toLowerCase() || 'draft'] || 'DRAFT';

  // Generate deterministic ID
  const fundId = `legacy_fund_${legacy.id}_${createHash('sha256').update(legacy.name).digest('hex').slice(0, 8)}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create fund: ${legacy.name} (${fundType})`);
    return { migrated: true, returns: 0 };
  }

  try {
    // Create the fund
    await newDb.fund.create({
      data: {
        id: fundId,
        managerId: manager.id,
        name: legacy.name,
        slug,
        type: fundType,
        strategy: legacy.strategy,
        subStrategy: legacy.sub_strategy,
        investmentFocus: legacy.investment_focus,
        description: legacy.description,
        aum: legacy.aum ? parseFloat(legacy.aum) : null,
        aumDate: legacy.aum_date,
        inceptionDate: legacy.inception_date,
        managementFee: legacy.management_fee ? parseFloat(legacy.management_fee) : null,
        performanceFee: legacy.performance_fee ? parseFloat(legacy.performance_fee) : null,
        hurdleRate: legacy.hurdle_rate ? parseFloat(legacy.hurdle_rate) : null,
        highWaterMark: legacy.high_water_mark,
        minInvestment: legacy.min_investment ? parseFloat(legacy.min_investment) : null,
        lockupPeriod: legacy.lockup_period,
        redemptionTerms: legacy.redemption_terms,
        legalStructure: legacy.legal_structure,
        domicile: legacy.domicile,
        country: legacy.country,
        state: legacy.state,
        city: legacy.city,
        status,
        visible: legacy.is_visible,
        featured: legacy.is_featured,
        createdAt: legacy.created_at,
        updatedAt: legacy.updated_at,
      },
    });

    console.log(`  Migrated: ${legacy.name} (${fundType})`);

    // Migrate returns if requested
    let returnCount = 0;
    if (WITH_RETURNS) {
      const returns = await fetchLegacyReturns(legacy.id);
      for (const ret of returns) {
        try {
          await newDb.fundReturn.create({
            data: {
              fundId,
              year: ret.year,
              month: ret.month,
              netReturn: parseFloat(ret.net_return),
              grossReturn: ret.gross_return ? parseFloat(ret.gross_return) : null,
              periodAum: ret.aum ? parseFloat(ret.aum) : null,
            },
          });
          returnCount++;
        } catch (error) {
          console.error(`    Error migrating return ${ret.year}-${ret.month}: ${error}`);
        }
      }
      if (returnCount > 0) {
        console.log(`    Migrated ${returnCount} return records`);
      }
    }

    return { migrated: true, returns: returnCount };
  } catch (error) {
    throw new Error(`Failed to migrate ${legacy.name}: ${error}`);
  }
}

async function runMigration(): Promise<MigrationResult> {
  console.log('='.repeat(60));
  console.log('HedgeCo Legacy Fund Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Starting offset: ${SKIP}`);
  console.log(`Include returns: ${WITH_RETURNS}`);
  console.log('');

  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    returnsMigrated: 0,
    errors: [],
  };

  let offset = SKIP;
  let hasMore = true;

  while (hasMore) {
    console.log(`\nFetching batch at offset ${offset}...`);
    const funds = await fetchLegacyFunds(offset, BATCH_SIZE);

    if (funds.length === 0) {
      hasMore = false;
      break;
    }

    for (const fund of funds) {
      result.total++;
      try {
        const { migrated, returns } = await migrateFund(fund);
        if (migrated) {
          result.migrated++;
          result.returnsMigrated += returns;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push({
          name: fund.name,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`  ERROR: ${error}`);
      }
    }

    offset += BATCH_SIZE;
    hasMore = funds.length === BATCH_SIZE;
  }

  return result;
}

async function main() {
  if (!process.env.LEGACY_DB_URL) {
    console.error('Error: LEGACY_DB_URL environment variable is required');
    process.exit(1);
  }

  try {
    console.log('Connecting to databases...');
    await legacyDb.connect();
    await newDb.$connect();

    const result = await runMigration();

    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete');
    console.log('='.repeat(60));
    console.log(`Total processed: ${result.total}`);
    console.log(`Successfully migrated: ${result.migrated}`);
    console.log(`Skipped (already exists): ${result.skipped}`);
    console.log(`Returns migrated: ${result.returnsMigrated}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const err of result.errors) {
        console.log(`  - ${err.name}: ${err.error}`);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await legacyDb.end();
    await newDb.$disconnect();
  }
}

main();
