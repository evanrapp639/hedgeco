# HedgeCo.Net v2 — Backend Specification

**Author:** Atlas ⚙️ (Backend Lead)  
**Version:** 1.0  
**Date:** 2026-02-12  
**Status:** Draft for Review

---

## Table of Contents

1. [API Design](#1-api-design)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Database Schema](#3-database-schema)
4. [Statistics Engine](#4-statistics-engine)
5. [Background Jobs](#5-background-jobs)
6. [PDF Generation](#6-pdf-generation)
7. [Security](#7-security)
8. [Migration Strategy](#8-migration-strategy)

---

## 1. API Design

### 1.1 tRPC vs REST Decision

**Recommendation: tRPC for internal APIs, REST for external/public APIs**

| Aspect | tRPC | REST |
|--------|------|------|
| Type Safety | ✅ End-to-end TypeScript types | ❌ Requires OpenAPI codegen |
| Developer Experience | ✅ Excellent autocomplete | ⚠️ Manual typing |
| External Consumers | ❌ TS-only clients | ✅ Universal |
| Caching | ⚠️ Manual setup | ✅ HTTP cache headers |
| Mobile Apps | ⚠️ Possible but awkward | ✅ Native HTTP clients |

**Hybrid Approach:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│                            │                                 │
│                      tRPC Client                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  tRPC Router    │  │  REST Routes    │  │  Webhooks   │ │
│  │  (internal)     │  │  (external/v1)  │  │  (events)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 API Versioning Strategy

```
/api/v1/*          # Public REST endpoints (versioned)
/api/trpc/*        # Internal tRPC (unversioned, tied to frontend)
/api/webhooks/*    # Incoming webhooks (Stripe, etc.)
/api/internal/*    # Admin/service-to-service (authenticated)
```

**Versioning Rules:**
- Public REST APIs use URL versioning (`/api/v1/`, `/api/v2/`)
- Breaking changes require new version
- Deprecation period: 12 months minimum
- Version sunset announcements via API headers

### 1.3 tRPC Router Structure

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { fundRouter } from './fund';
import { returnRouter } from './return';
import { statsRouter } from './stats';
import { providerRouter } from './provider';
import { conferenceRouter } from './conference';
import { messageRouter } from './message';
import { searchRouter } from './search';
import { adminRouter } from './admin';
import { aiRouter } from './ai';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  fund: fundRouter,
  return: returnRouter,
  stats: statsRouter,
  provider: providerRouter,
  conference: conferenceRouter,
  message: messageRouter,
  search: searchRouter,
  admin: adminRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
```

### 1.4 Endpoint Design

#### Fund Router Example

```typescript
// src/server/routers/fund.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, managerProcedure } from '../trpc';

export const fundRouter = router({
  // Public: List funds with filters
  list: publicProcedure
    .input(z.object({
      type: z.nativeEnum(FundType).optional(),
      strategy: z.string().optional(),
      minAum: z.number().optional(),
      maxAum: z.number().optional(),
      country: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),

  // Public: Get fund by slug (basic info)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Returns limited info for non-authenticated users
    }),

  // Protected: Get full fund details (authenticated investors)
  getFullDetails: protectedProcedure
    .input(z.object({ fundId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Full details including returns, contact info
      // Logs activity for recommendations
    }),

  // Manager: Create fund
  create: managerProcedure
    .input(FundCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Creates fund linked to manager
    }),

  // Manager: Update fund
  update: managerProcedure
    .input(FundUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Only own funds
    }),

  // Manager: Submit for approval
  submitForApproval: managerProcedure
    .input(z.object({ fundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Changes status to PENDING
    }),
});
```

### 1.5 REST API Endpoints (External/Public)

```yaml
# Public Fund Endpoints
GET    /api/v1/funds                    # List funds (paginated)
GET    /api/v1/funds/:slug              # Get fund by slug
GET    /api/v1/funds/:id/returns        # Get fund returns (auth required)
GET    /api/v1/funds/:id/stats          # Get calculated statistics

# Public Provider Endpoints  
GET    /api/v1/providers                # List service providers
GET    /api/v1/providers/:slug          # Get provider details
GET    /api/v1/providers/categories     # List categories

# Public Conference Endpoints
GET    /api/v1/conferences              # List conferences
GET    /api/v1/conferences/:slug        # Get conference details

# Search
GET    /api/v1/search                   # Unified search
POST   /api/v1/search/natural           # AI natural language search

# Authentication
POST   /api/v1/auth/register            # Register new user
POST   /api/v1/auth/login               # Login
POST   /api/v1/auth/logout              # Logout
POST   /api/v1/auth/refresh             # Refresh token
POST   /api/v1/auth/forgot-password     # Password reset request
POST   /api/v1/auth/reset-password      # Password reset confirm

# Webhooks (incoming)
POST   /api/webhooks/stripe             # Stripe payment events
```

### 1.6 Response Envelope

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
      cursor?: string;
    };
    cached?: boolean;
    requestId: string;
  };
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: "FUND_NOT_FOUND"
    message: string;        // Human-readable
    details?: unknown;      // Validation errors, etc.
    requestId: string;
  };
}
```

### 1.7 Error Codes

```typescript
enum ErrorCode {
  // Authentication (1xxx)
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation (2xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resources (3xxx)
  FUND_NOT_FOUND = 'FUND_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  
  // Business Logic (4xxx)
  ACCREDITATION_REQUIRED = 'ACCREDITATION_REQUIRED',
  FUND_NOT_APPROVED = 'FUND_NOT_APPROVED',
  DUPLICATE_RETURN = 'DUPLICATE_RETURN',
  
  // Rate Limiting (5xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server (9xxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Strategy

**Primary: JWT with Refresh Tokens**

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Login Request                                              │
│        │                                                     │
│        ▼                                                     │
│   Validate Credentials ──────► Issue Tokens                  │
│        │                           │                         │
│        │                    ┌──────┴──────┐                  │
│        │                    │             │                  │
│        │              Access Token   Refresh Token           │
│        │              (15 min)       (7 days)                │
│        │                    │             │                  │
│        │                    ▼             ▼                  │
│        │              HTTP-only      HTTP-only               │
│        │              Cookie         Cookie                  │
│        │              (Secure)       (Secure, /refresh)      │
│        │                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 JWT Token Structure

```typescript
// Access Token Payload
interface AccessTokenPayload {
  sub: string;          // User ID
  email: string;
  role: UserRole;
  permissions: string[];
  accredited: boolean;  // For investors
  iat: number;          // Issued at
  exp: number;          // Expires at (15 min)
  jti: string;          // JWT ID (for revocation)
}

// Refresh Token Payload  
interface RefreshTokenPayload {
  sub: string;          // User ID
  tokenFamily: string;  // For rotation detection
  iat: number;
  exp: number;          // 7 days
  jti: string;
}
```

### 2.3 Token Management

```typescript
// Token service
class TokenService {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  
  async generateTokenPair(user: User): Promise<TokenPair> {
    const tokenFamily = crypto.randomUUID();
    
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: await this.getUserPermissions(user),
        accredited: user.profile?.accredited ?? false,
      },
      this.accessTokenSecret,
      { expiresIn: '15m', jwtid: crypto.randomUUID() }
    );
    
    const refreshToken = jwt.sign(
      { sub: user.id, tokenFamily },
      this.refreshTokenSecret,
      { expiresIn: '7d', jwtid: crypto.randomUUID() }
    );
    
    // Store refresh token hash in DB for revocation
    await this.storeRefreshToken(user.id, refreshToken, tokenFamily);
    
    return { accessToken, refreshToken, tokenFamily };
  }
  
  async rotateRefreshToken(oldToken: string): Promise<TokenPair | null> {
    const payload = this.verifyRefreshToken(oldToken);
    if (!payload) return null;
    
    // Check if token family is valid (detect reuse attacks)
    const isValid = await this.validateTokenFamily(payload.sub, payload.tokenFamily);
    if (!isValid) {
      // Potential token theft - invalidate all tokens for user
      await this.revokeAllUserTokens(payload.sub);
      await this.notifySecurityAlert(payload.sub, 'TOKEN_REUSE_DETECTED');
      return null;
    }
    
    // Generate new pair with same family
    return this.generateTokenPair(await this.getUser(payload.sub));
  }
}
```

### 2.4 Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  INVESTOR = 'INVESTOR',
  MANAGER = 'MANAGER',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  NEWS_MEMBER = 'NEWS_MEMBER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Permissions by role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  INVESTOR: [
    'fund:read',
    'fund:search',
    'fund:contact',
    'message:send',
    'message:read',
    'profile:read',
    'profile:update',
    'search:save',
  ],
  MANAGER: [
    'fund:read',
    'fund:create',
    'fund:update:own',
    'fund:delete:own',
    'return:create:own',
    'return:update:own',
    'stats:read:own',
    'report:generate:own',
    'message:send',
    'message:read',
    'profile:read',
    'profile:update',
  ],
  SERVICE_PROVIDER: [
    'provider:read',
    'provider:update:own',
    'fund:read',
    'message:send',
    'message:read',
    'profile:read',
    'profile:update',
  ],
  NEWS_MEMBER: [
    'news:read',
    'fund:read:basic',
    'profile:read',
    'profile:update',
  ],
  ADMIN: [
    '*:read',
    'fund:approve',
    'fund:reject',
    'user:manage',
    'provider:approve',
    'message:moderate',
    'report:view:all',
  ],
  SUPER_ADMIN: [
    '*', // All permissions
  ],
};
```

### 2.5 Middleware Stack

```typescript
// src/server/middleware/index.ts

// 1. Rate limiting
export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: (req) => {
    // Different limits by endpoint type
    if (req.path.startsWith('/api/v1/auth')) return 10;
    if (req.path.startsWith('/api/v1/search')) return 30;
    return 100;
  },
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'],
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
    });
  },
});

// 2. Authentication
export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken || extractBearerToken(req);
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token expired' }
      });
    }
    req.user = null;
    next();
  }
};

// 3. Authorization (tRPC middleware)
export const requireAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const requireRole = (roles: UserRole[]) => 
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });

export const requirePermission = (permission: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !hasPermission(ctx.user, permission)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });

export const requireAccreditation = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'INVESTOR' || !ctx.user.accredited) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Accredited investor status required'
    });
  }
  return next();
});
```

### 2.6 Investor Accreditation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Investor Accreditation Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Registration                                                 │
│     └─► User signs up as INVESTOR role                          │
│     └─► accredited = false                                      │
│     └─► Can view basic fund info only                           │
│                                                                  │
│  2. Accreditation Request                                        │
│     └─► User fills accreditation form                           │
│         ├─ Income verification ($200K+/$300K+ joint)            │
│         ├─ Net worth verification ($1M+ excl. primary home)     │
│         ├─ Professional certification (Series 7, 65, 82)        │
│         └─ Entity status (qualified purchaser, etc.)            │
│     └─► Uploads supporting documents                            │
│     └─► Status: PENDING                                         │
│                                                                  │
│  3. Admin Review                                                 │
│     └─► Admin reviews submission                                │
│     └─► May request additional documents                        │
│     └─► Approves or rejects                                     │
│                                                                  │
│  4. Approval                                                     │
│     └─► accredited = true                                       │
│     └─► accreditedAt = now()                                    │
│     └─► accreditationExpires = +12 months                       │
│     └─► Full platform access granted                            │
│                                                                  │
│  5. Annual Re-verification                                       │
│     └─► 30 days before expiry: reminder email                   │
│     └─► 7 days before expiry: urgent reminder                   │
│     └─► On expiry: accredited = false, limited access           │
│     └─► Can re-verify to restore access                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Accreditation schema
model AccreditationRequest {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  // Accreditation type
  accreditationType AccreditationType
  
  // Income-based
  annualIncome      Decimal?  @db.Decimal(14, 2)
  jointIncome       Boolean?
  incomeYears       Int?      // Must be 2+ years
  
  // Net worth-based
  netWorth          Decimal?  @db.Decimal(14, 2)
  
  // Professional-based
  certifications    String[]  // Series 7, 65, 82
  employerName      String?
  
  // Entity-based
  entityType        String?   // Trust, LLC, Corporation
  entityName        String?
  
  // Documents
  documents         AccreditationDocument[]
  
  // Status
  status            AccreditationStatus @default(PENDING)
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?
  
  // Expiration
  expiresAt         DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId, status])
}

enum AccreditationType {
  INCOME
  NET_WORTH
  PROFESSIONAL
  ENTITY
  QUALIFIED_PURCHASER
}

enum AccreditationStatus {
  PENDING
  UNDER_REVIEW
  DOCUMENTS_REQUESTED
  APPROVED
  REJECTED
  EXPIRED
}

model AccreditationDocument {
  id              String    @id @default(cuid())
  requestId       String
  request         AccreditationRequest @relation(fields: [requestId], references: [id])
  
  documentType    String    // TAX_RETURN, BANK_STATEMENT, W2, etc.
  fileName        String
  fileUrl         String    // S3 URL (encrypted at rest)
  fileHash        String    // SHA-256 for integrity
  uploadedAt      DateTime  @default(now())
  
  // Verification
  verified        Boolean   @default(false)
  verifiedBy      String?
  verifiedAt      DateTime?
}
```

---

## 3. Database Schema

### 3.1 Complete Prisma Schema

```prisma
// schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector, pg_trgm]
}

// ============================================================
// USERS & AUTHENTICATION
// ============================================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  
  // Status
  emailVerified   DateTime?
  active          Boolean   @default(true)
  locked          Boolean   @default(false)
  lockedAt        DateTime?
  lockedReason    String?
  
  // Role & permissions
  role            UserRole  @default(INVESTOR)
  
  // Relationships
  profile         Profile?
  funds           Fund[]    @relation("FundManager")
  serviceProvider ServiceProvider?
  
  // Accreditation (for investors)
  accreditationRequests AccreditationRequest[]
  
  // Activity
  sessions        Session[]
  refreshTokens   RefreshToken[]
  activities      UserActivity[]
  savedSearches   SavedSearch[]
  
  // Messaging
  sentMessages     Message[] @relation("MessageSender")
  receivedMessages Message[] @relation("MessageRecipient")
  
  // Audit
  auditLogs       AuditLog[]
  
  // Timestamps
  lastLoginAt     DateTime?
  lastLoginIp     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([email])
  @@index([role, active])
}

