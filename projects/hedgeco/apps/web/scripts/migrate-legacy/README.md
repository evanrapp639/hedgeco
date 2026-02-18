# Legacy Database Migration Scripts

Scripts for migrating data from the legacy HedgeCo database to the new v2 schema.

## Prerequisites

1. **New database ready**: Ensure the new Prisma schema has been migrated:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Legacy database access**: You'll need read access to the legacy PostgreSQL database.

3. **Dependencies**: Install the PostgreSQL client:
   ```bash
   npm install pg @types/pg
   ```

## Environment Setup

Set the legacy database connection string:

```bash
export LEGACY_DB_URL="postgresql://user:password@host:5432/legacy_hedgeco"
```

## Migration Order

**Important**: Run migrations in this order to respect foreign key relationships:

1. **Users first** — Funds and providers depend on users
2. **Funds second** — Can run after users
3. **Providers third** — Can run after users

```bash
# Step 1: Migrate users
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-users.ts

# Step 2: Migrate funds (optionally with historical returns)
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-funds.ts --with-returns

# Step 3: Migrate service providers
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-providers.ts
```

## Command-Line Options

All scripts support these options:

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without writing to database | false |
| `--batch=N` | Process N records per batch | 100 (users), 50 (funds/providers) |
| `--skip=N` | Skip the first N records | 0 |

### Fund-specific options:

| Option | Description | Default |
|--------|-------------|---------|
| `--with-returns` | Include historical return data | false |

## Examples

### Dry run to preview changes
```bash
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-users.ts --dry-run
```

### Resume from a specific offset
```bash
# Resume user migration from record 500
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-users.ts --skip=500
```

### Smaller batches for large datasets
```bash
# Use smaller batches to avoid memory issues
LEGACY_DB_URL="..." npx ts-node scripts/migrate-legacy/migrate-funds.ts --batch=25 --with-returns
```

## Data Mapping

### User Roles
| Legacy | New |
|--------|-----|
| investor | INVESTOR |
| fund_manager, hedge_fund_manager | MANAGER |
| service_provider | SERVICE_PROVIDER |
| news | NEWS_MEMBER |
| admin, super_admin | ADMIN |

### Fund Types
| Legacy | New |
|--------|-----|
| hedge_fund | HEDGE_FUND |
| private_equity | PRIVATE_EQUITY |
| venture_capital, vc | VENTURE_CAPITAL |
| real_estate | REAL_ESTATE |
| crypto, cryptocurrency | CRYPTO |
| fund_of_funds, fof | FUND_OF_FUNDS |
| credit | CREDIT |
| infrastructure | INFRASTRUCTURE |

### Fund Status
| Legacy | New |
|--------|-----|
| draft | DRAFT |
| pending, pending_review | PENDING_REVIEW |
| approved, active | APPROVED |
| rejected | REJECTED |
| suspended | SUSPENDED |
| closed | CLOSED |

### Provider Categories
| Legacy | New |
|--------|-----|
| legal, law_firm | Legal Services |
| accounting, audit, cpa | Accounting & Audit |
| prime_broker | Prime Brokerage |
| administrator, fund_admin | Fund Administration |
| technology, software | Technology |
| compliance, regulatory | Compliance |
| marketing, investor_relations | Marketing & IR |
| consulting | Consulting |
| tax | Tax Services |
| insurance | Insurance |
| recruiting, hr | Recruiting |
| data, analytics | Data & Analytics |
| research | Research |

## ID Generation

Migrated records use deterministic IDs that include the legacy ID for traceability:

- Users: `legacy_{id}_{hash8}`
- Funds: `legacy_fund_{id}_{hash8}`
- Providers: `legacy_provider_{id}_{hash8}`

This ensures:
1. Same legacy record always gets the same new ID
2. Re-running migration is idempotent
3. Easy to trace records back to legacy system

## Troubleshooting

### "Manager not found" errors
Ensure users are migrated before funds:
```bash
npx ts-node scripts/migrate-legacy/migrate-users.ts
# Then run fund migration
```

### Duplicate slug errors
The scripts skip records that already exist. To force re-migration, manually delete the conflicting records first.

### Memory issues with large datasets
Use smaller batch sizes:
```bash
--batch=25
```

### Connection timeouts
Increase PostgreSQL statement timeout in your connection string:
```
LEGACY_DB_URL="postgresql://...?statement_timeout=60000"
```

## Post-Migration Steps

After migration completes:

1. **Verify counts**:
   ```sql
   -- In new database
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Fund";
   SELECT COUNT(*) FROM "ServiceProvider";
   ```

2. **Recalculate fund statistics**:
   ```bash
   npx ts-node scripts/recalculate-stats.ts
   ```

3. **Regenerate embeddings** (if using vector search):
   ```bash
   npx ts-node scripts/generate-embeddings.ts
   ```

4. **Run data validation**:
   ```bash
   npx ts-node scripts/validate-migration.ts
   ```

## Support

If you encounter issues, check:
1. Database connection strings
2. Migration order (users → funds → providers)
3. Legacy table schema matches expected format
4. Sufficient permissions on both databases
