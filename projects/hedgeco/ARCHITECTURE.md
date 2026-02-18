# HedgeCo.Net v2 — Proposed Architecture

## Design Principles

1. **AI-Native** — AI not bolted on, but core to the experience
2. **API-First** — Clean separation, mobile/third-party ready
3. **Real-Time** — Live updates, instant search
4. **Scalable** — Handle 100K+ users, millions of data points
5. **Secure** — Financial-grade security, SOC 2 ready
6. **Modern DX** — TypeScript everywhere, great tooling

---

## Proposed Tech Stack

### Frontend
```
Framework:     Next.js 14+ (App Router)
Language:      TypeScript
Styling:       Tailwind CSS + shadcn/ui
State:         React Query (TanStack)
Forms:         React Hook Form + Zod
Charts:        Recharts / Tremor
PDF:           @react-pdf/renderer
Auth:          NextAuth.js
```

**Why Next.js:**
- SSR/SSG for SEO (critical for fund discovery)
- React ecosystem
- Vercel deployment simplicity
- API routes for lightweight backend
- Edge functions for AI endpoints

### Backend
```
Runtime:       Node.js 20+ (LTS)
Framework:     Hono + Operations Kernel (type-safe APIs + audit)
Language:      TypeScript
ORM:           Prisma
Validation:    Zod
Background:    BullMQ + Redis (persistent, Upstash)
Email:         Resend + Safe Send Gate
Storage:       S3/R2 (documents, reports)
Support:       Lightweight ticketing (2-table MVP)
```

### Operations Kernel (NEW - Critical)
```
Service:       Node.js + Hono
Purpose:       Permissioned tool endpoints, audit logging, human approval gates
Queues:        BullMQ with Redis persistence (Upstash)
Key Queues:    email, embedding, webhook, notification, approval, publish
Idempotency:   jobId = hash(action + entityId + version)
Compliance:    Approval queue (membership/fund verification), Publish queue (news/announcements)
```

**Why Hono over tRPC for kernel:**
- Lighter weight for permissioned endpoints
- Better for audit logging middleware
- Simpler to secure
- tRPC still used for main app API

**Alternative: Python Backend**
```
Framework:     FastAPI
Language:      Python 3.11+
ORM:           SQLAlchemy / Prisma-Python
Background:    Celery + Redis
```
*Consider if heavy ML/analytics needed beyond API calls*

### Database
```
Primary:       PostgreSQL 15+ (Supabase or Neon)
Cache:         Redis (Upstash)
Vector DB:     Pinecone / pgvector
Search:        Typesense / Meilisearch (instant search)
```

**Why PostgreSQL:**
- Financial data needs ACID compliance
- pgvector for AI embeddings (one less service)
- Mature, battle-tested
- Great with Prisma

### AI Stack
```
LLM:           OpenAI GPT-4o / Claude
Embeddings:   OpenAI text-embedding-3-large
Vector Store: Pinecone / pgvector
RAG:          LangChain / LlamaIndex
Function Calling: OpenAI native
```

### Infrastructure
```
Hosting:       Vercel (frontend) + Railway/Render (backend)
               OR: AWS (ECS/Lambda)
CDN:           Cloudflare (keep existing)
DNS:           Cloudflare
Monitoring:    Sentry + Datadog/Axiom
Analytics:     PostHog / Mixpanel
Auth:          Clerk / Auth0 / NextAuth
Payments:      Stripe (service provider listings)
```

---

## Database Schema (High-Level)

### Core Entities

