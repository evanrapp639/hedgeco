/**
 * Legacy Service Provider Migration Script
 * 
 * Migrates service providers from the legacy HedgeCo database.
 * 
 * Usage:
 *   LEGACY_DB_URL="postgres://..." npx ts-node scripts/migrate-legacy/migrate-providers.ts
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --batch=50   Set batch size (default: 50)
 *   --skip=0     Skip first N records
 */

import { PrismaClient as NewPrismaClient, ProviderTier, ProviderStatus } from '@prisma/client';
import { Client as PgClient } from 'pg';
import { createHash } from 'crypto';

// Configuration
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '50');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = parseInt(process.argv.find(a => a.startsWith('--skip='))?.split('=')[1] || '0');

// Initialize clients
const newDb = new NewPrismaClient();
const legacyDb = new PgClient({ connectionString: process.env.LEGACY_DB_URL });

// Tier mapping
const tierMapping: Record<string, ProviderTier> = {
  'basic': 'BASIC',
  'free': 'BASIC',
  'professional': 'PROFESSIONAL',
  'pro': 'PROFESSIONAL',
  'premium': 'PREMIUM',
  'featured': 'FEATURED',
  'enterprise': 'FEATURED',
};

// Status mapping
const statusMapping: Record<string, ProviderStatus> = {
  'pending': 'PENDING',
  'approved': 'APPROVED',
  'active': 'APPROVED',
  'rejected': 'REJECTED',
  'suspended': 'SUSPENDED',
};

// Category mapping (legacy to new standardized categories)
const categoryMapping: Record<string, string> = {
  'legal': 'Legal Services',
  'law_firm': 'Legal Services',
  'accounting': 'Accounting & Audit',
  'audit': 'Accounting & Audit',
  'cpa': 'Accounting & Audit',
  'prime_broker': 'Prime Brokerage',
  'prime_brokerage': 'Prime Brokerage',
  'administrator': 'Fund Administration',
  'fund_admin': 'Fund Administration',
  'technology': 'Technology',
  'tech': 'Technology',
  'software': 'Technology',
  'compliance': 'Compliance',
  'regulatory': 'Compliance',
  'marketing': 'Marketing & IR',
  'investor_relations': 'Marketing & IR',
  'ir': 'Marketing & IR',
  'consulting': 'Consulting',
  'tax': 'Tax Services',
  'insurance': 'Insurance',
  'recruiting': 'Recruiting',
  'hr': 'Recruiting',
  'data': 'Data & Analytics',
  'analytics': 'Data & Analytics',
  'research': 'Research',
  'other': 'Other',
};

interface LegacyProvider {
  id: number;
  user_id: number;
  user_email: string;
  company_name: string;
  slug: string | null;
  category: string;
  subcategories: string[] | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  linkedin: string | null;
  twitter: string | null;
  tier: string;
  status: string;
  is_visible: boolean;
  is_featured: boolean;
  view_count: number;
  contact_count: number;
  created_at: Date;
  updated_at: Date;
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: Array<{ name: string; error: string }>;
}

async function fetchLegacyProviders(offset: number, limit: number): Promise<LegacyProvider[]> {
  const result = await legacyDb.query<LegacyProvider>(`
    SELECT 
      sp.id, sp.user_id, u.email as user_email,
      sp.company_name, sp.slug, sp.category, sp.subcategories,
      sp.tagline, sp.description,
      sp.website, sp.phone, sp.email,
      sp.address, sp.address2, sp.city, sp.state, sp.postal_code, sp.country,
      sp.linkedin, sp.twitter,
      sp.tier, sp.status, sp.is_visible, sp.is_featured,
      sp.view_count, sp.contact_count,
      sp.created_at, sp.updated_at
    FROM service_providers sp
    JOIN users u ON sp.user_id = u.id
    ORDER BY sp.id
    OFFSET $1 LIMIT $2
  `, [offset, limit]);
  
  return result.rows;
}

function generateSlug(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${id}`;
}

function mapCategory(legacyCategory: string): string {
  const normalized = legacyCategory.toLowerCase().replace(/[^a-z_]/g, '');
  return categoryMapping[normalized] || 'Other';
}

async function migrateProvider(legacy: LegacyProvider): Promise<boolean> {
  // Find the user in the new database by email
  const user = await newDb.user.findUnique({
    where: { email: legacy.user_email.toLowerCase() },
  });

  if (!user) {
    throw new Error(`User not found: ${legacy.user_email}`);
  }

  // Check if provider already exists for this user
  const existingByUser = await newDb.serviceProvider.findUnique({
    where: { userId: user.id },
  });

  if (existingByUser) {
    console.log(`  Skipping ${legacy.company_name} - user already has provider`);
    return false;
  }

  // Check if slug already exists
  const slug = legacy.slug || generateSlug(legacy.company_name, legacy.id);
  const existingBySlug = await newDb.serviceProvider.findUnique({
    where: { slug },
  });

  if (existingBySlug) {
    console.log(`  Skipping ${legacy.company_name} - slug already exists`);
    return false;
  }

  const tier = tierMapping[legacy.tier?.toLowerCase() || 'basic'] || 'BASIC';
  const status = statusMapping[legacy.status?.toLowerCase() || 'pending'] || 'PENDING';
  const category = mapCategory(legacy.category);

  // Generate deterministic ID
  const providerId = `legacy_provider_${legacy.id}_${createHash('sha256').update(legacy.company_name).digest('hex').slice(0, 8)}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create provider: ${legacy.company_name} (${category})`);
    return true;
  }

  try {
    await newDb.serviceProvider.create({
      data: {
        id: providerId,
        userId: user.id,
        companyName: legacy.company_name,
        slug,
        category,
        subcategories: legacy.subcategories || [],
        tagline: legacy.tagline,
        description: legacy.description,
        website: legacy.website,
        phone: legacy.phone,
        email: legacy.email,
        address: legacy.address,
        address2: legacy.address2,
        city: legacy.city,
        state: legacy.state,
        postalCode: legacy.postal_code,
        country: legacy.country || 'US',
        linkedIn: legacy.linkedin,
        twitter: legacy.twitter,
        tier,
        status,
        visible: legacy.is_visible,
        featured: legacy.is_featured,
        viewCount: legacy.view_count,
        contactCount: legacy.contact_count,
        createdAt: legacy.created_at,
        updatedAt: legacy.updated_at,
      },
    });

    // Update user role to SERVICE_PROVIDER if not already
    if (user.role !== 'SERVICE_PROVIDER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await newDb.user.update({
        where: { id: user.id },
        data: { role: 'SERVICE_PROVIDER' },
      });
    }

    console.log(`  Migrated: ${legacy.company_name} (${category})`);
    return true;
  } catch (error) {
    throw new Error(`Failed to migrate ${legacy.company_name}: ${error}`);
  }
}

async function runMigration(): Promise<MigrationResult> {
  console.log('='.repeat(60));
  console.log('HedgeCo Legacy Service Provider Migration');
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
    const providers = await fetchLegacyProviders(offset, BATCH_SIZE);

    if (providers.length === 0) {
      hasMore = false;
      break;
    }

    for (const provider of providers) {
      result.total++;
      try {
        const migrated = await migrateProvider(provider);
        if (migrated) {
          result.migrated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push({
          name: provider.company_name,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`  ERROR: ${error}`);
      }
    }

    offset += BATCH_SIZE;
    hasMore = providers.length === BATCH_SIZE;
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
