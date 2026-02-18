# Bundle Analysis Report

> Last updated: February 2025

## Overview

This document contains bundle analysis findings and recommendations for the HedgeCo application.

## Running Bundle Analysis

```bash
# Generate bundle analysis report
ANALYZE=true npm run build

# Reports will be generated at:
# - .next/analyze/client.html (client-side bundles)
# - analyze/server.html (server-side bundles)
```

## Current Bundle Sizes

### Client-Side Chunks

| Chunk | Size (gzip) | Status |
|-------|-------------|--------|
| Main bundle | ~85KB | 🟡 Monitor |
| Framework (React) | ~45KB | ✅ Good |
| Commons | ~30KB | ✅ Good |
| Pages (avg) | ~15KB | ✅ Good |

### Largest Dependencies

1. **recharts** (~40KB gzip) - Charts library
2. **@radix-ui/*** (~25KB gzip) - UI primitives
3. **@react-pdf/renderer** (~35KB gzip) - PDF generation
4. **lucide-react** (~15KB gzip) - Icons
5. **date-fns** (~10KB gzip) - Date utilities

## Recommendations for Code Splitting

### 1. Dynamic Imports for Heavy Components

```typescript
// Instead of:
import { AreaChart } from 'recharts';

// Use:
const AreaChart = dynamic(() => 
  import('recharts').then(mod => mod.AreaChart),
  { loading: () => <ChartSkeleton /> }
);
```

### 2. Route-Based Code Splitting

Next.js automatically code-splits by route. Ensure heavy admin features stay in `/admin/*` routes.

### 3. Component-Level Splitting

**Candidates for dynamic import:**

- `@react-pdf/renderer` - Only load on PDF generation pages
- `recharts` - Only load on dashboard/analytics pages
- `cmdk` - Only load when command palette is triggered
- Large modals/dialogs - Load on interaction

### 4. Package Import Optimization

Already configured in `next.config.mjs`:

```javascript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'recharts',
  ],
}
```

## Dynamic Import Opportunities

### High Priority

| Component/Feature | Current Load | Recommendation |
|------------------|--------------|----------------|
| PDF Export | Static | Dynamic on button click |
| Charts | Static | Dynamic with LazySection |
| Command Palette | Static | Dynamic on ⌘+K |
| Admin Tables | Static | Virtual scrolling |

### Medium Priority

| Component/Feature | Current Load | Recommendation |
|------------------|--------------|----------------|
| Date Picker | Static | Could be lazy |
| Rich Dialogs | Static | Load on trigger |
| Dropdown Menus | Static | Acceptable |

## Tree Shaking Verification

Ensure these patterns for effective tree shaking:

```typescript
// ✅ Good - named imports
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// ❌ Avoid - namespace imports
import * as Icons from 'lucide-react';
import * as dateFns from 'date-fns';
```

## Monitoring

### Key Metrics to Track

- **First Load JS**: Target < 100KB
- **Route-specific JS**: Target < 50KB per route
- **Largest Contentful Paint (LCP)**: Target < 2.5s
- **Time to Interactive (TTI)**: Target < 3.5s

### Recommended Tools

1. **Lighthouse** - Overall performance audit
2. **Bundle Analyzer** - Visual bundle inspection
3. **Import Cost** (VS Code) - Real-time import size feedback
4. **web-vitals** - Core Web Vitals monitoring (implemented)

## Action Items

- [ ] Implement dynamic import for PDF renderer
- [ ] Add LazySection wrapper to chart components
- [ ] Review and split any remaining barrel exports
- [ ] Set up performance budget in CI/CD
- [ ] Monitor bundle sizes on each PR

## Historical Data

Track bundle size changes over time:

| Date | Main Bundle | Total JS |
|------|-------------|----------|
| Feb 2025 | ~85KB | ~180KB |
| (baseline) | - | - |
