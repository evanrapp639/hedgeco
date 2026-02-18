# HedgeCo.Net Deployment Guide

## Architecture Overview

```
Monorepo Structure:
├── apps/
│   ├── web/          # Next.js 14 frontend → Vercel
│   ├── api/          # Hono/tRPC API → Railway
│   ├── kernel/       # Operations Kernel → Railway (always-on)
│   └── workers/      # BullMQ workers → Railway (3 replicas)
└── packages/
    ├── db/          # Prisma schema + client
    ├── shared/      # Zod schemas, types, utils
    ├── ai/          # Embeddings, RAG, model router
    └── email/       # React Email templates
```

## Prerequisites

1. **GitHub Account** (for repository)
2. **Vercel Account** (for frontend)
3. **Railway Account** (for backend services)
4. **Upstash Account** (for Redis)
5. **Neon Account** (for PostgreSQL with pgvector)

## Step 1: Set Up Infrastructure

### 1.1 Upstash Redis
1. Go to [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Choose region closest to your users (US-East recommended)
4. Enable AOF persistence (default)
5. Copy connection details:
   - `REDIS_HOST`
   - `REDIS_PORT` 
   - `REDIS_PASSWORD`

### 1.2 Neon PostgreSQL
1. Go to [Neon](https://neon.tech/)
2. Create a new project
3. Enable pgvector extension
4. Copy connection string: `DATABASE_URL`

### 1.3 Resend (Email)
1. Go to [Resend](https://resend.com/)
2. Create API key
3. Verify sending domain `hedgeco.net`
4. Copy: `RESEND_API_KEY`

## Step 2: Deploy to Railway

### 2.1 Kernel Service
```bash
# From Railway dashboard
railway init --name hedgeco-kernel
railway link hedgeco-kernel
railway add --service kernel
railway variables set \
  REDIS_HOST="your-upstash-host" \
  REDIS_PORT="6379" \
  REDIS_PASSWORD="your-upstash-password" \
  API_KEYS="scooby-key,shaggy-key,daphne-key,velma-key,fred-key" \
  ALLOWED_ORIGINS="https://hedgeco.net,https://staging.hedgeco.net"
railway deploy
```

### 2.2 Workers
```bash
railway add --service workers --replicas 3
railway variables set \
  REDIS_HOST="your-upstash-host" \
  REDIS_PASSWORD="your-upstash-password" \
  DATABASE_URL="your-neon-connection-string" \
  RESEND_API_KEY="your-resend-key" \
  OPENAI_API_KEY="your-openai-key"
railway deploy
```

### 2.3 API Service
```bash
railway add --service api
railway variables set \
  DATABASE_URL="your-neon-connection-string" \
  JWT_SECRET="generate-with-openssl-rand-hex-32" \
  RESEND_API_KEY="your-resend-key" \
  KERNEL_URL="https://hedgeco-kernel.up.railway.app" \
  KERNEL_API_KEY="scooby-key"
railway deploy
```

## Step 3: Deploy to Vercel

### 3.1 Frontend
```bash
# Connect GitHub repo to Vercel
# Select apps/web as root directory
# Add environment variables:
NEXT_PUBLIC_APP_URL="https://hedgeco.net"
NEXT_PUBLIC_API_URL="https://hedgeco-api.up.railway.app"
NEXTAUTH_URL="https://hedgeco.net"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## Step 4: Configure DNS

### 4.1 Domain Setup
```
hedgeco.net → Vercel (A record)
api.hedgeco.net → Railway (CNAME)
kernel.hedgeco.net → Railway (CNAME)
```

### 4.2 SSL Certificates
- Vercel: Automatic SSL
- Railway: Automatic SSL with custom domains

## Step 5: Database Migration

### 5.1 Initial Setup
```bash
cd packages/db
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 5.2 Ongoing Migrations
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Deploy migration
npx prisma migrate deploy
```

## Step 6: Agent Configuration

### 6.1 API Keys
Generate unique API keys for each agent:
```bash
# Generate keys
openssl rand -hex 32
# scooby-key: 4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
# shaggy-key: 5b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c
# etc.
```

### 6.2 Agent Endpoints
```
Kernel: https://kernel.hedgeco.net
- POST /action
- POST /email/safe-send
- GET /audit
- GET /job/:id
```

## Step 7: Monitoring & Alerts

### 7.1 Railway Metrics
- CPU/Memory usage
- Request latency
- Error rates

### 7.2 Upstash Metrics
- Redis memory usage
- Command latency
- Connection count

### 7.3 Vercel Analytics
- Page views
- Web vitals
- Error tracking

## Step 8: Backup Strategy

### 8.1 Database Backups
- Neon: Automatic daily backups
- Retention: 7 days

### 8.2 Redis Persistence
- Upstash: AOF enabled
- Point-in-time recovery available

### 8.3 File Storage
- Cloudflare R2 for uploads
- Versioning enabled

## Environment Variables Reference

### Kernel Service
```env
PORT=3001
NODE_ENV=production
REDIS_HOST=redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
API_KEYS=key1,key2,key3
ALLOWED_ORIGINS=https://hedgeco.net,https://staging.hedgeco.net
```

### Workers
```env
NODE_ENV=production
REDIS_HOST=redis-host.upstash.io
REDIS_PASSWORD=your-password
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### API Service
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=re_xxxxx
KERNEL_URL=https://kernel.hedgeco.net
KERNEL_API_KEY=your-kernel-key
```

### Web Frontend
```env
NEXT_PUBLIC_APP_URL=https://hedgeco.net
NEXT_PUBLIC_API_URL=https://api.hedgeco.net
NEXTAUTH_URL=https://hedgeco.net
NEXTAUTH_SECRET=your-nextauth-secret
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Upstash credentials
   - Verify network access
   - Check Redis memory usage

2. **Database Connection Issues**
   - Verify Neon connection string
   - Check pgvector extension
   - Monitor connection pool

3. **Kernel API Errors**
   - Verify API keys
   - Check CORS settings
   - Review audit logs

4. **Email Delivery Failed**
   - Check Resend API key
   - Verify domain verification
   - Review spam filters

### Logs & Debugging

```bash
# Railway logs
railway logs --service kernel
railway logs --service workers
railway logs --service api

# Vercel logs
vercel logs hedgeco.net

# Upstash metrics
# Dashboard → Metrics

# Neon metrics  
# Dashboard → Metrics
```

## Scaling Considerations

### Vertical Scaling
- Kernel: 1GB RAM → 2GB RAM (if queue depth > 1000)
- Workers: 1GB RAM → 2GB RAM (if processing slow)
- Redis: 256MB → 1GB (if memory usage > 80%)

### Horizontal Scaling
- Workers: 3 replicas → 5 replicas (if queue latency > 5s)
- API: 1 replica → 2 replicas (if RPS > 100)

### Cost Optimization
- Use Neon's autoscaling
- Enable Upstash's pay-per-request
- Use Vercel's Hobby plan for staging

## Security Checklist

- [ ] API keys rotated quarterly
- [ ] Database backups tested
- [ ] SSL certificates valid
- [ ] Rate limiting enabled
- [ ] Audit logs reviewed weekly
- [ ] Security headers configured
- [ ] Dependencies updated monthly
- [ ] Penetration testing scheduled

## Support & Maintenance

### Daily
- Review audit logs
- Check queue depths
- Monitor error rates

### Weekly
- Review security logs
- Update dependencies
- Test backup restoration

### Monthly
- Rotate API keys
- Security audit
- Performance review

## Emergency Contacts

- Infrastructure: Railway Support
- Database: Neon Support  
- Redis: Upstash Support
- DNS: Domain registrar
- SSL: Let's Encrypt