enum UserRole {
  INVESTOR
  MANAGER
  SERVICE_PROVIDER
  NEWS_MEMBER
  ADMIN
  SUPER_ADMIN
}

model Profile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic info
  firstName       String
  lastName        String
  displayName     String?
  avatarUrl       String?
  
  // Professional
  company         String?
  title           String?
  phone           String?
  linkedIn        String?
  
  // Location
  city            String?
  state           String?
  country         String?   @default("US")
  timezone        String?   @default("America/New_York")
  
  // Investor-specific
  accredited      Boolean   @default(false)
  accreditedAt    DateTime?
  accreditationExpires DateTime?
  investorType    InvestorType?
  
  // AI Preferences (for recommendations)
  preferences     Json?     @db.JsonB
  // Example: { fundTypes: ["HEDGE_FUND"], strategies: ["long_short"], minAum: 10000000 }
  
  // Notification preferences
  emailNotifications Boolean @default(true)
  marketingEmails    Boolean @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([accredited, accreditationExpires])
}

enum InvestorType {
  INDIVIDUAL
  FAMILY_OFFICE
  INSTITUTIONAL
  FUND_OF_FUNDS
  ENDOWMENT
  PENSION
  RIA
  BANK
  INSURANCE
}

model Session {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  userAgent     String?
  ipAddress     String?
  country       String?
  city          String?
  
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  lastActiveAt  DateTime @default(now())
  
  @@index([userId, expiresAt])
}

model RefreshToken {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tokenHash     String   @unique  // SHA-256 hash of token
  tokenFamily   String            // For rotation detection
  
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  revokedAt     DateTime?
  
  @@index([userId, tokenFamily])
  @@index([tokenHash])
}

// ============================================================
// FUNDS
// ============================================================

model Fund {
  id              String    @id @default(cuid())
  
  // Basic info
  name            String
  slug            String    @unique
  type            FundType
  
  // Strategy
  strategy        String?
  subStrategy     String?
  investmentFocus String?
  
  // Manager relationship
  managerId       String
  manager         User      @relation("FundManager", fields: [managerId], references: [id])
  
  // Fund details
  description     String?   @db.Text
  
  // AUM tracking
  aum             Decimal?  @db.Decimal(18, 2)
  aumDate         DateTime?
  aumHistory      AumHistory[]
  
  // Key dates
  inceptionDate   DateTime?
  fundCloseDate   DateTime? // For closed-end funds
  
  // Fees
  managementFee   Decimal?  @db.Decimal(5, 4)  // e.g., 0.0200 = 2%
  performanceFee  Decimal?  @db.Decimal(5, 4)  // e.g., 0.2000 = 20%
  hurdleRate      Decimal?  @db.Decimal(5, 4)
  highWaterMark   Boolean   @default(true)
  
  // Terms
  minInvestment   Decimal?  @db.Decimal(18, 2)
  lockupPeriod    String?   // "12 months", "None", etc.
  redemptionTerms String?   // "Monthly with 30 days notice"
  redemptionGate  Decimal?  @db.Decimal(5, 4)  // Max % per period
  
  // Structure
  legalStructure  String?   // "Delaware LP", "Cayman Ltd", etc.
  domicile        String?
  regulator       String?   // "SEC", "FCA", etc.
  
  // Location (manager office)
  country         String?
  state           String?
  city            String?
  
  // Status & visibility
  status          FundStatus @default(DRAFT)
  visible         Boolean    @default(false)
  featured        Boolean    @default(false)
  
  // Performance data
  returns         FundReturn[]
  statistics      FundStatistics?
  
  // Benchmarks
  primaryBenchmark   String?  // "S&P 500", "HFRI", etc.
  secondaryBenchmark String?
  
  // AI / Search
  embedding       Unsupported("vector(1536)")?
  searchVector    Unsupported("tsvector")?
  
  // Documents
  documents       FundDocument[]
  
  // Contact history
  inquiries       FundInquiry[]
  
  // Timestamps
  approvedAt      DateTime?
  approvedBy      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([type, strategy])
  @@index([status, visible])
  @@index([managerId])
  @@index([inceptionDate])
  @@index([aum])
}

enum FundType {
  HEDGE_FUND
  PRIVATE_EQUITY
  VENTURE_CAPITAL
  REAL_ESTATE
  CRYPTO
  SPV
  FUND_OF_FUNDS
  CREDIT
  INFRASTRUCTURE
}

enum FundStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
  CLOSED
}

model FundReturn {
  id              String    @id @default(cuid())
  fundId          String
  fund            Fund      @relation(fields: [fundId], references: [id], onDelete: Cascade)
  
  year            Int
  month           Int       // 1-12
  
  // Returns (stored as decimals, e.g., 0.0523 = 5.23%)
  netReturn       Decimal   @db.Decimal(10, 6)
  grossReturn     Decimal?  @db.Decimal(10, 6)
  
  // Calculated fields (updated by stats engine)
  ytdReturn       Decimal?  @db.Decimal(12, 6)
  trailingReturn  Decimal?  @db.Decimal(12, 6)  // Since inception
  
  // AUM at time of return
  periodAum       Decimal?  @db.Decimal(18, 2)
  
  // Data quality
  provisional     Boolean   @default(false)
  source          String?   // "MANAGER", "ADMIN", "IMPORT"
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([fundId, year, month])
  @@index([fundId, year])
  @@index([year, month])
}

model FundStatistics {
  id              String    @id @default(cuid())
  fundId          String    @unique
  fund            Fund      @relation(fields: [fundId], references: [id], onDelete: Cascade)
  
  // Return metrics
  totalReturn     Decimal?  @db.Decimal(12, 6)  // Cumulative
  cagr            Decimal?  @db.Decimal(10, 6)  // Annualized
  ytdReturn       Decimal?  @db.Decimal(10, 6)
  oneYearReturn   Decimal?  @db.Decimal(10, 6)
  threeYearReturn Decimal?  @db.Decimal(10, 6)  // Annualized
  fiveYearReturn  Decimal?  @db.Decimal(10, 6)  // Annualized
  
  // Risk metrics
  volatility      Decimal?  @db.Decimal(10, 6)  // Annualized std dev
  sharpeRatio     Decimal?  @db.Decimal(8, 4)
  sortinoRatio    Decimal?  @db.Decimal(8, 4)
  calmarRatio     Decimal?  @db.Decimal(8, 4)
  
  // Drawdown
  maxDrawdown     Decimal?  @db.Decimal(10, 6)
  maxDrawdownDate DateTime?
  currentDrawdown Decimal?  @db.Decimal(10, 6)
  
  // Distribution
  bestMonth       Decimal?  @db.Decimal(10, 6)
  worstMonth      Decimal?  @db.Decimal(10, 6)
  avgMonthlyReturn Decimal? @db.Decimal(10, 6)
  positiveMonths  Int?
  negativeMonths  Int?
  winRate         Decimal?  @db.Decimal(5, 4)
  
  // Correlation (vs benchmarks)
  correlationSP500 Decimal? @db.Decimal(6, 4)
  beta             Decimal? @db.Decimal(6, 4)
  alpha            Decimal? @db.Decimal(10, 6)  // Annualized
  
  // Skew & Kurtosis
  skewness        Decimal?  @db.Decimal(8, 4)
  kurtosis        Decimal?  @db.Decimal(8, 4)
  
  // Calculation metadata
  calculatedAt    DateTime  @default(now())
  dataStartDate   DateTime?
  dataEndDate     DateTime?
  monthsOfData    Int?
  riskFreeRate    Decimal?  @db.Decimal(6, 4)   // Used in calculation
  
  updatedAt       DateTime  @updatedAt
}

