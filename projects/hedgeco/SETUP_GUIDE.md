# HedgeCo.Net Setup Guide

## 🚀 Quick Start (15 minutes)

### Step 1: Create Upstash Redis (5 minutes)

1. **Sign up** at [Upstash](https://upstash.com/) (free tier available)
2. **Create Redis database**:
   - Name: `hedgeco-kernel`
   - Region: `us-east-1`
   - Memory: `256MB`
   - TLS: ✅ Enabled
   - Eviction: ❌ Disabled
   - Auto Scale: ❌ Disabled

3. **Copy credentials**:
   ```
   REDIS_HOST: [your-host].upstash.io
   REDIS_PORT: 6379
   REDIS_PASSWORD: [your-password]
   ```

### Step 2: Generate API Keys (2 minutes)

Run this in terminal:
```bash
# Generate agent API keys
echo "Scooby: $(openssl rand -hex 32)"
echo "Shaggy: $(openssl rand -hex 32)"
echo "Daphne: $(openssl rand -hex 32)"
echo "Velma: $(openssl rand -hex 32)"
echo "Fred: $(openssl rand -hex 32)"
```

### Step 3: Deploy Kernel to Railway (8 minutes)

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy kernel**:
   ```bash
   cd /home/node/.openclaw/workspace/projects/hedgeco/apps/kernel
   railway init --name hedgeco-kernel
   railway variables set \
     REDIS_HOST="[your-upstash-host]" \
     REDIS_PORT="6379" \
     REDIS_PASSWORD="[your-upstash-password]" \
     API_KEYS="[scooby-key],[shaggy-key],[daphne-key],[velma-key],[fred-key]" \
     ALLOWED_ORIGINS="*" \
     PORT="3001"
   railway deploy
   ```

3. **Get kernel URL**:
   ```bash
   railway status
   # Copy the URL (e.g., https://hedgeco-kernel.up.railway.app)
   ```

## ✅ Verification

Test your kernel:
```bash
curl https://hedgeco-kernel.up.railway.app/health
# Should return: {"status":"healthy","service":"hedgeco-kernel"}

curl -X POST https://hedgeco-kernel.up.railway.app/action \
  -H "X-Agent: scooby" \
  -H "Authorization: Bearer [scooby-key]" \
  -H "Content-Type: application/json" \
  -d '{"agent":"scooby","action":"test","entityId":"test","data":{}}'
# Should return job ID
```

## 🎯 Next Steps

1. **Update web app** to use kernel URL
2. **Deploy workers** (optional for now)
3. **Build approval dashboard**
4. **Route first approval** through kernel

## 🆘 Troubleshooting

### Kernel won't start
- Check Redis connection
- Verify API_KEYS format (comma-separated, no spaces)
- Check Railway logs: `railway logs`

### Redis connection failed
- Verify Upstash credentials
- Check TLS is enabled
- Test with: `redis-cli -h [host] -p 6379 -a [password] PING`

### API key rejected
- Ensure key is in API_KEYS list
- Check for trailing spaces
- Verify Authorization header format: `Bearer [key]`

## 📊 Monitoring

Once deployed:
1. **Upstash dashboard**: Check Redis memory/connections
2. **Railway dashboard**: Monitor CPU/memory
3. **Kernel health**: `/health` endpoint
4. **Audit logs**: `/audit` endpoint (coming soon)

## 🔄 Updates

To update kernel:
```bash
cd apps/kernel
git pull
railway deploy
```

## 📞 Support

- **Railway issues**: `railway support`
- **Upstash issues**: support@upstash.com
- **Architecture questions**: Check `ARCHITECTURE_FINAL.md`

---

**Time estimate**: 15 minutes to production kernel
**Cost estimate**: $0 (free tiers of Upstash + Railway)
**Risk level**: Low (isolated service, no data loss)