```prisma
// Users
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?
  role            UserRole
  emailVerified   DateTime?
  profile         Profile?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum UserRole {
  INVESTOR
  MANAGER
  SERVICE_PROVIDER
  NEWS_MEMBER
  ADMIN
}

model Profile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  firstName       String
  lastName        String
  company         String?
  title           String?
  phone           String?
  timezone        String?
  
  // Investor-specific
  accredited      Boolean   @default(false)
  accreditedAt    DateTime?
  investorType    InvestorType?
  
  // Preferences (for AI recommendations)
  preferences     Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Funds
model Fund {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  type            FundType
  strategy        String?
  subStrategy     String?
  
  // Manager relationship
  managerId       String
  manager         User      @relation(fields: [managerId], references: [id])
  
  // Fund details
  description     String?   @db.Text
  aum             Decimal?  @db.Decimal(18, 2)
  aumDate         DateTime?
  inception       DateTime?
  minInvestment   Decimal?  @db.Decimal(18, 2)
  managementFee   Decimal?  @db.Decimal(5, 4)
  performanceFee  Decimal?  @db.Decimal(5, 4)
  lockup          String?
  redemption      String?
  
  // Location
  country         String?
  state           String?
  city            String?
  
  // Status
  status          FundStatus @default(PENDING)
  visible         Boolean    @default(false)
  
  // Performance
  returns         FundReturn[]
  
  // AI
  embedding       Float[]?   @db.Float8
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([type, strategy])
  @@index([status, visible])
}

enum FundType {
  HEDGE_FUND
  PRIVATE_EQUITY
  VENTURE_CAPITAL
  REAL_ESTATE
  CRYPTO
  SPV
}

enum FundStatus {
  PENDING
  APPROVED
  REJECTED
  INACTIVE
}

// Monthly Returns
model FundReturn {
  id              String    @id @default(cuid())
  fundId          String
  fund            Fund      @relation(fields: [fundId], references: [id])
  
  year            Int
  month           Int
  netReturn       Decimal   @db.Decimal(8, 4) // e.g., 0.0523 for 5.23%
  
  // Calculated fields (updated by stats engine)
  ytdReturn       Decimal?  @db.Decimal(10, 4)
  cumulativeReturn Decimal? @db.Decimal(12, 4)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([fundId, year, month])
  @@index([fundId, year])
}

// Service Providers
model ServiceProvider {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  companyName     String
  slug            String    @unique
  category        String
  subcategory     String?
  
  description     String?   @db.Text
  website         String?
  phone           String?
  email           String?
  
  // Location
  address         String?
  city            String?
  state           String?
  country         String?
  
  // Listing tier (for paid features)
  tier            ProviderTier @default(BASIC)
  tierExpiresAt   DateTime?
  
  // Visibility
  visible         Boolean    @default(true)
  featured        Boolean    @default(false)
  
  // AI
  embedding       Float[]?   @db.Float8
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum ProviderTier {
  BASIC
  PREMIUM
  FEATURED
}

// Conferences
model Conference {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  
  description     String?   @db.Text
  location        String?
  venue           String?
  city            String?
  country         String?
  
  startDate       DateTime
  endDate         DateTime?
  timezone        String?
  
  registrationUrl String?
  ticketCost      Decimal?  @db.Decimal(10, 2)
  
  organizer       String?
  organizerEmail  String?
  organizerPhone  String?
  
  visible         Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Messages (internal communication)
model Message {
  id              String    @id @default(cuid())
  
  senderId        String
  sender          User      @relation("sent", fields: [senderId], references: [id])
  
  recipientId     String
  recipient       User      @relation("received", fields: [recipientId], references: [id])
  
  subject         String?
  body            String    @db.Text
  
  // Thread tracking
  threadId        String?
  parentId        String?
  
  // Status
  read            Boolean   @default(false)
  readAt          DateTime?
  archived        Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  
  @@index([recipientId, read])
  @@index([senderId])
  @@index([threadId])
}

// AI: User activity for recommendations
model UserActivity {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  action          String    // VIEW, SEARCH, CONTACT, SAVE, etc.
  entityType      String    // FUND, PROVIDER, CONFERENCE
  entityId        String?
  
  metadata        Json?     // search query, filters, etc.
  
  createdAt       DateTime  @default(now())
  
  @@index([userId, action])
  @@index([entityType, entityId])
}

// AI: Saved searches
model SavedSearch {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  name            String
  query           String?   // NLP query
  filters         Json      // structured filters
  
  alertEnabled    Boolean   @default(false)
  lastAlertAt     DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## AI Features Architecture

### 1. Natural Language Search

```
User Query → OpenAI Function Calling → Structured Filters → DB Query → Results
                    ↓
              Also: Embedding → Vector Search → Semantic Results
                    ↓
              Merge & Rank → Final Results
```

**Example:**
```
"Find long/short equity hedge funds with 15%+ returns, <$100M AUM"
     ↓
{
  type: "HEDGE_FUND",
  strategy: "long_short_equity",
  filters: {
    returns_cagr_gte: 0.15,
    aum_lte: 100000000
  }
}
```

### 2. Recommendations Engine

```
User Activity Log → Embedding → Similar Users
                 → Similar Funds (viewed/contacted)
                 → Strategy Preferences
                 → Risk Profile
                      ↓
                 Candidate Generation
                      ↓
                 Scoring & Ranking
                      ↓
                 Personalized Feed