model AumHistory {
  id              String    @id @default(cuid())
  fundId          String
  fund            Fund      @relation(fields: [fundId], references: [id], onDelete: Cascade)
  
  asOfDate        DateTime
  aum             Decimal   @db.Decimal(18, 2)
  source          String?
  
  createdAt       DateTime  @default(now())
  
  @@unique([fundId, asOfDate])
  @@index([fundId, asOfDate])
}

model FundDocument {
  id              String    @id @default(cuid())
  fundId          String
  fund            Fund      @relation(fields: [fundId], references: [id], onDelete: Cascade)
  
  documentType    FundDocumentType
  title           String
  fileName        String
  fileUrl         String    // S3 URL
  fileSize        Int       // bytes
  mimeType        String
  fileHash        String    // SHA-256
  
  // Access control
  accessLevel     DocumentAccessLevel @default(ACCREDITED)
  
  // Versioning
  version         Int       @default(1)
  previousId      String?
  
  uploadedBy      String
  uploadedAt      DateTime  @default(now())
  
  @@index([fundId, documentType])
}

enum FundDocumentType {
  FACTSHEET
  PPM
  DDQ
  PERFORMANCE_REPORT
  MARKETING_DECK
  AUDITED_FINANCIALS
  SUBSCRIPTION_DOCS
  SIDE_LETTER
  OTHER
}

enum DocumentAccessLevel {
  PUBLIC        // Anyone (rare)
  REGISTERED    // Any logged-in user
  ACCREDITED    // Accredited investors only
  NDA_REQUIRED  // After NDA signed
  PRIVATE       // Manager + Admin only
}

// ============================================================
// SERVICE PROVIDERS
// ============================================================

model ServiceProvider {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  // Basic info
  companyName     String
  slug            String    @unique
  
  // Categorization
  category        String    // Primary category
  subcategories   String[]  // Additional categories
  
  // Description
  tagline         String?
  description     String?   @db.Text
  
  // Contact
  website         String?
  phone           String?
  email           String?
  
  // Location
  address         String?
  address2        String?
  city            String?
  state           String?
  postalCode      String?
  country         String?   @default("US")
  
  // Social
  linkedIn        String?
  twitter         String?
  
  // Listing tier (monetization)
  tier            ProviderTier @default(BASIC)
  tierStartedAt   DateTime?
  tierExpiresAt   DateTime?
  stripeCustomerId String?
  stripeSubscriptionId String?
  
  // Visibility & status
  status          ProviderStatus @default(PENDING)
  visible         Boolean   @default(false)
  featured        Boolean   @default(false)
  
  // AI / Search
  embedding       Unsupported("vector(1536)")?
  searchVector    Unsupported("tsvector")?
  
  // Testimonials
  testimonials    ProviderTestimonial[]
  
  // Stats
  viewCount       Int       @default(0)
  contactCount    Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([category])
  @@index([status, visible])
  @@index([tier])
}

enum ProviderTier {
  BASIC
  PROFESSIONAL
  PREMIUM
  FEATURED
}

enum ProviderStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

model ProviderTestimonial {
  id              String    @id @default(cuid())
  providerId      String
  provider        ServiceProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  authorName      String
  authorTitle     String?
  authorCompany   String?
  content         String    @db.Text
  rating          Int?      // 1-5
  
  approved        Boolean   @default(false)
  approvedAt      DateTime?
  
  createdAt       DateTime  @default(now())
}

// ============================================================
// CONFERENCES
// ============================================================

model Conference {
  id              String    @id @default(cuid())
  
  // Basic info
  name            String
  slug            String    @unique
  description     String?   @db.Text
  
  // Location
  venue           String?
  address         String?
  city            String?
  state           String?
  country         String?
  virtual         Boolean   @default(false)
  virtualUrl      String?
  
  // Timing
  startDate       DateTime
  endDate         DateTime?
  timezone        String?   @default("America/New_York")
  
  // Registration
  registrationUrl String?
  ticketCost      Decimal?  @db.Decimal(10, 2)
  earlyBirdCost   Decimal?  @db.Decimal(10, 2)
  earlyBirdDeadline DateTime?
  
  // Organizer
  organizer       String?
  organizerEmail  String?
  organizerPhone  String?
  organizerUrl    String?
  
  // Content
  agenda          Json?     @db.JsonB
  speakers        Json?     @db.JsonB
  sponsors        Json?     @db.JsonB
  
  // Status
  status          ConferenceStatus @default(UPCOMING)
  visible         Boolean   @default(true)
  featured        Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([startDate, status])
  @@index([city, country])
}

enum ConferenceStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

// ============================================================
// MESSAGING
// ============================================================

model Message {
  id              String    @id @default(cuid())
  
  senderId        String
  sender          User      @relation("MessageSender", fields: [senderId], references: [id])
  
  recipientId     String
  recipient       User      @relation("MessageRecipient", fields: [recipientId], references: [id])
  
  // Thread management
  threadId        String    @default(cuid())
  parentId        String?
  
  // Content
  subject         String?
  body            String    @db.Text
  bodyHtml        String?   @db.Text
  
  // Attachments
  attachments     MessageAttachment[]
  
  // Status
  read            Boolean   @default(false)
  readAt          DateTime?
  archived        Boolean   @default(false)
  deleted         Boolean   @default(false)
  deletedAt       DateTime?
  
  // For fund inquiries
  relatedFundId   String?
  
  createdAt       DateTime  @default(now())
  
  @@index([recipientId, read, archived])
  @@index([senderId])
  @@index([threadId])
}

model MessageAttachment {
  id              String    @id @default(cuid())
  messageId       String
  message         Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  fileName        String
  fileUrl         String
  fileSize        Int
  mimeType        String
  
  createdAt       DateTime  @default(now())
}

model FundInquiry {
  id              String    @id @default(cuid())
  
  fundId          String
  fund            Fund      @relation(fields: [fundId], references: [id])
  
  investorId      String
  
  subject         String
  message         String    @db.Text
  
  // Status tracking
  status          InquiryStatus @default(PENDING)
  respondedAt     DateTime?
  respondedBy     String?
  
  createdAt       DateTime  @default(now())
  
  @@index([fundId, status])
  @@index([investorId])
}

enum InquiryStatus {
  PENDING
  VIEWED
  RESPONDED
  ARCHIVED
}

// ============================================================
// AI & ACTIVITY TRACKING
// ============================================================

model UserActivity {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Action tracking
  action          ActivityAction
  entityType      EntityType
  entityId        String?
  
  // Context
  metadata        Json?     @db.JsonB
  // Examples:
  // Search: { query: "long short equity", filters: {...}, resultCount: 45 }
  // View: { duration: 30, scrollDepth: 0.8 }
  
  // Session
  sessionId       String?
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId, action])
  @@index([entityType, entityId])
  @@index([createdAt])
}

enum ActivityAction {
  VIEW
  SEARCH
  FILTER
  CONTACT
  SAVE
  DOWNLOAD
  SHARE
  COMPARE
}

enum EntityType {
  FUND
  PROVIDER
  CONFERENCE
  DOCUMENT
  SEARCH
}

model SavedSearch {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String
  
  // Search parameters
  query           String?   // NLP query text
  filters         Json      @db.JsonB
  
  // Alerts
  alertEnabled    Boolean   @default(false)
  alertFrequency  AlertFrequency?
  lastAlertAt     DateTime?
  lastMatchCount  Int?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
}

enum AlertFrequency {
  IMMEDIATELY
  DAILY
  WEEKLY
}

// ============================================================
// AUDIT & SECURITY
// ============================================================

model AuditLog {
  id              String    @id @default(cuid())
  
  // Who
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  ipAddress       String?
  userAgent       String?
  
  // What
  action          String    // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType      String    // User, Fund, Return, etc.
  entityId        String?
  
  // Details
  oldValue        Json?     @db.JsonB
  newValue        Json?     @db.JsonB
  metadata        Json?     @db.JsonB
  
  // When
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}

// ============================================================
// BACKGROUND JOBS
// ============================================================

model JobQueue {
  id              String    @id @default(cuid())
  
  queue           String    // "stats", "email", "pdf", "import"
  jobType         String    // "calculate_fund_stats", "send_welcome_email"
  
  payload         Json      @db.JsonB
  
  status          JobStatus @default(PENDING)
  priority        Int       @default(0)
  
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)
  lastError       String?
  
  scheduledAt     DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@index([queue, status, priority, scheduledAt])
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### 3.2 Key Indexes for Performance

```sql
-- Full-text search indexes
CREATE INDEX fund_search_idx ON "Fund" USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX provider_search_idx ON "ServiceProvider" USING GIN (to_tsvector('english', "companyName" || ' ' || COALESCE(description, '')));

-- Vector similarity indexes (for AI)
CREATE INDEX fund_embedding_idx ON "Fund" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX provider_embedding_idx ON "ServiceProvider" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Partial indexes for common queries
CREATE INDEX fund_visible_approved_idx ON "Fund" (type, strategy) WHERE status = 'APPROVED' AND visible = true;
CREATE INDEX provider_visible_approved_idx ON "ServiceProvider" (category) WHERE status = 'APPROVED' AND visible = true;

-- Covering indexes for stats queries
CREATE INDEX fund_return_stats_idx ON "FundReturn" (fundId, year, month) INCLUDE (netReturn, ytdReturn);
```

