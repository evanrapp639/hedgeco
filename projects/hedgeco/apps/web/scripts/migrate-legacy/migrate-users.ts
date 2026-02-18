/**
 * Legacy User Migration Script
 * 
 * Migrates users from the legacy HedgeCo database to the new schema.
 * 
 * Usage:
 *   LEGACY_DB_URL="postgres://..." npx ts-node scripts/migrate-legacy/migrate-users.ts
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --batch=100  Set batch size (default: 100)
 *   --skip=0     Skip first N records
 */

import { PrismaClient as NewPrismaClient } from '@prisma/client';
import { Client as PgClient } from 'pg';
import { createHash } from 'crypto';

// Configuration
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '100');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = parseInt(process.argv.find(a => a.startsWith('--skip='))?.split('=')[1] || '0');

// Initialize clients
const newDb = new NewPrismaClient();
const legacyDb = new PgClient({ connectionString: process.env.LEGACY_DB_URL });

// Role mapping from legacy to new schema
const roleMapping: Record<string, 'INVESTOR' | 'MANAGER' | 'SERVICE_PROVIDER' | 'NEWS_MEMBER' | 'ADMIN'> = {
  'investor': 'INVESTOR',
  'fund_manager': 'MANAGER',
  'hedge_fund_manager': 'MANAGER',
  'service_provider': 'SERVICE_PROVIDER',
  'news': 'NEWS_MEMBER',
  'admin': 'ADMIN',
  'super_admin': 'ADMIN',
};

// Investor type mapping
const investorTypeMapping: Record<string, 'INDIVIDUAL' | 'FAMILY_OFFICE' | 'INSTITUTIONAL' | 'FUND_OF_FUNDS' | 'ENDOWMENT' | 'PENSION' | 'RIA' | 'BANK' | 'INSURANCE'> = {
  'individual': 'INDIVIDUAL',
  'family_office': 'FAMILY_OFFICE',
  'institutional': 'INSTITUTIONAL',
  'fof': 'FUND_OF_FUNDS',
  'fund_of_funds': 'FUND_OF_FUNDS',
  'endowment': 'ENDOWMENT',
  'pension': 'PENSION',
  'ria': 'RIA',
  'bank': 'BANK',
  'insurance': 'INSURANCE',
};

interface LegacyUser {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  linkedin: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_accredited: boolean;
  accredited_date: Date | null;
  investor_type: string | null;
  email_verified: boolean;
  is_active: boolean;
  is_locked: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

async function fetchLegacyUsers(offset: number, limit: number): Promise<LegacyUser[]> {
  const result = await legacyDb.query<LegacyUser>(`
    SELECT 
      id, email, password_hash, role,
      first_name, last_name, company, title, phone, linkedin,
      city, state, country,
      is_accredited, accredited_date, investor_type,
      email_verified, is_active, is_locked,
      last_login, created_at, updated_at
    FROM users
    ORDER BY id
    OFFSET $1 LIMIT $2
  `, [offset, limit]);
  
  return result.rows;
}

async function migrateUser(legacy: LegacyUser): Promise<boolean> {
  // Check if user already exists
  const existing = await newDb.user.findUnique({
    where: { email: legacy.email.toLowerCase() },
  });

  if (existing) {
    console.log(`  Skipping ${legacy.email} - already exists`);
    return false;
  }

  const role = roleMapping[legacy.role.toLowerCase()] || 'INVESTOR';
  const investorType = legacy.investor_type 
    ? investorTypeMapping[legacy.investor_type.toLowerCase()]
    : undefined;

  // Generate deterministic cuid-like ID from legacy ID for traceability
  const userId = `legacy_${legacy.id}_${createHash('sha256').update(legacy.email).digest('hex').slice(0, 8)}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create user: ${legacy.email} (${role})`);
    return true;
  }

  try {
    await newDb.user.create({
      data: {
        id: userId,
        email: legacy.email.toLowerCase(),
        passwordHash: legacy.password_hash,
        role,
        emailVerified: legacy.email_verified ? new Date() : null,
        active: legacy.is_active,
        locked: legacy.is_locked,
        lastLoginAt: legacy.last_login,
        createdAt: legacy.created_at,
        updatedAt: legacy.updated_at,
        profile: {
          create: {
            firstName: legacy.first_name || 'Unknown',
            lastName: legacy.last_name || 'User',
            company: legacy.company,
            title: legacy.title,
            phone: legacy.phone,
            linkedIn: legacy.linkedin,
            city: legacy.city,
            state: legacy.state,
            country: legacy.country || 'US',
            accredited: legacy.is_accredited,
            accreditedAt: legacy.accredited_date,
            investorType,
          },
        },
        // Create default notification preferences
        notificationPreferences: {
          create: {},
        },
      },
    });

    console.log(`  Migrated: ${legacy.email} (${role})`);
    return true;
  } catch (error) {
    throw new Error(`Failed to migrate ${legacy.email}: ${error}`);
  }
}

async function runMigration(): Promise<MigrationResult> {
  console.log('='.repeat(60));
  console.log('HedgeCo Legacy User Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Starting offset: ${SKIP}`);
  console.log('');

  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  let offset = SKIP;
  let hasMore = true;

  while (hasMore) {
    console.log(`\nFetching batch at offset ${offset}...`);
    const users = await fetchLegacyUsers(offset, BATCH_SIZE);

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    for (const user of users) {
      result.total++;
      try {
        const migrated = await migrateUser(user);
        if (migrated) {
          result.migrated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`  ERROR: ${error}`);
      }
    }

    offset += BATCH_SIZE;
    hasMore = users.length === BATCH_SIZE;
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
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const err of result.errors) {
        console.log(`  - ${err.email}: ${err.error}`);
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
