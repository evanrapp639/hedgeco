# HedgeCo.Net Deployment Guide

Complete guide for deploying HedgeCo.Net to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Railway](#railway)
  - [Self-Hosted](#self-hosted)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed locally (for build testing)
- [ ] PostgreSQL database provisioned
- [ ] Git repository set up
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (auto-provisioned by most platforms)

---

## Environment Setup

### 1. Generate Secrets

Generate secure secrets for JWT tokens:

```bash
# Generate JWT secret (64 characters hex)
openssl rand -hex 32

# Generate JWT refresh secret
openssl rand -hex 32
```

### 2. Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for signing JWT tokens | `(64 char hex string)` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `(64 char hex string)` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `https://hedgeco.net` |

### 3. Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `CORS_ORIGINS` | Allowed CORS origins | App URL |

See `.env.example` for the complete list.

---

## Database Setup

### 1. Create PostgreSQL Database

**Using Vercel Postgres:**
```bash
# Install Vercel CLI
npm i -g vercel

# Create database
vercel postgres create hedgeco-db
```

**Using Railway:**
```bash
# Create via Railway dashboard or CLI
railway add -d postgresql
```

**Using Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings > Database

### 2. Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npx prisma migrate deploy
```

### 3. Seed Database (Optional)

```bash
# Seed with initial data
npm run db:seed
```

---

## Deployment Options

### Vercel (Recommended)

Vercel provides the best experience for Next.js applications.

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select the `app` directory as root

#### Step 2: Configure Build Settings

Vercel auto-detects Next.js. Verify:
- **Framework Preset:** Next.js
- **Build Command:** `prisma generate && next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

#### Step 3: Add Environment Variables

In Project Settings > Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-secret
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Step 4: Deploy

```bash
# Deploy via CLI
vercel --prod

# Or push to main branch for auto-deploy
git push origin main
```

#### Step 5: Configure Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

---

### Railway

Railway is a great alternative with simple PostgreSQL integration.

#### Step 1: Create Project

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Select the repository

#### Step 2: Add PostgreSQL

1. Click "New" > "Database" > "PostgreSQL"
2. Railway auto-links the `DATABASE_URL`

#### Step 3: Configure Environment

Add variables in the service settings:

```
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-secret
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

#### Step 4: Deploy

Railway auto-deploys on push. Manual deploy:

```bash
railway up
```

---

### Self-Hosted

For self-hosted deployments on a VPS or dedicated server.

#### Step 1: Server Requirements

- Ubuntu 22.04+ or similar
- Node.js 18+ (use nvm)
- PostgreSQL 14+
- Nginx (reverse proxy)
- PM2 (process manager)

#### Step 2: Install Dependencies

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt-get install nginx
```

#### Step 3: Clone and Build

```bash
# Clone repository
git clone https://github.com/your-org/hedgeco.git
cd hedgeco/app

# Install dependencies
npm install

# Build application
npm run build
```

#### Step 4: Configure Environment

```bash
# Create .env.local
cp .env.example .env.local
nano .env.local  # Edit with your values
```

#### Step 5: Start with PM2

```bash
# Start application
pm2 start npm --name "hedgeco" -- start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

#### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/hedgeco`:

```nginx
server {
    listen 80;
    server_name hedgeco.net www.hedgeco.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/hedgeco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 7: SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d hedgeco.net -d www.hedgeco.net
```

---

## Post-Deployment

### Verification Checklist

After deployment, verify:

- [ ] **Homepage loads** - Visit your domain
- [ ] **Authentication works** - Test login/register flows
- [ ] **Database connected** - Users can be created
- [ ] **API endpoints respond** - Test `/api/trpc/*`
- [ ] **Environment variables set** - No missing variable errors
- [ ] **HTTPS working** - SSL certificate valid
- [ ] **Static assets load** - CSS, JS, images working

### Run Health Check

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Run Database Migrations

If deploying an update with schema changes:

```bash
# Preview migrations
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy
```

### Seed Initial Admin User

```bash
# Via Prisma Studio
npx prisma studio

# Or via seed script
npm run db:seed
```

---

## Monitoring

### Recommended Tools

1. **Vercel Analytics** - Built-in for Vercel deployments
2. **Sentry** - Error tracking and monitoring
3. **LogTail/Papertrail** - Log aggregation
4. **Better Uptime/UptimeRobot** - Uptime monitoring

### Setup Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

Add to environment:
```
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Health Check Endpoint

Add `/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: Can't reach database server
```

**Solution:**
1. Check `DATABASE_URL` format
2. Verify database is running
3. Check network/firewall rules
4. Ensure SSL mode if required (`?sslmode=require`)

#### Build Failed - Prisma Generate

```
Error: Prisma schema not found
```

**Solution:**
```bash
# Ensure prisma schema exists
ls prisma/schema.prisma

# Regenerate client
npx prisma generate
```

#### JWT Errors

```
Error: jwt must be provided
```

**Solution:**
1. Check `JWT_SECRET` is set
2. Ensure it's at least 32 characters
3. Verify no trailing whitespace

#### Static Assets 404

```
Failed to load resource: 404
```

**Solution:**
1. Check `.next` directory was built
2. Verify `output` setting in `next.config.js`
3. Clear CDN cache if using one

### Getting Help

1. Check [Next.js docs](https://nextjs.org/docs)
2. Review deployment platform documentation
3. Open an issue in the repository

---

## Security Notes

Before going live:

1. **Change all default secrets** - Never use example values
2. **Enable HTTPS** - Required for secure cookies
3. **Review CORS settings** - Limit to your domain
4. **Set up rate limiting** - Protect against abuse
5. **Configure CSP headers** - Prevent XSS attacks
6. **Regular dependency updates** - Run `npm audit` periodically

See [SECURITY.md](./SECURITY.md) for detailed security configuration.