### 3.3 Database Constraints

```sql
-- Ensure valid return percentages
ALTER TABLE "FundReturn" ADD CONSTRAINT valid_return_range 
  CHECK (netReturn >= -1.0 AND netReturn <= 10.0);  -- -100% to +1000%

-- Ensure valid fee percentages
ALTER TABLE "Fund" ADD CONSTRAINT valid_management_fee 
  CHECK (managementFee IS NULL OR (managementFee >= 0 AND managementFee <= 0.10));  -- 0-10%
ALTER TABLE "Fund" ADD CONSTRAINT valid_performance_fee 
  CHECK (performanceFee IS NULL OR (performanceFee >= 0 AND performanceFee <= 0.50));  -- 0-50%

-- Ensure valid month values
ALTER TABLE "FundReturn" ADD CONSTRAINT valid_month 
  CHECK (month >= 1 AND month <= 12);

-- Ensure accreditation dates are logical
ALTER TABLE "Profile" ADD CONSTRAINT valid_accreditation_dates 
  CHECK (accreditationExpires IS NULL OR accreditedAt IS NULL OR accreditationExpires > accreditedAt);

-- Ensure conference dates are logical
ALTER TABLE "Conference" ADD CONSTRAINT valid_conference_dates 
  CHECK (endDate IS NULL OR endDate >= startDate);
```

---

## 4. Statistics Engine

### 4.1 Overview

The statistics engine calculates financial metrics from monthly return data. This is a **critical system** requiring:
- High precision (Decimal arithmetic, not floating point)
- Auditability (all calculations logged)
- Idempotency (same inputs = same outputs)
- Performance (batch processing for bulk updates)

### 4.2 Calculation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Statistics Calculation Pipeline               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger Events:                                                 │
│  ├─ New return submitted                                        │
│  ├─ Return updated                                              │
│  ├─ Scheduled daily recalculation                               │
│  └─ Manual admin trigger                                        │
│                                                                  │
│            │                                                     │
│            ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  1. Validation   │  • Check data integrity                   │
│  │                  │  • Verify date sequence                    │
│  │                  │  • Flag gaps/anomalies                    │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  2. Fetch Data   │  • Get all returns for fund               │
│  │                  │  • Get benchmark data                      │
│  │                  │  • Get risk-free rate                      │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  3. Calculate    │  • Cumulative returns                     │
│  │                  │  • Risk metrics (Sharpe, Sortino, etc.)   │
│  │                  │  • Drawdown analysis                       │
│  │                  │  • Correlation & beta                      │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  4. Validate     │  • Sanity checks on results               │
│  │     Results      │  • Compare with previous values            │
│  │                  │  • Flag outliers                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  5. Persist      │  • Update FundStatistics table            │
│  │                  │  • Log calculation audit trail             │
│  │                  │  • Update search indexes                   │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  6. Notify       │  • Trigger embedding update (if needed)   │
│  │                  │  • Send alerts (if configured)            │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Statistical Formulas

```typescript
// src/lib/stats/calculations.ts

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

interface MonthlyReturn {
  year: number;
  month: number;
  netReturn: Decimal;  // e.g., 0.0523 for 5.23%
}

interface BenchmarkReturn {
  year: number;
  month: number;
  return: Decimal;
}

interface StatisticsResult {
  totalReturn: Decimal;
  cagr: Decimal;
  volatility: Decimal;
  sharpeRatio: Decimal;
  sortinoRatio: Decimal;
  calmarRatio: Decimal;
  maxDrawdown: Decimal;
  maxDrawdownDate: Date;
  currentDrawdown: Decimal;
  bestMonth: Decimal;
  worstMonth: Decimal;
  avgMonthlyReturn: Decimal;
  positiveMonths: number;
  negativeMonths: number;
  winRate: Decimal;
  skewness: Decimal;
  kurtosis: Decimal;
  correlationSP500: Decimal;
  beta: Decimal;
  alpha: Decimal;
}

export class StatisticsCalculator {
  private returns: MonthlyReturn[];
  private benchmarkReturns: BenchmarkReturn[];
  private riskFreeRate: Decimal;  // Annual rate

  constructor(
    returns: MonthlyReturn[],
    benchmarkReturns: BenchmarkReturn[],
    riskFreeRate: Decimal = new Decimal(0.05)  // Default 5%
  ) {
    // Sort by date
    this.returns = returns.sort((a, b) => 
      (a.year * 12 + a.month) - (b.year * 12 + b.month)
    );
    this.benchmarkReturns = benchmarkReturns;
    this.riskFreeRate = riskFreeRate;
  }

  /**
   * Cumulative Return
   * Formula: (1 + r1) × (1 + r2) × ... × (1 + rn) - 1
   */
  calculateCumulativeReturn(): Decimal {
    return this.returns.reduce(
      (cum, r) => cum.mul(r.netReturn.plus(1)),
      new Decimal(1)
    ).minus(1);
  }

  /**
   * CAGR (Compound Annual Growth Rate)
   * Formula: ((1 + total_return) ^ (12/months)) - 1
   */
  calculateCAGR(): Decimal {
    const totalReturn = this.calculateCumulativeReturn();
    const months = this.returns.length;
    
    if (months === 0) return new Decimal(0);
    
    // (1 + total_return)^(12/months) - 1
    return totalReturn.plus(1)
      .pow(new Decimal(12).div(months))
      .minus(1);
  }

  /**
   * Annualized Volatility
   * Formula: σ_monthly × √12
   */
  calculateVolatility(): Decimal {
    const monthlyReturns = this.returns.map(r => r.netReturn);
    const mean = this.mean(monthlyReturns);
    
    const variance = monthlyReturns.reduce((sum, r) => {
      const diff = r.minus(mean);
      return sum.plus(diff.mul(diff));
    }, new Decimal(0)).div(monthlyReturns.length - 1);
    
    const monthlyStdDev = variance.sqrt();
    
    // Annualize: multiply by sqrt(12)
    return monthlyStdDev.mul(new Decimal(12).sqrt());
  }

  /**
   * Sharpe Ratio
   * Formula: (CAGR - Rf) / σ
   */
  calculateSharpeRatio(): Decimal {
    const cagr = this.calculateCAGR();
    const volatility = this.calculateVolatility();
    
    if (volatility.isZero()) return new Decimal(0);
    
    return cagr.minus(this.riskFreeRate).div(volatility);
  }

  /**
   * Sortino Ratio
   * Formula: (CAGR - Rf) / σ_downside
   * Only considers negative returns for volatility
   */
  calculateSortinoRatio(): Decimal {
    const cagr = this.calculateCAGR();
    const monthlyRf = this.riskFreeRate.div(12);
    
    // Downside returns (below risk-free rate)
    const downsideReturns = this.returns
      .map(r => r.netReturn)
      .filter(r => r.lt(monthlyRf));
    
    if (downsideReturns.length === 0) {
      return new Decimal(999);  // No downside = excellent
    }
    
    // Downside deviation
    const downsideVariance = downsideReturns.reduce((sum, r) => {
      const diff = r.minus(monthlyRf);
      return sum.plus(diff.mul(diff));
    }, new Decimal(0)).div(downsideReturns.length);
    
    const downsideDeviation = downsideVariance.sqrt().mul(new Decimal(12).sqrt());
    
    if (downsideDeviation.isZero()) return new Decimal(999);
    
    return cagr.minus(this.riskFreeRate).div(downsideDeviation);
  }

  /**
   * Maximum Drawdown
   * Peak-to-trough decline
   */
  calculateMaxDrawdown(): { maxDrawdown: Decimal; maxDrawdownDate: Date } {
    let peak = new Decimal(1);
    let maxDrawdown = new Decimal(0);
    let maxDrawdownDate = new Date();
    let currentValue = new Decimal(1);
    
    for (const r of this.returns) {
      currentValue = currentValue.mul(r.netReturn.plus(1));
      
      if (currentValue.gt(peak)) {
        peak = currentValue;
      }
      
      const drawdown = peak.minus(currentValue).div(peak);
      
      if (drawdown.gt(maxDrawdown)) {
        maxDrawdown = drawdown;
        maxDrawdownDate = new Date(r.year, r.month - 1);
      }
    }
    
    return { maxDrawdown, maxDrawdownDate };
  }

  /**
   * Current Drawdown
   * Current distance from peak
   */
  calculateCurrentDrawdown(): Decimal {
    let peak = new Decimal(1);
    let currentValue = new Decimal(1);
    
    for (const r of this.returns) {
      currentValue = currentValue.mul(r.netReturn.plus(1));
      if (currentValue.gt(peak)) {
        peak = currentValue;
      }
    }
    
    return peak.minus(currentValue).div(peak);
  }

  /**
   * Calmar Ratio
   * Formula: CAGR / Max Drawdown
   */
  calculateCalmarRatio(): Decimal {
    const cagr = this.calculateCAGR();
    const { maxDrawdown } = this.calculateMaxDrawdown();
    
    if (maxDrawdown.isZero()) return new Decimal(999);
    
    return cagr.div(maxDrawdown);
  }

  /**
   * Correlation with benchmark
   */
  calculateCorrelation(): Decimal {
    const aligned = this.alignWithBenchmark();
    if (aligned.length < 12) return new Decimal(0);
    
    const fundReturns = aligned.map(a => a.fundReturn);
    const benchReturns = aligned.map(a => a.benchReturn);
    
    const meanFund = this.mean(fundReturns);
    const meanBench = this.mean(benchReturns);
    
    let covariance = new Decimal(0);
    let varFund = new Decimal(0);
    let varBench = new Decimal(0);
    
    for (let i = 0; i < aligned.length; i++) {
      const diffFund = fundReturns[i].minus(meanFund);
      const diffBench = benchReturns[i].minus(meanBench);
      
      covariance = covariance.plus(diffFund.mul(diffBench));
      varFund = varFund.plus(diffFund.mul(diffFund));
      varBench = varBench.plus(diffBench.mul(diffBench));
    }
    
    const denominator = varFund.sqrt().mul(varBench.sqrt());
    if (denominator.isZero()) return new Decimal(0);
    
    return covariance.div(denominator);
  }

  /**
   * Beta (CAPM)
   * Formula: Cov(Ri, Rm) / Var(Rm)
   */
  calculateBeta(): Decimal {
    const aligned = this.alignWithBenchmark();
    if (aligned.length < 12) return new Decimal(1);
    
    const fundReturns = aligned.map(a => a.fundReturn);
    const benchReturns = aligned.map(a => a.benchReturn);
    
    const meanFund = this.mean(fundReturns);
    const meanBench = this.mean(benchReturns);
    
    let covariance = new Decimal(0);
    let varBench = new Decimal(0);
    
    for (let i = 0; i < aligned.length; i++) {
      const diffFund = fundReturns[i].minus(meanFund);
      const diffBench = benchReturns[i].minus(meanBench);
      
      covariance = covariance.plus(diffFund.mul(diffBench));
      varBench = varBench.plus(diffBench.mul(diffBench));
    }
    
    if (varBench.isZero()) return new Decimal(1);
    
    return covariance.div(varBench);
  }

  /**
   * Alpha (Jensen's Alpha)
   * Formula: Ri - [Rf + β(Rm - Rf)]
   */
  calculateAlpha(): Decimal {
    const cagr = this.calculateCAGR();
    const beta = this.calculateBeta();
    const benchmarkReturn = this.calculateBenchmarkCAGR();
    
    // α = Ri - [Rf + β(Rm - Rf)]
    const expectedReturn = this.riskFreeRate.plus(
      beta.mul(benchmarkReturn.minus(this.riskFreeRate))
    );
    
    return cagr.minus(expectedReturn);
  }

  /**
   * Skewness
   * Measures asymmetry of return distribution
   */
  calculateSkewness(): Decimal {
    const monthlyReturns = this.returns.map(r => r.netReturn);
    const n = monthlyReturns.length;
    if (n < 3) return new Decimal(0);
    
    const mean = this.mean(monthlyReturns);
    const stdDev = this.standardDeviation(monthlyReturns);
    
    if (stdDev.isZero()) return new Decimal(0);
    
    const skewSum = monthlyReturns.reduce((sum, r) => {
      return sum.plus(r.minus(mean).div(stdDev).pow(3));
    }, new Decimal(0));
    
    // Adjusted Fisher-Pearson standardized moment coefficient
    return skewSum.mul(n).div((n - 1) * (n - 2));
  }

  /**
   * Kurtosis (Excess)
   * Measures "tailedness" of distribution
   * >0 = heavy tails (more extreme events), <0 = light tails
   */
  calculateKurtosis(): Decimal {
    const monthlyReturns = this.returns.map(r => r.netReturn);
    const n = monthlyReturns.length;
    if (n < 4) return new Decimal(0);
    
    const mean = this.mean(monthlyReturns);
    const stdDev = this.standardDeviation(monthlyReturns);
    
    if (stdDev.isZero()) return new Decimal(0);
    
    const kurtSum = monthlyReturns.reduce((sum, r) => {
      return sum.plus(r.minus(mean).div(stdDev).pow(4));
    }, new Decimal(0));
    
    // Excess kurtosis (subtract 3)
    const rawKurtosis = kurtSum.mul(n * (n + 1))
      .div((n - 1) * (n - 2) * (n - 3));
    
    const adjustment = new Decimal(3 * (n - 1) * (n - 1))
      .div((n - 2) * (n - 3));
    
    return rawKurtosis.minus(adjustment);
  }

  /**
   * Calculate all statistics
   */
  calculateAll(): StatisticsResult {
    const monthlyReturns = this.returns.map(r => r.netReturn);
    const { maxDrawdown, maxDrawdownDate } = this.calculateMaxDrawdown();
    
    const positiveMonths = monthlyReturns.filter(r => r.gt(0)).length;
    const negativeMonths = monthlyReturns.filter(r => r.lt(0)).length;
    
    return {
      totalReturn: this.calculateCumulativeReturn(),
      cagr: this.calculateCAGR(),
      volatility: this.calculateVolatility(),
      sharpeRatio: this.calculateSharpeRatio(),
      sortinoRatio: this.calculateSortinoRatio(),
      calmarRatio: this.calculateCalmarRatio(),
      maxDrawdown,
      maxDrawdownDate,
      currentDrawdown: this.calculateCurrentDrawdown(),
      bestMonth: Decimal.max(...monthlyReturns),
      worstMonth: Decimal.min(...monthlyReturns),
      avgMonthlyReturn: this.mean(monthlyReturns),
      positiveMonths,
      negativeMonths,
      winRate: new Decimal(positiveMonths).div(monthlyReturns.length),
      skewness: this.calculateSkewness(),
      kurtosis: this.calculateKurtosis(),
      correlationSP500: this.calculateCorrelation(),
      beta: this.calculateBeta(),
      alpha: this.calculateAlpha(),
    };
  }

  // Helper methods
  private mean(values: Decimal[]): Decimal {
    if (values.length === 0) return new Decimal(0);
    return values.reduce((sum, v) => sum.plus(v), new Decimal(0))
      .div(values.length);
  }

  private standardDeviation(values: Decimal[]): Decimal {
    if (values.length < 2) return new Decimal(0);
    const mean = this.mean(values);
    const variance = values.reduce((sum, v) => {
      const diff = v.minus(mean);
      return sum.plus(diff.mul(diff));
    }, new Decimal(0)).div(values.length - 1);
    return variance.sqrt();
  }

  private alignWithBenchmark(): Array<{ fundReturn: Decimal; benchReturn: Decimal }> {
    const benchMap = new Map(
      this.benchmarkReturns.map(b => [`${b.year}-${b.month}`, b.return])
    );
    
    return this.returns
      .filter(r => benchMap.has(`${r.year}-${r.month}`))
      .map(r => ({
        fundReturn: r.netReturn,
        benchReturn: benchMap.get(`${r.year}-${r.month}`)!,
      }));
  }

  private calculateBenchmarkCAGR(): Decimal {
    const aligned = this.alignWithBenchmark();
    if (aligned.length === 0) return new Decimal(0);
    
    const totalReturn = aligned.reduce(
      (cum, r) => cum.mul(r.benchReturn.plus(1)),
      new Decimal(1)
    ).minus(1);
    
    return totalReturn.plus(1)
      .pow(new Decimal(12).div(aligned.length))
      .minus(1);
  }
}
```

