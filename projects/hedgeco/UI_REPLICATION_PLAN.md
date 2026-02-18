# UI Replication Plan for HedgeCo.Net

## Goal
**Exactly replicate** staging.hedgeco.net UI on EVERY page of the new Next.js application.

## Current Analysis
From staging.hedgeco.net analysis (2026-02-18):
- **Primary Colors**: Blue gradient theme
- **Logo**: HedgeCo.Net logo with hedgehog mascot
- **Layout**: Clean, professional financial services design
- **Stats**: 513K+ funds, 172+ professionals, $695M+ AUM, 82+ countries
- **Sections**: Hero, asset classes, news, features, stats, CTA

## Immediate Actions Required

### 1. **Get Exact Assets**
- [ ] Download logo from staging.hedgeco.net
- [ ] Extract exact color codes (CSS analysis)
- [ ] Capture font stack
- [ ] Download favicon
- [ ] Capture all icons used

### 2. **Update Global Styles**
- [ ] Update `globals.css` with exact colors
- [ ] Set up exact typography
- [ ] Configure Tailwind theme
- [ ] Add exact spacing/breakpoints

### 3. **Replicate Homepage**
- [ ] Hero section with exact copy
- [ ] Stats bar with real numbers
- [ ] Asset classes section (6 categories)
- [ ] News section (6 articles)
- [ ] Features section (6 features)
- [ ] CTA section

### 4. **Update All Existing Pages**
- [ ] Landing page (current `page.tsx`)
- [ ] Registration pages (4 types)
- [ ] Login page
- [ ] Dashboard pages
- [ ] Fund listing/detail pages
- [ ] Admin pages

### 5. **Create Missing Pages**
- [ ] News listing page
- [ ] News detail pages
- [ ] Asset class category pages
- [ ] About/Contact pages
- [ ] Terms/Privacy pages

## Color Scheme (To Be Extracted)

**From staging site analysis:**
- Primary Blue: `#1e40af` (approx)
- Secondary Blue: `#3b82f6` (approx)
- Dark Background: `#0f172a` (approx)
- Light Background: `#f8fafc` (approx)
- Text Colors: Various shades of gray/blue

**Action:** Use browser dev tools to extract exact colors.

## Typography

**From staging site:**
- Headings: Sans-serif (Inter/Roboto?)
- Body: Sans-serif
- Font weights: Regular, Medium, Bold

**Action:** Extract exact font stack.

## Layout Components to Replicate

### Header/Navigation
- Logo on left
- Main nav: Home, Funds, News, Providers, Conferences, About
- User menu on right (Login/Register)

### Footer
- Logo and tagline
- Quick links
- Contact info
- Social media
- Copyright

### Cards/Components
- Fund cards
- News cards
- Feature cards
- Stat cards
- CTA cards

## Implementation Steps

### Phase 1: Asset Collection (Today)
1. Use browser dev tools to extract:
   - Logo URL: `https://staging.hedgeco.net/images/logo.png`
   - CSS file: `https://staging.hedgeco.net/css/style.css`
   - Color variables
   - Font stack

2. Download assets:
   ```bash
   curl -o public/logo.png https://staging.hedgeco.net/images/logo.png
   curl -o public/favicon.ico https://staging.hedgeco.net/favicon.ico
   ```

### Phase 2: Global Styles Update (Today)
1. Update `tailwind.config.ts`:
   ```javascript
   colors: {
     hedgeco: {
       blue: '#1e40af',
       'blue-light': '#3b82f6',
       dark: '#0f172a',
       // etc.
     }
   }
   ```

2. Update `globals.css` with exact styles.

### Phase 3: Homepage Replication (Today)
1. Replace current `page.tsx` with exact replica
2. Use real data from staging site
3. Match spacing, typography, colors exactly

### Phase 4: Page-by-Page Update (This Week)
1. Update each page component
2. Ensure consistency
3. Test responsiveness

### Phase 5: Quality Assurance (This Week)
1. Pixel-perfect comparison
2. Cross-browser testing
3. Mobile responsiveness

## Technical Implementation

### File Structure Updates
```
apps/web/src/app/
├── layout.tsx              # Updated with exact header/footer
├── page.tsx               # Exact homepage replica
├── globals.css            # Exact styles
├── components/ui/         # Custom components matching design
└── [pages]/              # All other pages updated
```

### Component Updates
1. **Header Component**: Exact nav structure
2. **Footer Component**: Exact footer layout
3. **Card Components**: Match styling exactly
4. **Button Components**: Match colors, hover states

### Data Integration
1. Use real stats from staging site
2. Fetch real news articles
3. Use actual fund counts

## Success Criteria
- [ ] Homepage matches staging.hedgeco.net exactly
- [ ] All colors match exactly
- [ ] All typography matches exactly
- [ ] All spacing matches exactly
- [ ] All pages maintain consistency
- [ ] Mobile/desktop responsive matches

## Timeline
- **Today**: Assets + Homepage
- **Tomorrow**: Core pages (Funds, News, Register)
- **Day 3**: Remaining pages + polish
- **Day 4**: QA & fixes

## Notes
- **Critical**: Must match EXACTLY - this is a rebuild, not redesign
- **Priority**: Homepage first, then user-facing pages
- **Testing**: Compare side-by-side with staging site
- **Backup**: Keep original components until verified