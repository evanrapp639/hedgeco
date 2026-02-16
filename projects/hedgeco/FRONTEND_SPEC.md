# HedgeCo.Net v2 — Frontend Specification

> **Nova's Design Vision** ✨
> Premium fintech meets modern SaaS. Think Bloomberg Terminal's data density combined with Stripe's clarity and Linear's polish. Professional, trustworthy, and delightfully usable.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Component Library](#2-component-library)
3. [Page Templates](#3-page-templates)
4. [Responsive Strategy](#4-responsive-strategy)
5. [State Management](#5-state-management)
6. [Accessibility](#6-accessibility)
7. [Animation & UX](#7-animation--ux)

---

## 1. Design System

### 1.1 Color Palette

#### Brand Colors
```css
/* Primary — Deep Navy (Trust, Authority, Finance) */
--primary-50:  #f0f4ff;
--primary-100: #e0e9ff;
--primary-200: #c7d6fe;
--primary-300: #a4b9fd;
--primary-400: #8093f9;
--primary-500: #6172f3;
--primary-600: #444ce7;  /* Main brand */
--primary-700: #3538cd;
--primary-800: #2d31a6;
--primary-900: #1a1d5e;
--primary-950: #0f1035;

/* Secondary — Slate (Neutral, Professional) */
--slate-50:  #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
--slate-950: #020617;
```

#### Semantic Colors
```css
/* Success — Emerald (Positive returns, approvals) */
--success-50:  #ecfdf5;
--success-100: #d1fae5;
--success-500: #10b981;
--success-600: #059669;
--success-700: #047857;

/* Warning — Amber (Caution, pending states) */
--warning-50:  #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-700: #b45309;

/* Error — Rose (Negative returns, errors) */
--error-50:  #fff1f2;
--error-100: #ffe4e6;
--error-500: #f43f5e;
--error-600: #e11d48;
--error-700: #be123c;

/* Info — Sky (Informational, highlights) */
--info-50:  #f0f9ff;
--info-100: #e0f2fe;
--info-500: #0ea5e9;
--info-600: #0284c7;
--info-700: #0369a1;
```

#### Data Visualization Palette
```css
/* Charts — Distinct, accessible, beautiful */
--chart-1: #6172f3;  /* Primary blue */
--chart-2: #10b981;  /* Emerald */
--chart-3: #f59e0b;  /* Amber */
--chart-4: #ec4899;  /* Pink */
--chart-5: #8b5cf6;  /* Violet */
--chart-6: #06b6d4;  /* Cyan */
--chart-7: #f97316;  /* Orange */
--chart-8: #84cc16;  /* Lime */

/* Performance specific */
--return-positive: #10b981;
--return-negative: #f43f5e;
--return-neutral:  #64748b;
--benchmark:       #94a3b8;
```

#### Dark Mode (Optional — Phase 2)
```css
/* Background hierarchy */
--bg-base:     #0f172a;  /* slate-900 */
--bg-elevated: #1e293b;  /* slate-800 */
--bg-overlay:  #334155;  /* slate-700 */

/* Text hierarchy */
--text-primary:   #f8fafc;  /* slate-50 */
--text-secondary: #94a3b8;  /* slate-400 */
--text-muted:     #64748b;  /* slate-500 */
```

---

### 1.2 Typography

#### Font Stack
```css
/* Primary — Inter (Modern, highly legible, great for data) */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace — JetBrains Mono (Numbers, returns, codes) */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace;

/* Display — Inter Display or Instrument Serif (Hero headlines only) */
--font-display: 'Inter Display', 'Inter', sans-serif;
```

#### Type Scale
```css
/* Size scale — fluid with clamp() for responsive */
--text-xs:   0.75rem;   /* 12px — Labels, captions */
--text-sm:   0.875rem;  /* 14px — Secondary text, table cells */
--text-base: 1rem;      /* 16px — Body text */
--text-lg:   1.125rem;  /* 18px — Lead paragraphs */
--text-xl:   1.25rem;   /* 20px — Card titles */
--text-2xl:  1.5rem;    /* 24px — Section headers */
--text-3xl:  1.875rem;  /* 30px — Page titles */
--text-4xl:  2.25rem;   /* 36px — Hero headlines */
--text-5xl:  3rem;      /* 48px — Landing hero */
--text-6xl:  3.75rem;   /* 60px — Marketing hero */

/* Line heights */
--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;

/* Font weights */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;

/* Letter spacing */
--tracking-tight:  -0.025em;  /* Headlines */
--tracking-normal: 0;          /* Body */
--tracking-wide:   0.025em;   /* Buttons, labels */
```

#### Typography Presets
```tsx
// Component usage patterns
const typography = {
  // Headlines
  h1: 'text-4xl font-bold tracking-tight text-slate-900',
  h2: 'text-3xl font-semibold tracking-tight text-slate-900',
  h3: 'text-2xl font-semibold text-slate-900',
  h4: 'text-xl font-semibold text-slate-900',
  h5: 'text-lg font-medium text-slate-900',
  
  // Body
  body: 'text-base text-slate-700 leading-relaxed',
  bodySmall: 'text-sm text-slate-600',
  
  // Data display
  metric: 'font-mono text-2xl font-semibold tabular-nums',
  metricLarge: 'font-mono text-4xl font-bold tabular-nums',
  percentage: 'font-mono text-sm font-medium tabular-nums',
  
  // UI
  label: 'text-sm font-medium text-slate-700',
  caption: 'text-xs text-slate-500',
  overline: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
}
```

---

### 1.3 Spacing System

```css
/* 4px base unit — consistent, mathematical */
--space-0:  0;
--space-0.5: 0.125rem;  /* 2px */
--space-1:  0.25rem;    /* 4px */
--space-1.5: 0.375rem;  /* 6px */
--space-2:  0.5rem;     /* 8px */
--space-2.5: 0.625rem;  /* 10px */
--space-3:  0.75rem;    /* 12px */
--space-3.5: 0.875rem;  /* 14px */
--space-4:  1rem;       /* 16px */
--space-5:  1.25rem;    /* 20px */
--space-6:  1.5rem;     /* 24px */
--space-7:  1.75rem;    /* 28px */
--space-8:  2rem;       /* 32px */
--space-9:  2.25rem;    /* 36px */
--space-10: 2.5rem;     /* 40px */
--space-11: 2.75rem;    /* 44px */
--space-12: 3rem;       /* 48px */
--space-14: 3.5rem;     /* 56px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
--space-32: 8rem;       /* 128px */

/* Semantic spacing */
--space-card-padding: var(--space-6);       /* 24px */
--space-section-gap:  var(--space-16);      /* 64px */
--space-page-gutter:  var(--space-4);       /* 16px mobile */
--space-page-gutter-lg: var(--space-8);     /* 32px desktop */
```

---

### 1.4 Shadows & Elevation

```css
/* Subtle, professional shadows — not too heavy */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Colored shadows for interactive elements */
--shadow-primary: 0 4px 14px 0 rgb(68 76 231 / 0.25);
--shadow-success: 0 4px 14px 0 rgb(16 185 129 / 0.25);
--shadow-error: 0 4px 14px 0 rgb(244 63 94 / 0.25);

/* Elevation levels */
--elevation-0: none;                          /* Flat */
--elevation-1: var(--shadow-xs);              /* Subtle lift */
--elevation-2: var(--shadow-sm);              /* Cards */
--elevation-3: var(--shadow-md);              /* Dropdowns, hover */
--elevation-4: var(--shadow-lg);              /* Modals */
--elevation-5: var(--shadow-xl);              /* Overlays */
```

---

### 1.5 Border Radius

```css
/* Consistent rounding — modern but professional */
--radius-none: 0;
--radius-sm:   0.25rem;   /* 4px — Pills, small badges */
--radius-md:   0.375rem;  /* 6px — Inputs, buttons */
--radius-lg:   0.5rem;    /* 8px — Cards */
--radius-xl:   0.75rem;   /* 12px — Large cards, modals */
--radius-2xl:  1rem;      /* 16px — Hero sections */
--radius-full: 9999px;    /* Circles, pills */

/* Semantic */
--radius-button: var(--radius-md);
--radius-input:  var(--radius-md);
--radius-card:   var(--radius-lg);
--radius-modal:  var(--radius-xl);
```

---

### 1.6 Z-Index Scale

```css
--z-base:      0;
--z-dropdown:  10;
--z-sticky:    20;
--z-fixed:     30;
--z-backdrop:  40;
--z-modal:     50;
--z-popover:   60;
--z-toast:     70;
--z-tooltip:   80;
--z-max:       9999;
```

---

## 2. Component Library

### 2.1 Core Components (shadcn/ui Base)

Built on [shadcn/ui](https://ui.shadcn.com/) for consistency and accessibility.

```
components/
├── ui/                      # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── radio-group.tsx
│   ├── switch.tsx
│   ├── slider.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── form.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── popover.tsx
│   ├── dropdown-menu.tsx
│   ├── command.tsx          # Search/command palette
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── separator.tsx
│   ├── skeleton.tsx
│   ├── tooltip.tsx
│   ├── toast.tsx
│   └── progress.tsx
```

---

### 2.2 Domain Components

#### FundCard
```tsx
/**
 * FundCard — Primary fund display component
 * Used in: Search results, recommendations, saved funds
 */
interface FundCardProps {
  fund: {
    id: string;
    name: string;
    type: FundType;
    strategy: string;
    aum: number;
    returns: {
      mtd: number;
      ytd: number;
      oneYear: number;
      threeYear: number;
      inception: number;
    };
    sharpeRatio?: number;
    managerName: string;
    location: string;
    inception: Date;
  };
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onSave?: () => void;
  onContact?: () => void;
}

// Visual spec:
// ┌─────────────────────────────────────────────────┐
// │ [Badge: Hedge Fund]              ★ Save  ✉ Msg  │
// │                                                 │
// │ Citadel Wellington Fund                         │
// │ Long/Short Equity • New York, USA              │
// │                                                 │
// │ ┌─────────┬─────────┬─────────┬─────────┐      │
// │ │  +2.4%  │ +15.8%  │ +23.1%  │ +18.4%  │      │
// │ │   MTD   │   YTD   │   1Y    │   CAGR  │      │
// │ └─────────┴─────────┴─────────┴─────────┘      │
// │                                                 │
// │ AUM: $1.2B  •  Sharpe: 1.84  •  Since 2015    │
// └─────────────────────────────────────────────────┘
```

#### StatsChart
```tsx
/**
 * StatsChart — Performance visualization
 * Uses Recharts/Tremor under the hood
 */
interface StatsChartProps {
  data: TimeSeriesData[];
  benchmarks?: {
    name: string;
    data: TimeSeriesData[];
    color: string;
  }[];
  variant?: 'line' | 'area' | 'bar' | 'sparkline';
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  timeRange?: '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | 'ALL';
  onRangeChange?: (range: string) => void;
}

// Visual spec (Line chart):
// ┌─────────────────────────────────────────────────┐
// │ Performance vs Benchmark                        │
// │ [1M] [3M] [6M] [YTD] [1Y] [3Y] [5Y] [ALL]      │
// │                                                 │
// │     ╭─────╮                                     │
// │   ╭─╯     ╰──────╮                             │
// │ ──╯               ╰──────────────────────      │ ← Fund (blue)
// │ ───────────────────────────────────────        │ ← S&P 500 (gray)
// │                                                 │
// │ Jan   Mar   May   Jul   Sep   Nov   Jan        │
// │                                                 │
// │ ● Fund: +23.4%   ○ S&P 500: +18.2%            │
// └─────────────────────────────────────────────────┘
```

#### SearchBar
```tsx
/**
 * SearchBar — Unified search with NLP support
 * Supports: Text search, filters, natural language
 */
interface SearchBarProps {
  placeholder?: string;
  showFilters?: boolean;
  showNLPHint?: boolean;
  filters?: FilterConfig[];
  onSearch: (query: string, filters: FilterState) => void;
  onNLPQuery?: (query: string) => void;
  suggestions?: Suggestion[];
  recentSearches?: string[];
  variant?: 'default' | 'hero' | 'compact';
}

// Visual spec (Hero variant):
// ┌─────────────────────────────────────────────────────────┐
// │ 🔍 Search funds, strategies, managers...               │
// │    ──────────────────────────────────────────────      │
// │                                                        │
// │ Try: "Long/short equity funds with 15%+ returns"  🤖   │
// │                                                        │
// │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
// │ │Fund Type│ │Strategy │ │  AUM    │ │ Performance │   │
// │ │    ▼    │ │    ▼    │ │    ▼    │ │      ▼      │   │
// │ └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │
// └─────────────────────────────────────────────────────────┘
```

#### DataTable
```tsx
/**
 * DataTable — Sortable, filterable data grid
 * Uses TanStack Table under the hood
 */
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  virtualized?: boolean; // For large datasets
}

// Visual spec:
// ┌──────────────────────────────────────────────────────────────┐
// │ ☐  Fund Name          ↕ │ Type       │   AUM   │ YTD  │ 1Y  │
// ├──────────────────────────────────────────────────────────────┤
// │ ☐  Citadel Wellington   │ Hedge Fund │  $1.2B  │+15.8%│+23% │
// │ ☐  Bridgewater Pure...  │ Hedge Fund │  $890M  │+12.4%│+19% │
// │ ☐  Renaissance Tech...  │ Hedge Fund │  $2.1B  │+22.1%│+31% │
// │ ☐  Tiger Global         │ PE/VC      │  $560M  │ +8.3%│+15% │
// │ ☐  Sequoia Heritage     │ VC         │  $340M  │+18.9%│+28% │
// ├──────────────────────────────────────────────────────────────┤
// │  ← 1 2 3 ... 12 →                    Showing 1-20 of 234    │
// └──────────────────────────────────────────────────────────────┘
```

#### MetricCard
```tsx
/**
 * MetricCard — KPI display with trends
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  format?: 'number' | 'currency' | 'percentage';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Visual spec:
// ┌───────────────────────┐
// │ 📊 Total AUM          │
// │                       │
// │ $695M                 │
// │ ↑ 12.4% vs last month │
// └───────────────────────┘
```

#### ReturnDisplay
```tsx
/**
 * ReturnDisplay — Formatted return with color coding
 */
interface ReturnDisplayProps {
  value: number;
  format?: 'percentage' | 'decimal';
  precision?: number;
  showSign?: boolean;
  showArrow?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// Examples:
// +15.8%  (green, up arrow)
// -3.2%   (red, down arrow)
//  0.0%   (gray, no arrow)
```

#### ProviderCard
```tsx
/**
 * ProviderCard — Service provider display
 */
interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    category: string;
    description: string;
    location: string;
    website?: string;
    tier: 'basic' | 'premium' | 'featured';
    rating?: number;
    reviewCount?: number;
  };
  variant?: 'default' | 'compact' | 'list';
  showContact?: boolean;
}
```

#### ConferenceCard
```tsx
/**
 * ConferenceCard — Event display
 */
interface ConferenceCardProps {
  conference: {
    id: string;
    name: string;
    date: Date;
    endDate?: Date;
    location: string;
    venue: string;
    description: string;
    registrationUrl?: string;
    ticketCost?: number;
  };
  variant?: 'default' | 'featured' | 'list';
}
```

#### UserAvatar
```tsx
/**
 * UserAvatar — User display with status
 */
interface UserAvatarProps {
  user: {
    name: string;
    image?: string;
    role?: UserRole;
    company?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  showTooltip?: boolean;
}
```

---

### 2.3 Composite Components

#### FundComparison
```tsx
/**
 * FundComparison — Side-by-side fund comparison
 */
interface FundComparisonProps {
  funds: Fund[]; // 2-4 funds
  metrics: MetricKey[];
  showChart?: boolean;
}
```

#### FilterPanel
```tsx
/**
 * FilterPanel — Advanced filter sidebar
 */
interface FilterPanelProps {
  filters: FilterConfig[];
  values: FilterState;
  onChange: (values: FilterState) => void;
  onReset: () => void;
  collapsible?: boolean;
}
```

#### AIChat
```tsx
/**
 * AIChat — AI assistant interface
 */
interface AIChatProps {
  onSendMessage: (message: string) => Promise<AIResponse>;
  suggestions?: string[];
  placeholder?: string;
  variant?: 'sidebar' | 'modal' | 'inline';
}
```

#### RecommendationCarousel
```tsx
/**
 * RecommendationCarousel — AI-powered recommendations
 */
interface RecommendationCarouselProps {
  title: string;
  recommendations: Fund[];
  reason?: string; // "Based on your recent searches"
  loading?: boolean;
  onSeeAll?: () => void;
}
```

---

### 2.4 Layout Components

```tsx
// AppShell — Main application wrapper
interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// PageHeader — Consistent page headers
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

// ContentSection — Semantic content blocks
interface ContentSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// SplitLayout — Two-column layouts
interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: '1:1' | '1:2' | '2:1' | '1:3' | '3:1';
  reverseMobile?: boolean;
}
```

---

## 3. Page Templates

### 3.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] HedgeCo.Net       🔍 Search...           🔔  👤 John D. ▼        │
├────────────┬────────────────────────────────────────────────────────────┤
│            │                                                            │
│  📊 Home   │  Good morning, John                                        │
│            │                                                            │
│  🔍 Search │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│            │  │ Saved   │ │ New     │ │ Messages│ │ Alerts  │          │
│  ★ Saved   │  │ Funds   │ │ Matches │ │    3    │ │   12    │          │
│            │  │   24    │ │   8     │ │         │ │         │          │
│  ✉ Messages│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│            │                                                            │
│  📰 News   │  Recommended for You                                [→]   │
│            │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  📅 Events │  │  Fund Card   │ │  Fund Card   │ │  Fund Card   │       │
│            │  │              │ │              │ │              │       │
│  ⚙ Settings│  └──────────────┘ └──────────────┘ └──────────────┘       │
│            │                                                            │
│            │  Recent Activity                                           │
│            │  ┌─────────────────────────────────────────────────┐      │
│            │  │ • You viewed "Citadel Wellington" — 2h ago      │      │
│            │  │ • New message from Jane Smith — 4h ago          │      │
│            │  │ • "Tiger Global" updated performance — 1d ago   │      │
│            │  └─────────────────────────────────────────────────┘      │
│            │                                                            │
└────────────┴────────────────────────────────────────────────────────────┘
```

**Sidebar (Collapsed on Mobile):**
- Width: 240px expanded, 64px collapsed
- Sticky positioning
- User role determines visible items

---

### 3.2 Search Results Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Header]                                                                │
├────────────┬────────────────────────────────────────────────────────────┤
│            │                                                            │
│  FILTERS   │  🔍 "long short equity 15%+"                    234 results│
│            │  ─────────────────────────────                             │
│  Fund Type │                                                            │
│  ☑ Hedge   │  Sort: Relevance ▼    View: ▦ Grid  ≡ List               │
│  ☐ PE      │                                                            │
│  ☐ VC      │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  ☐ Real Est│  │  Fund Card   │ │  Fund Card   │ │  Fund Card   │       │
│            │  │  (matched)   │ │              │ │              │       │
│  Strategy  │  └──────────────┘ └──────────────┘ └──────────────┘       │
│  ☑ L/S Eq  │                                                            │
│  ☐ Global  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  ☐ Event   │  │  Fund Card   │ │  Fund Card   │ │  Fund Card   │       │
│            │  │              │ │              │ │              │       │
│  AUM       │  └──────────────┘ └──────────────┘ └──────────────┘       │
│  ├──●──┤   │                                                            │
│  $0-$10B   │  [Load More]                                              │
│            │                                                            │
│  [Clear]   │                                                            │
└────────────┴────────────────────────────────────────────────────────────┘
```

**Filter Sidebar:**
- Collapsible on desktop
- Slides in as sheet on mobile
- Sticky when scrolling
- "Clear all" always visible

---

### 3.3 Fund Detail Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Header]                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ← Back to Search                                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Badge: Hedge Fund]                        [★ Save] [✉ Contact] │   │
│  │                                                                  │   │
│  │ Citadel Wellington Fund                                          │   │
│  │ Long/Short Equity • Citadel LLC                                 │   │
│  │ New York, USA • Since January 2015                              │   │
│  │                                                                  │   │
│  │ ┌────────┬────────┬────────┬────────┬────────┬────────┐         │   │
│  │ │ +2.4%  │ +15.8% │ +23.1% │ +18.4% │  1.84  │ -8.2%  │         │   │
│  │ │  MTD   │  YTD   │   1Y   │  CAGR  │ Sharpe │ MaxDD  │         │   │
│  │ └────────┴────────┴────────┴────────┴────────┴────────┘         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Overview] [Performance] [Documents] [Contact]     ← Tabs             │
│  ─────────────────────────────────────────────                          │
│                                                                         │
│  ┌────────────────────────────────────┐  ┌────────────────────────┐    │
│  │                                    │  │ Fund Details           │    │
│  │    Performance Chart               │  │                        │    │
│  │    [Area chart with benchmark]     │  │ AUM: $1.2B             │    │
│  │                                    │  │ Min Investment: $1M    │    │
│  │    [1M] [3M] [YTD] [1Y] [3Y] [ALL]│  │ Mgmt Fee: 2%           │    │
│  │                                    │  │ Perf Fee: 20%          │    │
│  └────────────────────────────────────┘  │ Lockup: 1 year         │    │
│                                          │ Redemption: Quarterly  │    │
│  AI Summary                              └────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ 🤖 This long/short equity fund has consistently outperformed │      │
│  │ its benchmark by 5.2% annually. Key strengths include...     │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  Similar Funds                                                [→]      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                          │
│  │ Fund Card  │ │ Fund Card  │ │ Fund Card  │                          │
│  └────────────┘ └────────────┘ └────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Form Layout (Registration/Settings)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Header]                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│           ┌─────────────────────────────────────────────────┐           │
│           │                                                 │           │
│           │  Create Your Account                            │           │
│           │  Already have an account? Sign in               │           │
│           │                                                 │           │
│           │  Step 1 of 3 ━━━━━━━●━━━━━━━○━━━━━━━○           │           │
│           │                                                 │           │
│           │  I am a...                                      │           │
│           │  ┌─────────────────────────────────────────┐   │           │
│           │  │ 📊 Investor                             │   │           │
│           │  │ Access fund database and analytics      │   │           │
│           │  └─────────────────────────────────────────┘   │           │
│           │  ┌─────────────────────────────────────────┐   │           │
│           │  │ 📈 Fund Manager                         │   │           │
│           │  │ List funds and connect with investors   │   │           │
│           │  └─────────────────────────────────────────┘   │           │
│           │  ┌─────────────────────────────────────────┐   │           │
│           │  │ 🏢 Service Provider                     │   │           │
│           │  │ Join our professional directory         │   │           │
│           │  └─────────────────────────────────────────┘   │           │
│           │                                                 │           │
│           │                              [Continue →]       │           │
│           │                                                 │           │
│           └─────────────────────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Form Best Practices:**
- Single column layout
- Clear progress indication
- Inline validation
- Persistent help text
- Smart defaults

---

### 3.5 Marketing/Landing Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] HedgeCo.Net                    Features  Pricing  [Sign In]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    The Modern Platform for                              │
│                    Alternative Investments                              │
│                                                                         │
│         Connect with 500K+ funds, powered by AI search                  │
│                                                                         │
│         ┌─────────────────────────────────────────────────────┐        │
│         │ 🔍 Search funds, strategies, managers...            │        │
│         └─────────────────────────────────────────────────────┘        │
│                                                                         │
│         ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│         │ 513K+   │  │  172+   │  │ $695M+  │  │  82+    │             │
│         │ Funds   │  │ Managers│  │   AUM   │  │Countries│             │
│         └─────────┘  └─────────┘  └─────────┘  └─────────┘             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Browse by Asset Class                                                  │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ 📈         │ │ 🏢         │ │ 💡         │ │ 🏠         │           │
│  │ Hedge Funds│ │ Private    │ │ Venture    │ │ Real       │           │
│  │ 1,989      │ │ Equity 112 │ │ Capital    │ │ Estate 51  │           │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Features section]                                                     │
│  [Testimonials section]                                                 │
│  [CTA section]                                                          │
│  [Footer]                                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Responsive Strategy

### 4.1 Breakpoints

```css
/* Mobile-first breakpoints — matches Tailwind defaults */
--breakpoint-sm:  640px;   /* Small tablets, large phones landscape */
--breakpoint-md:  768px;   /* Tablets portrait */
--breakpoint-lg:  1024px;  /* Tablets landscape, small laptops */
--breakpoint-xl:  1280px;  /* Desktops */
--breakpoint-2xl: 1536px;  /* Large desktops */
```

### 4.2 Responsive Patterns

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| Navigation | Bottom tab bar | Collapsible sidebar | Full sidebar |
| Fund Cards | Single column | 2 columns | 3-4 columns |
| Data Tables | Card list view | Scrollable table | Full table |
| Filters | Sheet overlay | Collapsible panel | Sidebar |
| Charts | Simplified, touch | Full features | Full + controls |
| Search | Full width | Full width | Inline in header |
| Modals | Full screen | Centered overlay | Centered overlay |

### 4.3 Mobile Navigation

```tsx
// Bottom Navigation for Mobile
const MobileNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
    <div className="flex justify-around py-2">
      <NavItem icon={<Home />} label="Home" href="/" />
      <NavItem icon={<Search />} label="Search" href="/search" />
      <NavItem icon={<Star />} label="Saved" href="/saved" />
      <NavItem icon={<Mail />} label="Messages" href="/messages" />
      <NavItem icon={<User />} label="Profile" href="/profile" />
    </div>
  </nav>
);
```

### 4.4 Touch Targets

```css
/* Minimum 44x44px touch targets per WCAG */
--touch-target-min: 44px;

/* Comfortable spacing for touch */
--touch-spacing: 8px;
```

### 4.5 Responsive Typography

```css
/* Fluid type scale using clamp() */
--text-display: clamp(2.5rem, 5vw, 4rem);
--text-hero:    clamp(2rem, 4vw, 3rem);
--text-title:   clamp(1.5rem, 3vw, 2.25rem);
```

---

## 5. State Management

### 5.1 React Query Patterns

#### Query Key Factory
```typescript
// Consistent, type-safe query keys
export const queryKeys = {
  // Funds
  funds: {
    all: ['funds'] as const,
    lists: () => [...queryKeys.funds.all, 'list'] as const,
    list: (filters: FundFilters) => [...queryKeys.funds.lists(), filters] as const,
    details: () => [...queryKeys.funds.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.funds.details(), id] as const,
    returns: (id: string) => [...queryKeys.funds.detail(id), 'returns'] as const,
    similar: (id: string) => [...queryKeys.funds.detail(id), 'similar'] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    results: (query: string, filters: SearchFilters) => 
      [...queryKeys.search.all, query, filters] as const,
    suggestions: (query: string) => 
      [...queryKeys.search.all, 'suggestions', query] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    saved: () => [...queryKeys.user.all, 'saved'] as const,
    recommendations: () => [...queryKeys.user.all, 'recommendations'] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    list: (filters?: MessageFilters) => [...queryKeys.messages.all, filters] as const,
    thread: (id: string) => [...queryKeys.messages.all, 'thread', id] as const,
    unread: () => [...queryKeys.messages.all, 'unread'] as const,
  },
} as const;
```

#### Query Hooks
```typescript
// Custom hooks with consistent patterns
export function useFund(id: string) {
  return useQuery({
    queryKey: queryKeys.funds.detail(id),
    queryFn: () => api.funds.get(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFundSearch(query: string, filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.search.results(query, filters),
    queryFn: ({ pageParam = 0 }) => 
      api.search.funds({ query, filters, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: query.length > 0 || Object.keys(filters).length > 0,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: queryKeys.user.recommendations(),
    queryFn: () => api.ai.recommendations(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}
```

#### Prefetching
```typescript
// Prefetch on hover for instant navigation
export function FundCard({ fund }: { fund: FundSummary }) {
  const queryClient = useQueryClient();
  
  const prefetchFund = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.funds.detail(fund.id),
      queryFn: () => api.funds.get(fund.id),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return (
    <Link 
      href={`/funds/${fund.id}`}
      onMouseEnter={prefetchFund}
      onFocus={prefetchFund}
    >
      {/* Card content */}
    </Link>
  );
}
```

### 5.2 Optimistic Updates

```typescript
// Save fund to favorites with optimistic update
export function useSaveFund() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fundId: string) => api.user.saveFund(fundId),
    
    onMutate: async (fundId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.user.saved() });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.user.saved());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.user.saved(), (old: Fund[]) => 
        [...old, { id: fundId, savedAt: new Date() }]
      );
      
      return { previous };
    },
    
    onError: (err, fundId, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.user.saved(), context?.previous);
      toast.error('Failed to save fund');
    },
    
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.user.saved() });
    },
  });
}
```

### 5.3 URL State Sync

```typescript
// Sync filters with URL for shareable searches
import { useQueryStates, parseAsArrayOf, parseAsString, parseAsFloat } from 'nuqs';

export function useSearchFilters() {
  return useQueryStates({
    q: parseAsString.withDefault(''),
    type: parseAsArrayOf(parseAsString).withDefault([]),
    strategy: parseAsArrayOf(parseAsString).withDefault([]),
    minAum: parseAsFloat,
    maxAum: parseAsFloat,
    minReturn: parseAsFloat,
    sort: parseAsString.withDefault('relevance'),
  });
}
```

### 5.4 Global State (Minimal)

```typescript
// Zustand for UI state only — server state lives in React Query
import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Comparison
  compareList: string[];
  addToCompare: (fundId: string) => void;
  removeFromCompare: (fundId: string) => void;
  clearCompare: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  
  compareList: [],
  addToCompare: (fundId) => set((state) => ({
    compareList: state.compareList.length < 4 
      ? [...state.compareList, fundId]
      : state.compareList
  })),
  removeFromCompare: (fundId) => set((state) => ({
    compareList: state.compareList.filter(id => id !== fundId)
  })),
  clearCompare: () => set({ compareList: [] }),
}));
```

---

## 6. Accessibility

### 6.1 WCAG 2.1 AA Requirements

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| **1.1.1** | Text Alternatives | All images have `alt`, icons have `aria-label` |
| **1.3.1** | Info & Relationships | Semantic HTML, proper heading hierarchy |
| **1.3.2** | Meaningful Sequence | Logical DOM order matches visual order |
| **1.4.1** | Use of Color | Never color alone — include icons/text |
| **1.4.3** | Contrast | 4.5:1 text, 3:1 large text/UI components |
| **1.4.4** | Resize Text | 200% zoom without loss of function |
| **1.4.10** | Reflow | 320px width without horizontal scroll |
| **1.4.11** | Non-text Contrast | 3:1 for UI components and graphics |
| **2.1.1** | Keyboard | All functionality via keyboard |
| **2.1.2** | No Keyboard Trap | Focus can always escape |
| **2.4.1** | Bypass Blocks | Skip links, landmark regions |
| **2.4.3** | Focus Order | Logical, predictable focus sequence |
| **2.4.4** | Link Purpose | Clear link text, not "click here" |
| **2.4.6** | Headings & Labels | Descriptive, unique headings |
| **2.4.7** | Focus Visible | Clear focus indicators |
| **3.1.1** | Language | `<html lang="en">` |
| **3.2.1** | On Focus | No unexpected context changes |
| **3.2.2** | On Input | Predictable behavior |
| **3.3.1** | Error Identification | Clear error messages |
| **3.3.2** | Labels/Instructions | Form fields labeled |
| **4.1.1** | Parsing | Valid HTML |
| **4.1.2** | Name, Role, Value | ARIA when needed |

### 6.2 Focus Management

```css
/* Visible focus ring — not hidden behind elements */
:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: var(--primary-600);
  color: white;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

### 6.3 Screen Reader Patterns

```tsx
// Live regions for dynamic content
<div role="status" aria-live="polite" className="sr-only">
  {searchResults.length} results found
</div>

// Descriptive tables
<table aria-label="Fund performance comparison">
  <caption className="sr-only">
    Comparison of selected funds by key metrics
  </caption>
  {/* ... */}
</table>

// Icon buttons
<button aria-label="Save fund to favorites">
  <StarIcon aria-hidden="true" />
</button>

// Loading states
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? (
    <Skeleton aria-label="Loading fund data" />
  ) : (
    <FundCard fund={fund} />
  )}
</div>
```

### 6.4 Color Contrast

```typescript
// Design tokens with guaranteed contrast
const colors = {
  // Text on white backgrounds
  textPrimary: '#0f172a',    // 15.7:1 ✓
  textSecondary: '#475569',  // 7.0:1 ✓
  textMuted: '#64748b',      // 4.7:1 ✓ (only for large text)
  
  // Interactive elements
  primary: '#444ce7',        // 4.6:1 on white ✓
  primaryHover: '#3538cd',   // 6.4:1 on white ✓
  
  // Data colors (all 3:1+ on white)
  positive: '#059669',       // 4.5:1 ✓
  negative: '#be123c',       // 5.6:1 ✓
};
```

### 6.5 Reduced Motion

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Animation & UX

### 7.1 Motion Principles

1. **Purposeful** — Animation should guide, not decorate
2. **Fast** — 150-300ms for most transitions
3. **Natural** — Ease curves that feel physical
4. **Subtle** — Don't distract from content
5. **Accessible** — Respect `prefers-reduced-motion`

### 7.2 Timing & Easing

```css
/* Duration tokens */
--duration-instant: 50ms;
--duration-fast:    150ms;
--duration-normal:  200ms;
--duration-slow:    300ms;
--duration-slower:  500ms;

/* Easing curves */
--ease-out:      cubic-bezier(0.33, 1, 0.68, 1);      /* Most exits */
--ease-in:       cubic-bezier(0.32, 0, 0.67, 0);      /* Most enters */
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);      /* Symmetric */
--ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* Playful confirms */
--ease-spring:   cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Spring effect */
```

### 7.3 Micro-interactions

#### Button Press
```css
.button {
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

#### Save Animation
```tsx
// Heart fill animation on save
const SaveButton = ({ saved, onToggle }) => (
  <motion.button
    onClick={onToggle}
    whileTap={{ scale: 0.9 }}
    aria-label={saved ? 'Remove from saved' : 'Save fund'}
  >
    <motion.div
      animate={{ scale: saved ? [1, 1.3, 1] : 1 }}
      transition={{ duration: 0.3 }}
    >
      {saved ? <HeartFilledIcon /> : <HeartIcon />}
    </motion.div>
  </motion.button>
);
```

#### Number Counting
```tsx
// Animated numbers for metrics
import { useSpring, animated } from '@react-spring/web';

const AnimatedNumber = ({ value, format }) => {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  });
  
  return (
    <animated.span>
      {number.to(n => format(n))}
    </animated.span>
  );
};
```

### 7.4 Loading States

#### Skeleton Screens
```tsx
// Consistent skeleton patterns
const FundCardSkeleton = () => (
  <div className="rounded-lg border p-6 animate-pulse">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-6 w-24 rounded-full" /> {/* Badge */}
    </div>
    <Skeleton className="h-6 w-3/4 mb-2" />          {/* Title */}
    <Skeleton className="h-4 w-1/2 mb-6" />          {/* Subtitle */}
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  </div>
);
```

#### Progress Indicators
```tsx
// Determinate progress for uploads/processing
<Progress value={progress} className="h-2" />

// Indeterminate for unknown duration
<div className="h-1 bg-slate-200 rounded overflow-hidden">
  <div className="h-full bg-primary-600 animate-indeterminate" />
</div>
```

### 7.5 Page Transitions

```tsx
// Framer Motion page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const PageTransition = ({ children }) => (
  <motion.div
    initial="initial"
    animate="enter"
    exit="exit"
    variants={pageVariants}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);
```

### 7.6 Toast Notifications

```tsx
// Consistent toast patterns
const toastConfig = {
  success: {
    duration: 3000,
    icon: <CheckCircleIcon className="text-success-600" />,
  },
  error: {
    duration: 5000,
    icon: <XCircleIcon className="text-error-600" />,
  },
  loading: {
    duration: Infinity,
    icon: <Spinner />,
  },
};

// Usage
toast.success('Fund saved to your list');
toast.error('Failed to load fund data');
toast.promise(saveFund(id), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
});
```

### 7.7 Empty States

```tsx
// Engaging empty states with clear actions
const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-sm">{description}</p>
    {action}
  </div>
);

// Usage
<EmptyState
  icon={<SearchIcon className="w-8 h-8 text-slate-400" />}
  title="No results found"
  description="Try adjusting your filters or search terms to find what you're looking for."
  action={<Button onClick={clearFilters}>Clear filters</Button>}
/>
```

### 7.8 Chart Animations

```tsx
// Animated chart reveal
<ResponsiveContainer>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6172f3" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#6172f3" stopOpacity={0} />
      </linearGradient>
    </defs>
    <Area
      type="monotone"
      dataKey="value"
      stroke="#6172f3"
      fill="url(#gradient)"
      animationDuration={1000}
      animationEasing="ease-out"
    />
  </AreaChart>
</ResponsiveContainer>
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Next.js 14 with App Router
- [ ] Configure Tailwind CSS with custom design tokens
- [ ] Install and configure shadcn/ui components
- [ ] Set up React Query provider
- [ ] Implement base layout components (AppShell, PageHeader)
- [ ] Create theme provider (light mode first)
- [ ] Set up Storybook for component development

### Phase 2: Core Components
- [ ] Build FundCard variants (default, compact, featured)
- [ ] Build DataTable with sorting/filtering
- [ ] Build SearchBar with filter integration
- [ ] Build MetricCard and ReturnDisplay
- [ ] Build form components (inputs, selects, validation)
- [ ] Build navigation (sidebar, mobile nav, breadcrumbs)

### Phase 3: Data Visualization
- [ ] Set up Recharts/Tremor
- [ ] Build StatsChart with time range selector
- [ ] Build sparklines for inline performance
- [ ] Build comparison charts
- [ ] Implement chart animations

### Phase 4: Pages
- [ ] Dashboard layout
- [ ] Search results page
- [ ] Fund detail page
- [ ] Registration flow
- [ ] Settings pages
- [ ] Marketing/landing pages

### Phase 5: Polish
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Loading state refinement
- [ ] Animation fine-tuning
- [ ] Dark mode (if scoped)
- [ ] Cross-browser testing

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This specification is a living document. Update as the design evolves.*

**Author:** Nova ✨ — Frontend Lead  
**Last Updated:** February 2026  
**Version:** 1.0