### 4.4 Stats Service

```typescript
// src/services/stats.service.ts

import { prisma } from '../lib/prisma';
import { StatisticsCalculator } from '../lib/stats/calculations';
import { jobQueue } from '../lib/queue';
import Decimal from 'decimal.js';

export class StatsService {
  /**
   * Calculate and persist statistics for a fund
   */
  async calculateFundStats(fundId: string): Promise<void> {
    // 1. Fetch all returns
    const returns = await prisma.fundReturn.findMany({
      where: { fundId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (returns.length < 3) {
      // Not enough data for meaningful statistics
      await this.clearStats(fundId);
      return;
    }

    // 2. Fetch benchmark data (S&P 500)
    const benchmarkReturns = await this.fetchBenchmarkReturns(
      returns[0].year,
      returns[0].month,
      returns[returns.length - 1].year,
      returns[returns.length - 1].month
    );

    // 3. Get current risk-free rate
    const riskFreeRate = await this.getCurrentRiskFreeRate();

    // 4. Calculate all statistics
    const calculator = new StatisticsCalculator(
      returns.map(r => ({
        year: r.year,
        month: r.month,
        netReturn: new Decimal(r.netReturn.toString()),
      })),
      benchmarkReturns,
      new Decimal(riskFreeRate)
    );

    const stats = calculator.calculateAll();

    // 5. Validate results (sanity checks)
    this.validateResults(stats);

    // 6. Persist
    await prisma.fundStatistics.upsert({
      where: { fundId },
      create: {
        fundId,
        ...this.decimalToDbFormat(stats),
        calculatedAt: new Date(),
        dataStartDate: new Date(returns[0].year, returns[0].month - 1),
        dataEndDate: new Date(
          returns[returns.length - 1].year,
          returns[returns.length - 1].month - 1
        ),
        monthsOfData: returns.length,
        riskFreeRate: new Decimal(riskFreeRate),
      },
      update: {
        ...this.decimalToDbFormat(stats),
        calculatedAt: new Date(),
        dataStartDate: new Date(returns[0].year, returns[0].month - 1),
        dataEndDate: new Date(
          returns[returns.length - 1].year,
          returns[returns.length - 1].month - 1
        ),
        monthsOfData: returns.length,
        riskFreeRate: new Decimal(riskFreeRate),
      },
    });

    // 7. Log calculation for audit
    await this.logCalculation(fundId, stats);
  }

  /**
   * Bulk recalculate all fund statistics (daily job)
   */
  async recalculateAllStats(): Promise<void> {
    const funds = await prisma.fund.findMany({
      where: { status: 'APPROVED' },
      select: { id: true },
    });

    // Queue individual calculations
    for (const fund of funds) {
      await jobQueue.add('stats', {
        type: 'CALCULATE_FUND_STATS',
        fundId: fund.id,
      }, {
        priority: 10,  // Lower priority than user-triggered
      });
    }
  }

  /**
   * Calculate rolling period returns (YTD, 1Y, 3Y, 5Y)
   */
  async calculatePeriodReturns(fundId: string): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // YTD: Jan to current month
    const ytdReturns = await prisma.fundReturn.findMany({
      where: {
        fundId,
        year: currentYear,
        month: { lte: currentMonth },
      },
      orderBy: { month: 'asc' },
    });

    const ytdReturn = ytdReturns.reduce(
      (cum, r) => cum.mul(new Decimal(r.netReturn.toString()).plus(1)),
      new Decimal(1)
    ).minus(1);

    // Update all YTD fields
    for (const r of ytdReturns) {
      const ytdAtMonth = ytdReturns
        .filter(ret => ret.month <= r.month)
        .reduce(
          (cum, ret) => cum.mul(new Decimal(ret.netReturn.toString()).plus(1)),
          new Decimal(1)
        ).minus(1);

      await prisma.fundReturn.update({
        where: { id: r.id },
        data: { ytdReturn: ytdAtMonth },
      });
    }
  }

  private async fetchBenchmarkReturns(
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<Array<{ year: number; month: number; return: Decimal }>> {
    // Fetch from benchmark data table or external API
    // This would be cached/stored locally
    const benchmarks = await prisma.benchmarkReturn.findMany({
      where: {
        benchmarkId: 'SP500',
        OR: [
          { year: { gt: startYear } },
          { year: startYear, month: { gte: startMonth } },
        ],
        AND: [
          {
            OR: [
              { year: { lt: endYear } },
              { year: endYear, month: { lte: endMonth } },
            ],
          },
        ],
      },
    });

    return benchmarks.map(b => ({
      year: b.year,
      month: b.month,
      return: new Decimal(b.netReturn.toString()),
    }));
  }

  private async getCurrentRiskFreeRate(): Promise<number> {
    // Fetch from external API or use configured default
    // Typically 10-year Treasury yield
    return 0.045;  // 4.5%
  }

  private validateResults(stats: any): void {
    // Sanity checks
    if (stats.sharpeRatio.abs().gt(10)) {
      throw new Error('Sharpe ratio out of expected range');
    }
    if (stats.maxDrawdown.gt(1)) {
      throw new Error('Max drawdown cannot exceed 100%');
    }
    if (stats.winRate.lt(0) || stats.winRate.gt(1)) {
      throw new Error('Win rate must be between 0 and 1');
    }
  }

  private decimalToDbFormat(stats: any): any {
    // Convert Decimal.js objects to Prisma Decimal format
    const result: any = {};
    for (const [key, value] of Object.entries(stats)) {
      if (value instanceof Decimal) {
        result[key] = value;
      } else if (value instanceof Date) {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async logCalculation(fundId: string, stats: any): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: 'STATS_CALCULATED',
        entityType: 'FundStatistics',
        entityId: fundId,
        newValue: stats,
        metadata: {
          calculatedAt: new Date().toISOString(),
        },
      },
    });
  }

  private async clearStats(fundId: string): Promise<void> {
    await prisma.fundStatistics.deleteMany({
      where: { fundId },
    });
  }
}
```