```

### 3. AI Chat Interface

```
┌─────────────────────────────────────────┐
│  🤖 HedgeCo Assistant                   │
├─────────────────────────────────────────┤
│  User: "Show me crypto funds that       │
│         outperformed Bitcoin last year" │
│                                         │
│  AI: [Searches, analyzes, responds]     │
│       "I found 3 crypto funds that      │
│        beat BTC in 2025..."             │
│       [Fund Card] [Fund Card] [Card]    │
│                                         │
│  User: "Compare the top 2"              │
│                                         │
│  AI: [Generates comparison table]       │
└─────────────────────────────────────────┘
```

### 4. Fund Summary Generator

```
Fund Data + Returns + News Mentions + Peer Data
                    ↓
              Prompt Template
                    ↓
              GPT-4o Generation
                    ↓
              AI-Generated Summary
              - Strategy explanation
              - Performance context
              - Risk factors
              - Peer comparison
```

---

## Statistics Engine

### Calculated Metrics

| Metric | Formula | Notes |
|--------|---------|-------|
| CAGR | Compound Annual Growth Rate | Since inception |
| YTD Return | Year-to-date | Compounded monthly |
| Sharpe Ratio | (Return - Rf) / StdDev | Risk-adjusted |
| Sortino Ratio | (Return - Rf) / Downside StdDev | Downside risk |
| Max Drawdown | Peak-to-trough decline | Risk measure |
| Volatility | Annualized standard deviation | |
| Correlation | vs S&P 500, benchmarks | |
| Alpha/Beta | CAPM metrics | vs benchmark |

### Calculation Pipeline

```
Monthly Return Input
       ↓
 Validation & Storage
       ↓
 Background Job (BullMQ)
       ↓
 Calculate All Metrics
       ↓
 Update Fund Record
       ↓
 Regenerate Embeddings (if needed)
       ↓
 Notify (if alerts configured)
```

---

## Phase Plan

### Phase 1: Foundation (8-10 weeks)
- [ ] Database design & Prisma schema
- [ ] Authentication (Clerk/NextAuth)
- [ ] Basic UI shell (Next.js + Tailwind)
- [ ] User registration flows (4 types)
- [ ] Investor accreditation workflow
- [ ] Core API endpoints

### Phase 2: Fund Database (6-8 weeks)
- [ ] Fund CRUD (manager side)
- [ ] Fund browse/search (investor side)
- [ ] Monthly returns input
- [ ] Statistics engine
- [ ] Basic PDF reports
- [ ] Fund detail pages

### Phase 3: Service Providers & Content (4-6 weeks)
- [ ] Provider directory
- [ ] Provider listing management
- [ ] Paid tier integration (Stripe)
- [ ] Conference listings
- [ ] News integration (headless WP or migrate)
- [ ] Education section

### Phase 4: AI Features (6-8 weeks)
- [ ] Natural language search
- [ ] Embeddings generation
- [ ] Recommendation engine
- [ ] AI chat interface
- [ ] Fund summary generation
- [ ] Smart matching

### Phase 5: Communication & Polish (4-6 weeks)
- [ ] Internal messaging system
- [ ] Email notifications
- [ ] Admin panel
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Security audit

### Phase 6: Launch (2-4 weeks)
- [ ] Data migration
- [ ] Beta testing
- [ ] Bug fixes
- [ ] DNS cutover
- [ ] Monitoring setup
- [ ] Launch!

**Total Estimated: 30-42 weeks** (with parallel work streams)

---

## Team Structure

| Role | Responsibilities |
|------|------------------|
| **Lead/Architect** | Overall design, AI features, code review |
| **Frontend Dev** | Next.js UI, components, responsive |
| **Backend Dev** | APIs, database, auth, integrations |
| **AI/ML Engineer** | Embeddings, RAG, recommendations |
| **QA Engineer** | Testing, automation, edge cases |
| **DevOps** | Infrastructure, CI/CD, monitoring |

---

## Open Questions

1. **News Strategy** — Keep WordPress or migrate to headless/custom CMS?
2. **Mobile** — PWA sufficient or native apps needed?
3. **Data Migration** — Full history or fresh start?
4. **Compliance** — Any SEC/FINRA requirements to consider?
5. **Analytics** — What business metrics matter most?
6. **Internationalization** — Multi-language support needed?
