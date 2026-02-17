# Environment Variables Guide

Complete reference for all environment variables used in HedgeCo.Net.

## Table of Contents

- [Quick Start](#quick-start)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Settings](#environment-specific-settings)
- [Security Best Practices](#security-best-practices)

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Set required variables (minimum for local dev):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hedgeco"
   JWT_SECRET="local-dev-secret-change-in-production"
   JWT_REFRESH_SECRET="local-dev-refresh-secret-change-in-production"
   ```

3. Start development:
   ```bash
   npm run dev
   ```

---

## Required Variables

These must be set for the application to function.

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

**Production recommendations:**
- Use connection pooling (PgBouncer)
- Enable SSL: `?sslmode=require`
- Use separate read replicas for analytics

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing access tokens | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `openssl rand -hex 32` |

**⚠️ Critical:** Never use default values in production. Generate unique secrets:

```bash
openssl rand -hex 32
```

---

## Optional Variables

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public application URL |
| `LOG_LEVEL` | `debug` | Logging verbosity (debug/info/warn/error) |
| `PORT` | `3000` | Server port |

### Token Expiration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

### Redis (Caching & Rate Limiting)

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | - | Redis connection string |
| `REDIS_REQUIRED` | `false` | Fail health check if Redis unavailable |

**Example:** `redis://localhost:6379` or `redis://:password@host:6379`

### Email (Notifications)

Choose one provider:

**Resend:**
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |

**SendGrid:**
| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |

**SMTP:**
| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `EMAIL_FROM` | From address for emails |

### File Storage (S3/R2)

**AWS S3:**
| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET` | S3 bucket name |

**Cloudflare R2:**
| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | R2 bucket name |

### Payments (Stripe)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public key (`pk_...`) |
| `STRIPE_PRICE_BASIC` | Price ID for Basic tier |
| `STRIPE_PRICE_PRO` | Price ID for Pro tier |
| `STRIPE_PRICE_ENTERPRISE` | Price ID for Enterprise tier |

### Monitoring & Analytics

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry server-side DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client-side DSN |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window size in ms |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed origins (comma-separated) |
| `CSP_REPORT_URI` | - | CSP violation report endpoint |

### Testing

| Variable | Description |
|----------|-------------|
| `TEST_USER_EMAIL` | E2E test user email |
| `TEST_USER_PASSWORD` | E2E test user password |
| `TEST_ADMIN_EMAIL` | E2E test admin email |
| `TEST_ADMIN_PASSWORD` | E2E test admin password |
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_MESSAGING_ENABLED` | `true` | Enable messaging feature |
| `FEATURE_ANALYTICS_ENABLED` | `true` | Enable analytics feature |
| `FEATURE_DOCUMENT_UPLOADS_ENABLED` | `true` | Enable document uploads |

---

## Environment-Specific Settings

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hedgeco
LOG_LEVEL=debug
```

### Staging

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.hedgeco.net
DATABASE_URL=postgresql://user:pass@staging-db:5432/hedgeco?sslmode=require
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=info
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://hedgeco.net
DATABASE_URL=postgresql://user:pass@prod-db:5432/hedgeco?sslmode=require
REDIS_URL=redis://:password@prod-redis:6379
REDIS_REQUIRED=true
LOG_LEVEL=info

# Strong secrets (generated with openssl rand -hex 32)
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>

# Production Stripe keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Security Best Practices

### Do's ✅

- **Generate unique secrets** for each environment
- **Use SSL/TLS** for all database connections in production
- **Rotate secrets** periodically (every 90 days recommended)
- **Use environment-specific credentials** (never share between dev/staging/prod)
- **Store production secrets** in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- **Audit access** to production credentials

### Don'ts ❌

- **Never commit `.env` files** to version control
- **Never log secrets** or include them in error messages
- **Never use default/example secrets** in production
- **Never share credentials** via email or chat
- **Never expose server-side secrets** to the client (`NEXT_PUBLIC_*` only for public data)

### Secret Generation

```bash
# Generate secure random secrets
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variable Checklist

Before deploying to production:

- [ ] All required variables are set
- [ ] JWT secrets are unique and secure
- [ ] Database URL uses SSL (`?sslmode=require`)
- [ ] Stripe uses live keys (not test keys)
- [ ] Sentry DSN is configured
- [ ] CORS origins are correctly set
- [ ] Feature flags are reviewed
- [ ] No default/example values remain