---

## 5. Background Jobs

### 5.1 Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BullMQ Job Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Redis                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │   Queue: stats          Queue: email         Queue: pdf  │   │
│  │   ┌──────────────┐     ┌──────────────┐     ┌─────────┐ │   │
│  │   │ calc_fund    │     │ welcome      │     │ factsheet│ │   │
│  │   │ calc_all     │     │ accred_verify│     │ perf_rpt │ │   │
│  │   │ update_ytd   │     │ alert        │     │ ddq      │ │   │
│  │   └──────────────┘     │ newsletter   │     └─────────┘ │   │
│  │                        └──────────────┘                  │   │
│  │                                                          │   │
│  │   Queue: import         Queue: ai           Queue: system│   │
│  │   ┌──────────────┐     ┌──────────────┐     ┌─────────┐ │   │
│  │   │ legacy_data  │     │ gen_embedding│     │ cleanup  │ │   │
│  │   │ benchmark    │     │ gen_summary  │     │ backup   │ │   │
│  │   │ bulk_returns │     │ recommendations│   │ expire   │ │   │
│  │   └──────────────┘     └──────────────┘     └─────────┘ │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Workers (scalable)                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Worker 1 │ │ Worker 2 │ │ Worker 3 │ │ Worker N │           │
│  │ (stats)  │ │ (email)  │ │ (pdf)    │ │ (mixed)  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Job Definitions

```typescript
// src/lib/queue/index.ts

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Queue definitions
export const queues = {
  stats: new Queue('stats', { connection }),
  email: new Queue('email', { connection }),
  pdf: new Queue('pdf', { connection }),
  import: new Queue('import', { connection }),
  ai: new Queue('ai', { connection }),
  system: new Queue('system', { connection }),
};

// Job type definitions
export interface JobPayloads {
  stats: 
    | { type: 'CALCULATE_FUND_STATS'; fundId: string }
    | { type: 'RECALCULATE_ALL_STATS' }
    | { type: 'UPDATE_PERIOD_RETURNS'; fundId: string };
  
  email:
    | { type: 'WELCOME_EMAIL'; userId: string }
    | { type: 'ACCREDITATION_VERIFIED'; userId: string }
    | { type: 'ACCREDITATION_EXPIRED'; userId: string }
    | { type: 'PASSWORD_RESET'; userId: string; token: string }
    | { type: 'FUND_INQUIRY'; inquiryId: string }
    | { type: 'ALERT_NEW_FUNDS'; savedSearchId: string; fundIds: string[] }
    | { type: 'NEWSLETTER'; templateId: string; recipientIds: string[] };
  
  pdf:
    | { type: 'FUND_FACTSHEET'; fundId: string; options?: FactsheetOptions }
    | { type: 'PERFORMANCE_REPORT'; fundId: string; startDate: string; endDate: string }
    | { type: 'DDQ_EXPORT'; fundId: string }
    | { type: 'BULK_FACTSHEETS'; fundIds: string[] };
  
  import:
    | { type: 'LEGACY_FUND_DATA'; batchId: string }
    | { type: 'BENCHMARK_DATA'; benchmarkId: string; year: number }
    | { type: 'BULK_RETURNS'; fundId: string; returns: any[] };
  
  ai:
    | { type: 'GENERATE_EMBEDDING'; entityType: string; entityId: string }
    | { type: 'GENERATE_FUND_SUMMARY'; fundId: string }
    | { type: 'UPDATE_RECOMMENDATIONS'; userId: string };
  
  system:
    | { type: 'CLEANUP_EXPIRED_SESSIONS' }
    | { type: 'CLEANUP_EXPIRED_TOKENS' }
    | { type: 'EXPIRE_ACCREDITATIONS' }
    | { type: 'BACKUP_DATABASE' }
    | { type: 'UPDATE_SEARCH_INDEXES' };
}
```

### 5.3 Worker Implementation

```typescript
// src/workers/stats.worker.ts

import { Worker, Job } from 'bullmq';
import { StatsService } from '../services/stats.service';
import { logger } from '../lib/logger';

const statsService = new StatsService();

const statsWorker = new Worker(
  'stats',
  async (job: Job) => {
    const startTime = Date.now();
    logger.info(`Processing stats job: ${job.name}`, { jobId: job.id, data: job.data });

    try {
      switch (job.data.type) {
        case 'CALCULATE_FUND_STATS':
          await statsService.calculateFundStats(job.data.fundId);
          break;
        
        case 'RECALCULATE_ALL_STATS':
          await statsService.recalculateAllStats();
          break;
        
        case 'UPDATE_PERIOD_RETURNS':
          await statsService.calculatePeriodReturns(job.data.fundId);
          break;
        
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }

      const duration = Date.now() - startTime;
      logger.info(`Stats job completed`, { jobId: job.id, duration });
      
    } catch (error) {
      logger.error(`Stats job failed`, { jobId: job.id, error });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000,  // 100 jobs per minute
    },
  }
);

// Error handling
statsWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error: ${err.message}`);
});

statsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

export { statsWorker };
```

### 5.4 Scheduled Jobs (Cron)

```typescript
// src/lib/queue/scheduler.ts

import { queues } from './index';

export function setupScheduledJobs() {
  // Daily: Recalculate all statistics (2 AM UTC)
  queues.stats.add(
    'daily-stats-recalc',
    { type: 'RECALCULATE_ALL_STATS' },
    {
      repeat: { cron: '0 2 * * *' },
      jobId: 'daily-stats-recalc',
    }
  );

  // Daily: Check for expiring accreditations (6 AM UTC)
  queues.system.add(
    'expire-accreditations',
    { type: 'EXPIRE_ACCREDITATIONS' },
    {
      repeat: { cron: '0 6 * * *' },
      jobId: 'expire-accreditations',
    }
  );

  // Hourly: Clean up expired sessions
  queues.system.add(
    'cleanup-sessions',
    { type: 'CLEANUP_EXPIRED_SESSIONS' },
    {
      repeat: { cron: '0 * * * *' },
      jobId: 'cleanup-sessions',
    }
  );

  // Weekly: Update all embeddings (Sunday 3 AM UTC)
  queues.ai.add(
    'weekly-embeddings',
    { type: 'UPDATE_ALL_EMBEDDINGS' },
    {
      repeat: { cron: '0 3 * * 0' },
      jobId: 'weekly-embeddings',
    }
  );

  // Daily: Import benchmark data (1 AM UTC)
  queues.import.add(
    'daily-benchmark-import',
    { type: 'BENCHMARK_DATA', benchmarkId: 'SP500', year: new Date().getFullYear() },
    {
      repeat: { cron: '0 1 * * *' },
      jobId: 'daily-benchmark-import',
    }
  );
}
```

### 5.5 Job Retry & Error Handling

```typescript
// Default job options by queue
export const defaultJobOptions = {
  stats: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,  // 5s, 10s, 20s
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
  email: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000,  // 10s, 20s, 40s, 80s, 160s
    },
    removeOnComplete: { age: 86400 },  // 24 hours
    removeOnFail: { age: 604800 },     // 7 days
  },
  pdf: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000,  // 30 seconds
    },
    timeout: 120000,  // 2 minutes
  },
};

// Dead letter queue for failed jobs
export async function handleDeadLetter(job: Job, error: Error) {
  await prisma.failedJob.create({
    data: {
      queue: job.queueName,
      jobType: job.data.type,
      payload: job.data,
      error: error.message,
      stackTrace: error.stack,
      attempts: job.attemptsMade,
      failedAt: new Date(),
    },
  });

  // Alert for critical failures
  if (job.data.type.includes('ACCREDITATION') || job.data.type.includes('SECURITY')) {
    await alertOps('Critical job failure', { job: job.id, error: error.message });
  }
}
```

---

## 6. PDF Generation

### 6.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PDF Generation Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request Flow:                                                   │
│                                                                  │
│  API Request                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────┐                                           │
│  │ PDF Controller   │  • Validates request                       │
│  │                  │  • Checks permissions                      │
│  │                  │  • Queues job (async) or generates (sync) │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ PDF Service      │  • Fetches all required data              │
│  │                  │  • Prepares template context               │
│  │                  │  • Calls renderer                          │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Template Engine  │  • React-PDF components                    │
│  │ (React-PDF)      │  • Styled templates                        │
│  │                  │  • Charts & tables                         │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ PDF Buffer       │  • Generated PDF bytes                     │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ├─────────────────┐                                   │
│           ▼                 ▼                                   │
│  ┌──────────────┐  ┌──────────────────┐                        │
│  │ S3 Upload    │  │ Direct Response  │                        │
│  │ (async jobs) │  │ (sync requests)  │                        │
│  └──────────────┘  └──────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 React-PDF Templates

```typescript
// src/lib/pdf/templates/factsheet.tsx

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { FundData, StatsData, ReturnsData } from '../types';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 'medium' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 15,
  },
  fundName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBox: {
    width: '25%',
    padding: 10,
    borderRight: '1pt solid #e2e8f0',
    borderBottom: '1pt solid #e2e8f0',
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  returnsTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e2e8f0',
  },
  tableCell: {
    flex: 1,
    textAlign: 'right',
  },
  disclaimer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#64748b',
  },
});

