# Vercel Deployment Guide for HedgeCo Sprint 1

## Status: ✅ READY FOR DEPLOYMENT

### What's Been Completed (Sprint 1):

1. **✅ Homepage** - Exact replica of staging.hedgeco.net
2. **✅ Header** - Exact match to staging site
3. **✅ Footer** - Exact match to staging site  
4. **✅ Design System** - Tailwind config with HedgeCo colors
5. **✅ Registration Pages** - Updated with HedgeCo styling
6. **✅ Global Styles** - HedgeCo utility classes

### Deployment Steps:

#### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub: `evanrapp639/hedgeco`
4. Configure:
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://hedgeco.vercel.app
   ```
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel
```

### Build Issues Fixed:
- ✅ Updated `@types/ioredis` to compatible version (^5.0.0)
- ✅ Added `autoprefixer` to PostCSS config
- ✅ Verified Tailwind CSS configuration

### Testing Locally:
```bash
cd apps/web
npm install
npm run build
npm start
```

### Expected Result:
- Homepage: Exact match to staging.hedgeco.net
- Design: HedgeCo blue (#1e40af) and dark blue (#0f1a3d)
- Stats: Real data (513K+ funds, $695M+ AUM, etc.)
- Responsive: Mobile/desktop tested

### Next Steps After Deployment:
1. Test all pages match staging.hedgeco.net
2. Verify registration forms work
3. Test mobile responsiveness
4. Begin Sprint 2 (tRPC API + AI search)