interface FactsheetProps {
  fund: FundData;
  stats: StatsData;
  returns: ReturnsData[];
  generatedAt: Date;
}

export const FundFactsheet: React.FC<FactsheetProps> = ({
  fund,
  stats,
  returns,
  generatedAt,
}) => {
  const formatPercent = (value: number | null) => 
    value !== null ? `${(value * 100).toFixed(2)}%` : 'N/A';
  
  const formatCurrency = (value: number | null) =>
    value !== null ? `$${(value / 1000000).toFixed(1)}M` : 'N/A';
  
  const formatRatio = (value: number | null) =>
    value !== null ? value.toFixed(2) : 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.fundName}>{fund.name}</Text>
            <Text style={styles.subtitle}>
              {fund.type} | {fund.strategy}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Image src="/logo.png" style={{ width: 100, height: 30 }} />
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 5 }}>
              As of {generatedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Key Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>YTD Return</Text>
              <Text style={styles.statValue}>{formatPercent(stats.ytdReturn)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>1-Year Return</Text>
              <Text style={styles.statValue}>{formatPercent(stats.oneYearReturn)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CAGR (Since Inception)</Text>
              <Text style={styles.statValue}>{formatPercent(stats.cagr)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Return</Text>
              <Text style={styles.statValue}>{formatPercent(stats.totalReturn)}</Text>
            </View>
          </View>
        </View>

        {/* Risk Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Sharpe Ratio</Text>
              <Text style={styles.statValue}>{formatRatio(stats.sharpeRatio)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Sortino Ratio</Text>
              <Text style={styles.statValue}>{formatRatio(stats.sortinoRatio)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Max Drawdown</Text>
              <Text style={styles.statValue}>{formatPercent(stats.maxDrawdown)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Volatility (Ann.)</Text>
              <Text style={styles.statValue}>{formatPercent(stats.volatility)}</Text>
            </View>
          </View>
        </View>

        {/* Fund Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fund Details</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text>AUM: {formatCurrency(fund.aum)}</Text>
              <Text>Inception: {fund.inceptionDate?.toLocaleDateString()}</Text>
              <Text>Min Investment: {formatCurrency(fund.minInvestment)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>Management Fee: {formatPercent(fund.managementFee)}</Text>
              <Text>Performance Fee: {formatPercent(fund.performanceFee)}</Text>
              <Text>Lockup: {fund.lockupPeriod || 'None'}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Returns Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Returns</Text>
          <View style={styles.returnsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'left' }]}>Year</Text>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'YTD'].map(m => (
                <Text key={m} style={styles.tableCell}>{m}</Text>
              ))}
            </View>
            {/* Group returns by year and render rows */}
            {groupReturnsByYear(returns).map(yearData => (
              <View key={yearData.year} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'left' }]}>{yearData.year}</Text>
                {yearData.months.map((r, i) => (
                  <Text 
                    key={i} 
                    style={[
                      styles.tableCell, 
                      { color: r && r < 0 ? '#dc2626' : '#16a34a' }
                    ]}
                  >
                    {r !== null ? formatPercent(r) : '-'}
                  </Text>
                ))}
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                  {formatPercent(yearData.ytd)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Past performance is not indicative of future results. This document is for informational 
          purposes only and does not constitute an offer to sell or a solicitation of an offer to buy 
          any securities. Investors should carefully consider the investment objectives, risks, charges, 
          and expenses before investing. This information is confidential and intended solely for 
          accredited investors.
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>HedgeCo.Net | www.hedgeco.net</Text>
          <Text>Generated: {generatedAt.toISOString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Helper function
function groupReturnsByYear(returns: ReturnsData[]) {
  const years: Record<number, { months: (number | null)[]; ytd: number | null }> = {};
  
  for (const r of returns) {
    if (!years[r.year]) {
      years[r.year] = { months: Array(12).fill(null), ytd: null };
    }
    years[r.year].months[r.month - 1] = r.netReturn;
  }
  
  // Calculate YTD for each year
  for (const [year, data] of Object.entries(years)) {
    const validReturns = data.months.filter(r => r !== null) as number[];
    if (validReturns.length > 0) {
      data.ytd = validReturns.reduce((cum, r) => cum * (1 + r), 1) - 1;
    }
  }
  
  return Object.entries(years)
    .map(([year, data]) => ({ year: parseInt(year), ...data }))
    .sort((a, b) => b.year - a.year);
}
```

### 6.3 PDF Service

```typescript
// src/services/pdf.service.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { FundFactsheet } from '../lib/pdf/templates/factsheet';
import { PerformanceReport } from '../lib/pdf/templates/performance';
import { prisma } from '../lib/prisma';
import { s3Client, uploadToS3 } from '../lib/s3';
import { logger } from '../lib/logger';

export class PDFService {
  /**
   * Generate fund factsheet PDF
   */
  async generateFactsheet(fundId: string, options?: FactsheetOptions): Promise<Buffer> {
    // Fetch all required data
    const [fund, stats, returns] = await Promise.all([
      prisma.fund.findUniqueOrThrow({
        where: { id: fundId },
        include: { manager: { include: { profile: true } } },
      }),
      prisma.fundStatistics.findUnique({ where: { fundId } }),
      prisma.fundReturn.findMany({
        where: { fundId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 60,  // Last 5 years
      }),
    ]);

    // Render PDF
    const buffer = await renderToBuffer(
      <FundFactsheet
        fund={fund}
        stats={stats}
        returns={returns}
        generatedAt={new Date()}
      />
    );

    // Log generation
    await prisma.auditLog.create({
      data: {
        action: 'PDF_GENERATED',
        entityType: 'Fund',
        entityId: fundId,
        metadata: { type: 'FACTSHEET', options },
      },
    });

    return buffer;
  }

  /**
   * Generate and store factsheet (for async jobs)
   */
  async generateAndStoreFactsheet(fundId: string): Promise<string> {
    const buffer = await this.generateFactsheet(fundId);
    
    const fund = await prisma.fund.findUniqueOrThrow({
      where: { id: fundId },
      select: { slug: true },
    });

    const key = `factsheets/${fund.slug}-${Date.now()}.pdf`;
    const url = await uploadToS3(buffer, key, 'application/pdf');

    // Store document reference
    await prisma.fundDocument.create({
      data: {
        fundId,
        documentType: 'FACTSHEET',
        title: `Fund Factsheet - ${new Date().toLocaleDateString()}`,
        fileName: `${fund.slug}-factsheet.pdf`,
        fileUrl: url,
        fileSize: buffer.length,
        mimeType: 'application/pdf',
        fileHash: await this.hashBuffer(buffer),
        accessLevel: 'ACCREDITED',
        uploadedBy: 'SYSTEM',
      },
    });

    return url;
  }

  /**
   * Generate performance report for date range
   */
  async generatePerformanceReport(
    fundId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Buffer> {
    const [fund, returns, benchmarkReturns] = await Promise.all([
      prisma.fund.findUniqueOrThrow({ where: { id: fundId } }),
      prisma.fundReturn.findMany({
        where: {
          fundId,
          OR: [
            { year: { gt: startDate.getFullYear() } },
            { year: startDate.getFullYear(), month: { gte: startDate.getMonth() + 1 } },
          ],
          AND: [
            {
              OR: [
                { year: { lt: endDate.getFullYear() } },
                { year: endDate.getFullYear(), month: { lte: endDate.getMonth() + 1 } },
              ],
            },
          ],
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      this.fetchBenchmarkReturns(startDate, endDate),
    ]);

    return renderToBuffer(
      <PerformanceReport
        fund={fund}
        returns={returns}
        benchmarkReturns={benchmarkReturns}
        startDate={startDate}
        endDate={endDate}
        generatedAt={new Date()}
      />
    );
  }

  /**
   * Bulk generate factsheets for multiple funds
   */
  async bulkGenerateFactsheets(fundIds: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const fundId of fundIds) {
      try {
        const url = await this.generateAndStoreFactsheet(fundId);
        results.set(fundId, url);
      } catch (error) {
        logger.error(`Failed to generate factsheet for ${fundId}`, { error });
        results.set(fundId, 'ERROR');
      }
    }
    
    return results;
  }

  private async hashBuffer(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async fetchBenchmarkReturns(startDate: Date, endDate: Date) {
    return prisma.benchmarkReturn.findMany({
      where: {
        benchmarkId: 'SP500',
        // Date filtering logic
      },
    });
  }
}
```

---

## 7. Security

### 7.1 Input Validation

```typescript
// src/lib/validation/schemas.ts

import { z } from 'zod';

// Sanitization helpers
const sanitizeString = (s: string) => s.trim().replace(/<[^>]*>/g, '');

// Common schemas
export const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255);

export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const slugSchema = z.string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

// Fund schemas
export const fundCreateSchema = z.object({
  name: z.string().min(3).max(200).transform(sanitizeString),
  type: z.nativeEnum(FundType),
  strategy: z.string().max(100).optional(),
  description: z.string().max(10000).optional().transform(s => s ? sanitizeString(s) : s),
  aum: z.number().positive().max(1e15).optional(),  // Max $1 quadrillion
  managementFee: z.number().min(0).max(0.1).optional(),  // 0-10%
  performanceFee: z.number().min(0).max(0.5).optional(),  // 0-50%
  minInvestment: z.number().positive().max(1e12).optional(),
});

export const fundReturnSchema = z.object({
  fundId: z.string().cuid(),
  year: z.number().int().min(1990).max(2100),
  month: z.number().int().min(1).max(12),
  netReturn: z.number().min(-1).max(10),  // -100% to +1000%
  grossReturn: z.number().min(-1).max(10).optional(),
  provisional: z.boolean().default(false),
});

// Search schemas (prevent injection)
export const searchQuerySchema = z.object({
  query: z.string().max(500).transform(sanitizeString).optional(),
  type: z.nativeEnum(FundType).optional(),
  strategy: z.string().max(100).optional(),
  minAum: z.number().positive().optional(),
  maxAum: z.number().positive().optional(),
  minReturn: z.number().min(-1).max(10).optional(),
  country: z.string().length(2).optional(),  // ISO country code
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
```

### 7.2 Rate Limiting

```typescript
// src/lib/rateLimit/index.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different rate limits by endpoint type
export const rateLimiters = {
  // Auth endpoints: strict limits
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 requests per minute
    prefix: 'ratelimit:auth',
  }),
  
  // Login specifically (prevent brute force)
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),  // 3 attempts per minute
    prefix: 'ratelimit:login',
  }),
  
  // API read endpoints
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
    prefix: 'ratelimit:api',
  }),
  
  // Search endpoints
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),  // 30 searches per minute
    prefix: 'ratelimit:search',
  }),
  
  // AI endpoints (expensive)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 AI requests per minute
    prefix: 'ratelimit:ai',
  }),
  
  // PDF generation
  pdf: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 PDFs per minute
    prefix: 'ratelimit:pdf',
  }),
  
  // Message sending
  message: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),  // 20 messages per hour
    prefix: 'ratelimit:message',
  }),
};

// Middleware
export async function rateLimitMiddleware(
  limiterType: keyof typeof rateLimiters,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = rateLimiters[limiterType];
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// IP-based + User-based combined limit
export async function combinedRateLimit(
  limiterType: keyof typeof rateLimiters,
  ip: string,
  userId?: string
): Promise<boolean> {
  // Check IP limit
  const ipResult = await rateLimitMiddleware(limiterType, `ip:${ip}`);
  if (!ipResult.success) return false;
  
  // If authenticated, also check user limit (more generous)
  if (userId) {
    const userLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'),  // 2x for authenticated users
      prefix: `ratelimit:${limiterType}:user`,
    });
    const userResult = await userLimiter.limit(userId);
    return userResult.success;
  }
  
  return true;
}
```

### 7.3 Audit Logging

```typescript
// src/lib/audit/index.ts

import { prisma } from '../prisma';
import { logger } from '../logger';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async log(ctx: AuditContext, event: AuditEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          oldValue: event.oldValue,
          newValue: event.newValue,
          metadata: {
            ...event.metadata,
            sessionId: ctx.sessionId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      // Audit logging should never break the main flow
      logger.error('Failed to write audit log', { error, ctx, event });
    }
  }

  /**
   * Log security-sensitive events with additional alerting
   */
  async logSecurityEvent(ctx: AuditContext, event: AuditEvent): Promise<void> {
    await this.log(ctx, event);
    
    // Additional alerting for security events
    if (this.isHighSeverityEvent(event)) {
      await this.alertSecurityTeam(ctx, event);
    }
  }

  private isHighSeverityEvent(event: AuditEvent): boolean {
    const highSeverityActions = [
      'LOGIN_FAILED_MULTIPLE',
      'ADMIN_ACCESS',
      'PERMISSION_CHANGE',
      'PASSWORD_RESET_REQUEST',
      'ACCOUNT_LOCKED',
      'TOKEN_REUSE_DETECTED',
      'SUSPICIOUS_ACTIVITY',
    ];
    return highSeverityActions.includes(event.action);
  }

  private async alertSecurityTeam(ctx: AuditContext, event: AuditEvent): Promise<void> {
    // Send to security monitoring (Datadog, PagerDuty, etc.)
    logger.warn('SECURITY_ALERT', { ctx, event });
    // await pagerduty.trigger(...)
  }
}

// Pre-defined audit actions
export const AuditActions = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_FAILED_MULTIPLE: 'LOGIN_FAILED_MULTIPLE',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  
  // User
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCREDITATION_REQUESTED: 'ACCREDITATION_REQUESTED',
  ACCREDITATION_APPROVED: 'ACCREDITATION_APPROVED',
  ACCREDITATION_REJECTED: 'ACCREDITATION_REJECTED',
  
  // Fund
  FUND_CREATED: 'FUND_CREATED',
  FUND_UPDATED: 'FUND_UPDATED',
  FUND_DELETED: 'FUND_DELETED',
  FUND_APPROVED: 'FUND_APPROVED',
  RETURN_SUBMITTED: 'RETURN_SUBMITTED',
  RETURN_UPDATED: 'RETURN_UPDATED',
  
  // Access
  FUND_VIEWED: 'FUND_VIEWED',
  DOCUMENT_DOWNLOADED: 'DOCUMENT_DOWNLOADED',
  PDF_GENERATED: 'PDF_GENERATED',
  
  // Admin
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  
  // Security
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const;
```

### 7.4 Data Encryption

```typescript
// src/lib/crypto/index.ts

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export class EncryptionService {
  private masterKey: Buffer;

  constructor() {
    // Master key from environment (stored in secrets manager)
    this.masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex');
    
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error('Invalid master key length');
    }
  }

  /**
   * Encrypt sensitive data (PII, financial info)
   */
  async encrypt(plaintext: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    
    // Derive key from master key + salt
    const derivedKey = await scryptAsync(this.masterKey, salt, KEY_LENGTH) as Buffer;
    
    const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: salt:iv:authTag:ciphertext (all hex)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(ciphertext: string): Promise<string> {
    const [saltHex, ivHex, authTagHex, encrypted] = ciphertext.split(':');
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Derive same key
    const derivedKey = await scryptAsync(this.masterKey, salt, KEY_LENGTH) as Buffer;
    
    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  async hash(data: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || randomBytes(SALT_LENGTH).toString('hex');
    const derived = await scryptAsync(data, useSalt, 64) as Buffer;
    return {
      hash: derived.toString('hex'),
      salt: useSalt,
    };
  }

  /**
   * Verify hashed data
   */
  async verifyHash(data: string, hash: string, salt: string): Promise<boolean> {
    const { hash: computed } = await this.hash(data, salt);
    // Constant-time comparison
    return computed === hash;
  }
}

// Field-level encryption for Prisma (middleware)
export function createEncryptionMiddleware(fields: Record<string, string[]>) {
  const encryption = new EncryptionService();
  
  return {
    async $allOperations({ operation, model, args, query }) {
      const encryptedFields = fields[model] || [];
      
      // Encrypt on create/update
      if (['create', 'update', 'upsert'].includes(operation)) {
        for (const field of encryptedFields) {
          if (args.data?.[field]) {
            args.data[field] = await encryption.encrypt(args.data[field]);
          }
        }
      }
      
      const result = await query(args);
      
      // Decrypt on read
      if (result && typeof result === 'object') {
        for (const field of encryptedFields) {
          if (result[field]) {
            result[field] = await encryption.decrypt(result[field]);
          }
        }
      }
      
      return result;
    },
  };
}

// Usage:
// prisma.$use(createEncryptionMiddleware({
//   Profile: ['phone'],
//   AccreditationDocument: ['fileUrl'],
// }));
```

### 7.5 Security Headers & CSP

```typescript
// src/middleware/security.ts

export const securityHeaders = {
  // Prevent XSS
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // HSTS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",  // For charts
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.openai.com",  // For AI features
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};
```

---

## 8. Migration Strategy

### 8.1 Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Migration Strategy                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Analysis & Mapping (2 weeks)                          │
│  ├─ Export legacy MySQL schema                                  │
│  ├─ Document all tables, columns, relationships                 │
│  ├─ Map legacy fields → new Prisma schema                       │
│  ├─ Identify data quality issues                                │
│  └─ Create transformation rules                                  │
│                                                                  │
│  Phase 2: ETL Pipeline Development (3 weeks)                    │
│  ├─ Build extraction scripts                                    │
│  ├─ Develop transformation logic                                │
│  ├─ Create validation rules                                     │
│  └─ Build load procedures                                       │
│                                                                  │
│  Phase 3: Test Migrations (2 weeks)                             │
│  ├─ Run migration on test environment                           │
│  ├─ Validate data integrity                                     │
│  ├─ Performance testing                                         │
│  └─ Fix issues, iterate                                         │
│                                                                  │
│  Phase 4: Production Migration (1 week)                         │
│  ├─ Final data export from legacy                               │
│  ├─ Run migration scripts                                       │
│  ├─ Validate production data                                    │
│  └─ Enable new system                                           │
│                                                                  │
│  Phase 5: Parallel Run & Cutover (2 weeks)                      │
│  ├─ Both systems running                                        │
│  ├─ Monitor for discrepancies                                   │
│  ├─ Final cutover                                               │
│  └─ Decommission legacy                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Legacy Schema Analysis

```typescript
// scripts/migration/analyze-legacy.ts

import mysql from 'mysql2/promise';

interface LegacyTable {
  name: string;
  columns: LegacyColumn[];
  rowCount: number;
  issues: string[];
}

interface LegacyColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
}

export async function analyzeLegacySchema(): Promise<LegacyTable[]> {
  const connection = await mysql.createConnection({
    host: process.env.LEGACY_DB_HOST,
    user: process.env.LEGACY_DB_USER,
    password: process.env.LEGACY_DB_PASSWORD,
    database: process.env.LEGACY_DB_NAME,
  });

  // Get all tables
  const [tables] = await connection.execute<any[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
    [process.env.LEGACY_DB_NAME]
  );

  const analysis: LegacyTable[] = [];

  for (const table of tables) {
    const tableName = table.table_name;
    
    // Get columns
    const [columns] = await connection.execute<any[]>(
      "SELECT column_name, data_type, is_nullable, column_key FROM information_schema.columns WHERE table_schema = ? AND table_name = ?",
      [process.env.LEGACY_DB_NAME, tableName]
    );
    
    // Get row count
    const [count] = await connection.execute<any[]>(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    
    // Detect issues
    const issues = await detectDataIssues(connection, tableName);
    
    analysis.push({
      name: tableName,
      columns: columns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES',
        key: c.column_key,
      })),
      rowCount: count[0].cnt,
      issues,
    });
  }

  await connection.end();
  return analysis;
}

async function detectDataIssues(connection: any, tableName: string): Promise<string[]> {
  const issues: string[] = [];
  
  // Check for orphaned foreign keys
  // Check for invalid dates
  // Check for encoding issues
  // Check for duplicate entries
  
  return issues;
}
```

### 8.3 Field Mapping

```typescript
// scripts/migration/mappings.ts

export const FIELD_MAPPINGS = {
  // Users table
  users: {
    targetModel: 'User',
    fields: {
      user_id: { target: 'id', transform: 'legacyIdToCuid' },
      email: { target: 'email', transform: 'toLowerCase' },
      password: { target: 'passwordHash', transform: 'rehash' },
      user_type: { target: 'role', transform: 'mapUserType' },
      created_date: { target: 'createdAt', transform: 'parseDate' },
      last_login: { target: 'lastLoginAt', transform: 'parseDate' },
      active: { target: 'active', transform: 'intToBool' },
    },
  },
  
  // Funds table