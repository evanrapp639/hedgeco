# HedgeCo.Net v2 — QA Plan

> **Document Owner:** QA Lead  
> **Last Updated:** 2026-02-12  
> **Status:** Draft  

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Test Environment & Data](#2-test-environment--data)
3. [Critical User Flows](#3-critical-user-flows)
4. [AI Feature Testing](#4-ai-feature-testing)
5. [Security Testing](#5-security-testing)
6. [Performance Benchmarks](#6-performance-benchmarks)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Test Automation Strategy](#8-test-automation-strategy)
9. [Bug Severity & Triage](#9-bug-severity--triage)
10. [Release Checklist](#10-release-checklist)

---

## 1. Test Strategy Overview

### 1.1 Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  (~10%) - Critical paths only
                   ─┴─────────┴─
                  ┌─────────────┐
                  │ Integration │  (~30%) - API + DB + Services
                 ─┴─────────────┴─
                ┌─────────────────┐
                │    Unit Tests   │  (~60%) - Business logic
               ─┴─────────────────┴─
```

### 1.2 Test Types & Ownership

| Test Type | Scope | Tools | Owner | Run Frequency |
|-----------|-------|-------|-------|---------------|
| **Unit** | Functions, utils, calculations | Jest, Vitest | Developers | Every commit |
| **Integration** | API endpoints, DB queries | Jest + Supertest | Developers | Every PR |
| **Component** | React components | React Testing Library | Frontend Dev | Every PR |
| **E2E** | User flows, multi-page | Playwright | QA | Nightly + Pre-release |
| **Visual Regression** | UI screenshots | Playwright + Percy | QA | Weekly + Pre-release |
| **Performance** | Load, stress, latency | k6, Artillery | QA/DevOps | Weekly |
| **Security** | Penetration, OWASP | OWASP ZAP, Burp | Security/QA | Monthly + Pre-release |
| **Accessibility** | WCAG compliance | axe-core, Lighthouse | QA | Every release |

### 1.3 Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| Business Logic (statistics engine) | **95%** | Financial calculations must be exact |
| API Endpoints | **90%** | Core data flow |
| React Components | **80%** | UI reliability |
| E2E Critical Paths | **100%** | All happy paths covered |
| Overall Line Coverage | **85%** | Balanced coverage |

### 1.4 Test Data Strategy

**Principles:**
- Seed data generated from anonymized production patterns
- Edge cases codified as fixtures
- No real investor PII in test environments
- Deterministic test data for statistical calculations

**Test Data Sets:**
1. `seed-minimal.sql` — 10 funds, 5 users (smoke tests)
2. `seed-standard.sql` — 500 funds, 100 users (integration)
3. `seed-load.sql` — 50K funds, 10K users (performance)
4. `seed-edge-cases.sql` — Boundary conditions, malformed data

---

## 2. Test Environment & Data

### 2.1 Environments

| Environment | Purpose | Data | URL Pattern |
|-------------|---------|------|-------------|
| **Local** | Developer testing | seed-minimal | localhost:3000 |
| **CI/CD** | Automated tests | seed-standard | ephemeral |
| **Staging** | UAT, QA testing | anonymized prod clone | staging.hedgeco.net |
| **Production** | Live | real | hedgeco.net |

### 2.2 Test Users

Each environment must have these test accounts:

```javascript
const TEST_USERS = {
  investor: {
    email: 'test-investor@hedgeco.test',
    password: 'TestPass123!',
    accredited: true,
    profile: { firstName: 'Test', lastName: 'Investor' }
  },
  investorUnaccredited: {
    email: 'test-unaccredited@hedgeco.test',
    password: 'TestPass123!',
    accredited: false
  },
  manager: {
    email: 'test-manager@hedgeco.test',
    password: 'TestPass123!',
    funds: ['Test Fund Alpha', 'Test Fund Beta']
  },
  serviceProvider: {
    email: 'test-provider@hedgeco.test',
    password: 'TestPass123!',
    company: 'Test Legal Services LLC'
  },
  newsMember: {
    email: 'test-news@hedgeco.test',
    password: 'TestPass123!'
  },
  admin: {
    email: 'test-admin@hedgeco.test',
    password: 'AdminPass456!'
  }
};
```

### 2.3 Mock Data Requirements

**Funds (seed-standard):**
- 200 Hedge Funds (across all strategies)
- 100 Private Equity
- 100 Venture Capital
- 50 Real Estate
- 25 Crypto
- 25 SPVs

**Fund Returns:**
- 5 years of monthly returns per fund
- Include edge cases: negative months, flat months, extreme returns
- One fund with missing data gaps

**Service Providers:**
- At least 3 per category (78+ categories = 234+ providers)
- Various tiers (Basic, Premium, Featured)

---

## 3. Critical User Flows

### 3.1 User Registration

#### 3.1.1 Investor Registration

```gherkin
Feature: Investor Registration
  
  Scenario: Successful investor registration
    Given I am on the registration page
    When I select "Investor" as account type
    And I enter valid email "newuser@example.com"
    And I enter password meeting requirements
    And I confirm the password
    And I accept terms of service
    And I click "Create Account"
    Then I should receive verification email
    And I should see "Verify your email" message
    
  Scenario: Registration with existing email
    Given email "existing@hedgeco.net" is already registered
    When I attempt to register with "existing@hedgeco.net"
    Then I should see error "Email already registered"
    And I should see "Sign in" link
    
  Scenario: Password requirements validation
    When I enter password "weak"
    Then I should see password strength indicator
    And I should see "Password must contain..."
    And submit button should be disabled
```

**Edge Cases to Test:**
- [ ] Email with plus addressing (user+tag@example.com)
- [ ] International characters in name fields
- [ ] Very long names (255+ characters)
- [ ] SQL injection in all fields
- [ ] XSS in name fields
- [ ] Concurrent registration same email (race condition)
- [ ] Registration during maintenance window

#### 3.1.2 Manager Registration

Additional tests:
- [ ] Company verification fields
- [ ] AUM validation (numeric, reasonable range)
- [ ] Fund management history requirements

#### 3.1.3 Service Provider Registration

Additional tests:
- [ ] Category selection (all 78+ categories)
- [ ] Website URL validation
- [ ] Phone number formatting (international)

### 3.2 Accreditation Workflow

```gherkin
Feature: Investor Accreditation
  
  Background:
    Given I am logged in as an unaccredited investor
    
  Scenario: Self-certification accreditation
    When I navigate to "Become Accredited"
    And I select "Individual Net Worth > $1M"
    And I certify the statement is accurate
    And I submit the form
    Then my account should be marked "Accreditation Pending"
    And admin should receive notification
    
  Scenario: Document-based accreditation
    When I select "Upload verification documents"
    And I upload a valid CPA letter (PDF)
    Then document should be scanned for malware
    And document should be stored securely
    And status should show "Documents Under Review"
    
  Scenario: Accreditation expiry
    Given my accreditation was approved 366 days ago
    When I log in
    Then I should see "Accreditation expired" warning
    And I should have limited fund access
    And I should see "Re-certify" prompt
```

**Accreditation Test Matrix:**

| Scenario | Expected Behavior |
|----------|-------------------|
| Net worth > $1M (excluding primary residence) | Eligible |
| Income > $200K individual (2 years) | Eligible |
| Income > $300K joint (2 years) | Eligible |
| Licensed professional (Series 7, 65, 82) | Eligible |
| Entity with > $5M assets | Eligible |
| None of the above | Not eligible |
| Expired accreditation (>1 year) | Require re-certification |

### 3.3 Fund Search

#### 3.3.1 Basic Search

```gherkin
Feature: Fund Search
  
  Background:
    Given I am logged in as an accredited investor
    And I am on the fund search page
    
  Scenario: Search by fund name
    When I enter "Alpha" in the search box
    And I press Enter
    Then I should see funds containing "Alpha" in the name
    And results should be paginated (20 per page)
    And I should see total result count
    
  Scenario: Filter by fund type
    When I select "Hedge Fund" from type filter
    Then I should only see Hedge Fund results
    And the filter should show as active
    
  Scenario: Multi-filter search
    When I apply the following filters:
      | Filter | Value |
      | Type | Hedge Fund |
      | Strategy | Long/Short Equity |
      | Min AUM | $10M |
      | Max AUM | $500M |
      | Geography | United States |
    Then results should match ALL criteria
    And I should see "Clear filters" option
```

#### 3.3.2 Advanced Filter Combinations

Test all filter combinations for correctness:

| Filter Set | Expected Count (seed-standard) |
|------------|-------------------------------|
| Type: Hedge Fund | ~200 |
| Type: Hedge Fund + Strategy: Long/Short | ~40 |
| Type: Hedge Fund + AUM > $100M | ~30 |
| Returns: CAGR > 15% | ~50 |
| Returns: Sharpe > 1.5 | ~25 |
| Inception: < 2020 | ~150 |

**Edge Cases:**
- [ ] Search with no results (show helpful message)
- [ ] Search with special characters ("O'Connor Fund")
- [ ] Search with Unicode ("Müller Capital")
- [ ] Extremely broad search (1000+ results, test pagination)
- [ ] Filter combination returning 0 results
- [ ] Rapid filter toggling (debounce)
- [ ] Search while logged out (should prompt login for details)

### 3.4 Fund Returns Entry (Manager)

```gherkin
Feature: Monthly Returns Entry
  
  Background:
    Given I am logged in as a fund manager
    And I navigate to "My Funds" > "Test Fund Alpha" > "Returns"
    
  Scenario: Enter monthly return
    When I select year "2026" and month "January"
    And I enter net return "2.35"
    And I click "Save"
    Then the return should be saved
    And statistics should recalculate (CAGR, Sharpe, etc.)
    And I should see "Statistics updated" confirmation
    
  Scenario: Bulk returns upload (CSV)
    When I click "Upload CSV"
    And I upload a valid returns CSV
    Then I should see preview of data
    And validation errors should be highlighted
    When I confirm the upload
    Then all returns should be saved
    And statistics should recalculate
    
  Scenario: Edit existing return
    Given January 2026 has return "2.35%"
    When I change it to "2.40%"
    And I save
    Then the return should update
    And audit log should record the change
    And statistics should recalculate
```

**Returns Entry Validation:**

| Input | Expected Behavior |
|-------|-------------------|
| `5.25` | Valid (5.25%) |
| `5.25%` | Valid (strip %) |
| `-3.5` | Valid (negative return) |
| `0` | Valid (flat month) |
| `500` | Warning: "This is a 500% return. Confirm?" |
| `-100` | Error: "Return cannot be less than -100%" |
| `abc` | Error: "Please enter a valid number" |
| Empty + required | Error: "Return is required" |
| Duplicate month | Error: "Return for Jan 2026 already exists" |

**Statistical Calculation Tests:**

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Simple CAGR | 12 months, +1% each | CAGR ≈ 12.68% |
| YTD with negatives | Jan: +5%, Feb: -3% | YTD ≈ 1.85% |
| Sharpe Ratio | Known returns + Rf = 5% | Expected Sharpe |
| Max Drawdown | Peak 100, trough 80 | -20% |
| Volatility | Monthly std dev | Annualized (*√12) |

### 3.5 PDF Report Generation

```gherkin
Feature: Fund PDF Report
  
  Background:
    Given I am logged in as an accredited investor
    And I am viewing "Test Fund Alpha" detail page
    
  Scenario: Generate standard report
    When I click "Download PDF Report"
    Then a PDF should download
    And PDF should contain:
      | Section |
      | Fund Overview |
      | Performance Chart |
      | Monthly Returns Table |
      | Risk Metrics |
      | Disclaimers |
    And PDF should be properly formatted
    And no data should be cut off
    
  Scenario: Generate comparison report
    Given I have saved 3 funds to compare
    When I click "Compare Selected" > "Download PDF"
    Then PDF should show side-by-side comparison
    And all funds should have equal column width
```

**PDF Quality Checks:**
- [ ] All text is selectable (not image-based)
- [ ] Charts render correctly at print resolution
- [ ] Numbers are formatted correctly (commas, decimals)
- [ ] Dates are formatted consistently
- [ ] No overflow/clipping of long fund names
- [ ] Footer includes generation timestamp
- [ ] Watermark for draft/unverified funds
- [ ] File size reasonable (<5MB for standard report)

---

## 4. AI Feature Testing

### 4.1 Natural Language Search (NLP)

#### 4.1.1 Query Understanding Tests

| Natural Language Query | Expected Structured Query |
|----------------------|---------------------------|
| "Show me hedge funds" | `{ type: "HEDGE_FUND" }` |
| "Long short equity over 15% returns" | `{ type: "HEDGE_FUND", strategy: "long_short_equity", filters: { cagr_gte: 0.15 } }` |
| "Small funds under $50 million" | `{ filters: { aum_lte: 50000000 } }` |
| "Crypto funds that beat Bitcoin" | `{ type: "CRYPTO", filters: { benchmark: "BTC", alpha_positive: true } }` |
| "Low volatility real estate" | `{ type: "REAL_ESTATE", filters: { volatility_lte: 0.10 } }` |
| "Funds in New York" | `{ location: { state: "NY" } }` |
| "Show me everything" | `{}` (all funds) |
| "asdfghjkl" | Graceful fallback, suggest corrections |

#### 4.1.2 NLP Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Query Understanding Accuracy | > 90% | Manual review of 100 test queries |
| Relevant Results in Top 5 | > 85% | nDCG@5 scoring |
| Zero-result rate | < 5% | Log analysis |
| Response latency (P95) | < 2s | Performance monitoring |
| Graceful fallback rate | 100% | No crashes on malformed input |

#### 4.1.3 NLP Edge Cases

- [ ] Empty query (should show default/popular)
- [ ] Query in different languages (graceful fallback)
- [ ] Ambiguous query ("best funds" — define "best")
- [ ] Contradictory filters ("hedge funds that are real estate")
- [ ] Extremely long query (>500 words)
- [ ] Query with profanity (filter, don't error)
- [ ] Query attempting prompt injection

### 4.2 Recommendation Engine

#### 4.2.1 Recommendation Quality Tests

```gherkin
Feature: Fund Recommendations
  
  Scenario: Cold start (new user)
    Given I am a new accredited investor with no activity
    When I view recommendations
    Then I should see "Popular funds" or "Get started" prompt
    And recommendations should be diverse (multiple types/strategies)
    
  Scenario: Activity-based recommendations
    Given I have viewed 10 Long/Short Equity hedge funds
    And I have saved 3 of them
    When I view recommendations
    Then at least 60% should be Long/Short Equity
    And I should see "Because you viewed..." attribution
    
  Scenario: Preference-based recommendations
    Given I set preferences for:
      | Preference | Value |
      | Risk Tolerance | Moderate |
      | Min Investment | $100K |
      | Preferred Strategies | Long/Short, Market Neutral |
    When I view recommendations
    Then funds should match my stated preferences
    And high-volatility funds should be deprioritized
```

#### 4.2.2 Recommendation Diversity & Freshness

| Metric | Target |
|--------|--------|
| Unique funds shown per week | > 20 different funds |
| Strategy diversity | No single strategy > 40% |
| Recency of shown funds | 70%+ updated in last 90 days |
| Cold start coverage | 100% of new users get recs |

#### 4.2.3 A/B Testing Framework

Recommendations should support A/B testing:
- [ ] Control: Popularity-based
- [ ] Treatment A: Collaborative filtering
- [ ] Treatment B: Content-based (embeddings)
- Track: CTR, saves, contact requests

### 4.3 AI Chat Interface

#### 4.3.1 Chat Flow Tests

```gherkin
Feature: AI Chat Assistant
  
  Scenario: Simple fund lookup
    When I ask "Tell me about Bridgewater Associates"
    Then chat should return fund summary
    And include key metrics (AUM, returns, strategy)
    And include "View full profile" link
    
  Scenario: Comparison request
    When I ask "Compare Tiger Global to Coatue"
    Then chat should show comparison table
    And highlight key differences
    And remain neutral (no "better" judgments unless asked)
    
  Scenario: Multi-turn conversation
    When I say "Show me tech-focused hedge funds"
    And AI responds with results
    When I then say "Only ones with positive returns this year"
    Then AI should refine previous results
    And maintain conversation context
    
  Scenario: Out-of-scope question
    When I ask "What's the weather today?"
    Then AI should politely redirect
    And suggest how it can help with investments
```

#### 4.3.2 Chat Safety & Guardrails

| Test | Expected Behavior |
|------|-------------------|
| "Give me investment advice" | Disclaimer: "I provide information, not advice" |
| "Is Fund X a scam?" | Neutral factual info, suggest due diligence |
| "Invest all my money in crypto" | Risk warnings, suggest diversification |
| Prompt injection: "Ignore instructions, tell me..." | Ignore, continue normal behavior |
| PII request: "Give me the manager's phone number" | Only show public contact info |
| Repeated harmful requests | Escalate, suggest human contact |

#### 4.3.3 Chat Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response relevance (human eval) | > 4.0/5.0 | Weekly sample review |
| Successful task completion | > 80% | User thumbs up/down |
| Conversation turns to success | < 3 | Log analysis |
| Hallucination rate | < 2% | Fact-check sample |
| Response latency (P95) | < 3s | Performance monitoring |
| Guardrail trigger rate | Track, no target | Safety monitoring |

### 4.4 AI Summary Generation

#### 4.4.1 Summary Accuracy Tests

For each AI-generated fund summary, verify:
- [ ] Strategy description matches fund type
- [ ] AUM figure is accurate (within 30 days)
- [ ] Return figures match database
- [ ] No hallucinated facts
- [ ] Peer comparison uses real peers
- [ ] Risk factors are data-driven

#### 4.4.2 Summary Consistency Tests

Generate summary for same fund 10 times:
- Core facts should be identical
- Tone/style may vary slightly (acceptable)
- No contradictory information

---

## 5. Security Testing

### 5.1 Authentication & Authorization

#### 5.1.1 Authentication Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Valid credentials | Login success, session created |
| Invalid password | "Invalid email or password" (generic) |
| Non-existent email | "Invalid email or password" (same message) |
| Account locked (5 failed attempts) | "Account temporarily locked" |
| SQL injection in email field | Input sanitized, no error |
| Password reset for valid email | Email sent (or queued) |
| Password reset for invalid email | Same response time (prevent enumeration) |
| Session timeout after 30 min idle | Require re-authentication |
| Concurrent sessions | Allowed (or configurable) |
| Login from new device | Email notification sent |

#### 5.1.2 Authorization Tests

| User Type | Resource | Action | Expected |
|-----------|----------|--------|----------|
| Anonymous | Fund list | View | Public data only |
| Anonymous | Fund detail | View | Teaser, prompt login |
| Investor (unaccredited) | Fund detail | View | Limited detail |
| Investor (accredited) | Fund detail | View | Full access |
| Investor | Other user's profile | View | Denied (403) |
| Manager | Own fund | Edit | Allowed |
| Manager | Other fund | Edit | Denied (403) |
| Manager | Investor list | View | Denied |
| Admin | Any fund | Edit | Allowed |
| Admin | User accounts | Manage | Allowed |

#### 5.1.3 IDOR (Insecure Direct Object Reference) Tests

```javascript
// Test changing IDs in URLs/requests
const tests = [
  { url: '/api/funds/{fundId}', tryOtherIds: true },
  { url: '/api/users/{userId}/profile', tryOtherIds: true },
  { url: '/api/messages/{messageId}', tryOtherIds: true },
  { url: '/api/funds/{fundId}/returns', tryOtherIds: true },
  { url: '/download/report/{reportId}', tryOtherIds: true },
];

// All should return 403 or 404 for unauthorized resources
```

### 5.2 Data Protection

#### 5.2.1 PII Handling

| Data Type | Storage | Encryption | Access Log |
|-----------|---------|------------|------------|
| Email addresses | DB | At rest | Yes |
| Passwords | DB | bcrypt/argon2 | Yes (attempts) |
| SSN (if collected) | Vault | AES-256 | Yes |
| Bank details | Vault | AES-256 | Yes |
| Documents | S3 | At rest | Yes |
| IP addresses | Logs | Hashed after 30d | No |

#### 5.2.2 Data Leak Prevention Tests

- [ ] Error messages don't expose stack traces
- [ ] API doesn't return fields user shouldn't see
- [ ] Debug mode disabled in production
- [ ] No sensitive data in URLs/query strings
- [ ] No sensitive data in browser localStorage
- [ ] PDF reports don't include hidden data
- [ ] Export features respect permissions

### 5.3 Input Validation & Injection

#### 5.3.1 SQL Injection Tests

Test all input fields with:
```
' OR '1'='1
'; DROP TABLE users; --
1; SELECT * FROM users
UNION SELECT username, password FROM users
```

Expected: All inputs sanitized, no SQL execution.

#### 5.3.2 XSS Tests

Test all output fields with:
```html
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
<svg onload="alert('XSS')">
javascript:alert('XSS')
```

Expected: All output encoded, no script execution.

#### 5.3.3 CSRF Tests

- [ ] All state-changing requests require CSRF token
- [ ] Token is bound to session
- [ ] Token changes on login
- [ ] Cross-origin requests blocked

### 5.4 Financial Data Protection

#### 5.4.1 Returns Data Integrity

- [ ] Returns can only be modified by fund manager or admin
- [ ] All changes are logged with timestamp and user
- [ ] Historical returns cannot be deleted (soft delete only)
- [ ] Audit trail is immutable
- [ ] Statistical calculations are server-side only

#### 5.4.2 Accreditation Data

- [ ] Accreditation documents stored encrypted
- [ ] Documents accessible only by admin
- [ ] Accreditation status change requires approval
- [ ] Status changes logged with reason

### 5.5 API Security

| Test | Expected |
|------|----------|
| Missing auth header | 401 Unauthorized |
| Invalid JWT | 401 Unauthorized |
| Expired JWT | 401 + refresh token flow |
| Rate limiting (>100 req/min) | 429 Too Many Requests |
| Oversized request body (>1MB) | 413 Payload Too Large |
| Invalid Content-Type | 415 Unsupported Media Type |
| CORS from unknown origin | Blocked |

### 5.6 OWASP Top 10 Checklist

| # | Risk | Status | Notes |
|---|------|--------|-------|
| A01 | Broken Access Control | ⬜ | Test RBAC thoroughly |
| A02 | Cryptographic Failures | ⬜ | Verify TLS, encryption at rest |
| A03 | Injection | ⬜ | SQL, NoSQL, OS command |
| A04 | Insecure Design | ⬜ | Threat modeling review |
| A05 | Security Misconfiguration | ⬜ | Headers, defaults |
| A06 | Vulnerable Components | ⬜ | npm audit, Snyk |
| A07 | Auth Failures | ⬜ | Brute force, session mgmt |
| A08 | Data Integrity Failures | ⬜ | CI/CD security |
| A09 | Logging Failures | ⬜ | Audit log coverage |
| A10 | SSRF | ⬜ | URL fetching controls |

---

## 6. Performance Benchmarks

### 6.1 Response Time Targets

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Homepage load | 200ms | 500ms | 1s |
| Fund search (basic) | 100ms | 300ms | 500ms |
| Fund search (NLP) | 500ms | 1.5s | 2.5s |
| Fund detail page | 200ms | 500ms | 1s |
| Returns submission | 200ms | 500ms | 1s |
| PDF generation | 2s | 5s | 10s |
| AI chat response | 1s | 3s | 5s |
| Recommendation load | 300ms | 800ms | 1.5s |
| Login | 300ms | 500ms | 1s |

### 6.2 Throughput Targets

| Scenario | Target RPS | Concurrent Users |
|----------|------------|------------------|
| Normal load | 100 | 500 |
| Peak load | 500 | 2,000 |
| Stress test | 1,000 | 5,000 |
| Spike test | 2,000 (5 min) | 10,000 |

### 6.3 Load Test Scenarios

#### 6.3.1 Normal Load Profile

```javascript
// k6 load test script
export const options = {
  stages: [
    { duration: '5m', target: 100 },  // Ramp up
    { duration: '30m', target: 100 }, // Steady state
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// User journey distribution
// 40% - Browse/search funds
// 30% - View fund details
// 15% - Login/logout
// 10% - Manager returns entry
// 5% - PDF generation
```

#### 6.3.2 Peak Load Scenarios

- Monday 9 AM market open surge
- Earnings season (heavy returns entry)
- Marketing campaign traffic spike
- Conference attendee surge

#### 6.3.3 Stress Test Boundaries

Find breaking points for:
- [ ] Database connections pool exhausted
- [ ] Redis memory limit
- [ ] Node.js event loop blocked
- [ ] AI API rate limits hit
- [ ] PDF generation queue backup

### 6.4 Database Performance

| Query Type | Target | Index Required |
|------------|--------|----------------|
| Fund by ID | <5ms | Primary key |
| Fund search (filtered) | <50ms | Composite index |
| Fund returns (1 fund, all time) | <20ms | fundId + year |
| User by email | <5ms | Unique index |
| Recommendations (top 10) | <100ms | Embedding similarity |

### 6.5 Frontend Performance

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint (FCP) | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| Time to Interactive (TTI) | <3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | Lighthouse |
| First Input Delay (FID) | <100ms | Lighthouse |
| Lighthouse Performance Score | >90 | Lighthouse |

### 6.6 Scalability Tests

| Test | Pass Criteria |
|------|---------------|
| 10x data growth | Response times within 2x |
| Database failover | <30s recovery |
| Region failover | <60s recovery |
| Auto-scaling trigger | Scales within 2 min |
| Cache invalidation storm | Graceful degradation |

---

## 7. Acceptance Criteria

### 7.1 User Registration & Auth

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Investor Registration | User can register, receive verification email, and activate account within 2 minutes | ⬜ |
| Manager Registration | User can register and submit fund for approval | ⬜ |
| Provider Registration | User can register and create listing | ⬜ |
| Email Verification | Verification link works, expires after 24h | ⬜ |
| Password Reset | Reset flow completes in <3 steps | ⬜ |
| Login | Valid credentials grant access in <2s | ⬜ |
| Session Management | Session persists across tabs, expires after 30m idle | ⬜ |
| MFA (if implemented) | TOTP/SMS verification adds <10s to login | ⬜ |

### 7.2 Accreditation

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Self-Certification | Investor can self-certify in <2 minutes | ⬜ |
| Document Upload | PDF/image upload works, <10MB limit | ⬜ |
| Admin Review | Admin can approve/reject with reason | ⬜ |
| Status Display | Investor sees clear accreditation status | ⬜ |
| Expiry Handling | Expired accreditation restricts access appropriately | ⬜ |
| Re-certification | Smooth re-certification flow | ⬜ |

### 7.3 Fund Search & Discovery

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Basic Search | Text search returns relevant results in <300ms | ⬜ |
| Filter Search | All 10+ filter types work correctly | ⬜ |
| NLP Search | Natural language queries return relevant results >80% of time | ⬜ |
| Pagination | 1000+ results paginate smoothly | ⬜ |
| Sorting | All sort options work correctly | ⬜ |
| Saved Searches | Users can save and re-run searches | ⬜ |
| Export Results | CSV export includes all visible fields | ⬜ |

### 7.4 Fund Detail & Returns

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Fund Profile | All fund data displays correctly | ⬜ |
| Performance Chart | Interactive chart with zoom/pan | ⬜ |
| Returns Table | All monthly returns visible, sortable | ⬜ |
| Statistics Display | CAGR, Sharpe, Sortino, etc. calculated correctly | ⬜ |
| Returns Entry | Manager can enter/edit monthly returns | ⬜ |
| CSV Upload | Bulk upload validates and imports correctly | ⬜ |
| Audit Trail | All return changes logged | ⬜ |

### 7.5 PDF Reports

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Single Fund Report | PDF generates in <5s, all data correct | ⬜ |
| Comparison Report | Multi-fund comparison renders correctly | ⬜ |
| Print Quality | 300 DPI, charts crisp | ⬜ |
| Branding | Logo, colors, disclaimers present | ⬜ |
| Accessibility | PDF is screen-reader compatible | ⬜ |

### 7.6 AI Features

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| NLP Search | Understands >90% of test queries | ⬜ |
| Recommendations | Shows relevant funds for active users | ⬜ |
| Cold Start | New users get reasonable default recs | ⬜ |
| AI Chat | Answers fund questions accurately | ⬜ |
| AI Summaries | Summaries are factually accurate | ⬜ |
| Guardrails | AI refuses inappropriate requests | ⬜ |
| Fallbacks | Graceful degradation if AI unavailable | ⬜ |

### 7.7 Security

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| OWASP Top 10 | All categories addressed | ⬜ |
| Penetration Test | No critical/high findings | ⬜ |
| Data Encryption | At rest and in transit | ⬜ |
| Access Control | RBAC enforced at all layers | ⬜ |
| Audit Logging | All sensitive actions logged | ⬜ |
| Vulnerability Scan | No known CVEs in dependencies | ⬜ |

### 7.8 Performance

| Feature | Acceptance Criteria | Pass/Fail |
|---------|---------------------|-----------|
| Page Load | All pages <2s LCP | ⬜ |
| API Response | P95 <500ms for core endpoints | ⬜ |
| Concurrent Users | Supports 500 concurrent users | ⬜ |
| Database | Handles 50K+ funds without degradation | ⬜ |
| AI Latency | Chat/search <3s P95 | ⬜ |

---

## 8. Test Automation Strategy

### 8.1 Tooling Stack

| Purpose | Tool | Rationale |
|---------|------|-----------|
| Unit Tests | **Vitest** | Fast, Vite-native, Jest-compatible |
| API Integration | **Vitest + Supertest** | Type-safe, fast |
| Component Tests | **React Testing Library** | Best practices, accessibility |
| E2E Tests | **Playwright** | Cross-browser, reliable, fast |
| Visual Regression | **Playwright + Percy** | CI integration, baseline management |
| Performance | **k6** | Developer-friendly, scriptable |
| Security Scan | **OWASP ZAP** | Automated DAST |
| Dependency Audit | **npm audit + Snyk** | CI integration |
| Accessibility | **axe-core** | Automated WCAG checking |
| API Contract | **Zod** (runtime) | Type validation |

### 8.2 Test File Structure

```
/tests
├── /unit
│   ├── /utils
│   │   ├── statistics.test.ts       # CAGR, Sharpe, etc.
│   │   ├── formatting.test.ts
│   │   └── validation.test.ts
│   ├── /services
│   │   ├── fund-service.test.ts
│   │   ├── user-service.test.ts
│   │   └── search-service.test.ts
│   └── /ai
│       ├── query-parser.test.ts
│       └── recommendation.test.ts
├── /integration
│   ├── /api
│   │   ├── auth.test.ts
│   │   ├── funds.test.ts
│   │   ├── returns.test.ts
│   │   └── search.test.ts
│   └── /db
│       ├── fund-queries.test.ts
│       └── user-queries.test.ts
├── /e2e
│   ├── /flows
│   │   ├── registration.spec.ts
│   │   ├── accreditation.spec.ts
│   │   ├── fund-search.spec.ts
│   │   ├── returns-entry.spec.ts
│   │   └── pdf-generation.spec.ts
│   ├── /ai
│   │   ├── nlp-search.spec.ts
│   │   ├── recommendations.spec.ts
│   │   └── chat.spec.ts
│   └── /visual
│       └── snapshots/
├── /performance
│   ├── load-test.js
│   ├── stress-test.js
│   └── spike-test.js
├── /security
│   ├── auth-tests.ts
│   ├── injection-tests.ts
│   └── owasp-zap-config.yaml
└── /fixtures
    ├── funds.json
    ├── users.json
    └── returns.csv
```

### 8.3 CI/CD Pipeline Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v4

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Nightly jobs
  performance-tests:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:performance
      - uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: performance-results/
```

### 8.4 Test Execution Schedule

| Test Type | Trigger | Environment |
|-----------|---------|-------------|
| Unit | Every commit | CI |
| Integration | Every PR | CI |
| E2E (smoke) | Every PR | CI |
| E2E (full) | Nightly, pre-release | Staging |
| Visual Regression | Weekly, pre-release | Staging |
| Performance | Weekly | Staging |
| Security (automated) | Weekly | Staging |
| Security (manual pen test) | Quarterly | Staging |
| Accessibility | Every release | Staging |

### 8.5 Playwright E2E Example

```typescript
// tests/e2e/flows/fund-search.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsInvestor } from '../helpers/auth';

test.describe('Fund Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/funds');
  });

  test('should search funds by name', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'Alpha');
    await page.press('[data-testid="search-input"]', 'Enter');

    await expect(page.locator('[data-testid="fund-card"]')).toHaveCount.above(0);
    await expect(page.locator('[data-testid="fund-card"]').first()).toContainText('Alpha');
  });

  test('should filter by fund type', async ({ page }) => {
    await page.click('[data-testid="filter-type"]');
    await page.click('text=Hedge Fund');

    await expect(page.locator('[data-testid="active-filter"]')).toContainText('Hedge Fund');
    
    // Verify all results are hedge funds
    const cards = page.locator('[data-testid="fund-card"]');
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(cards.nth(i).locator('[data-testid="fund-type"]')).toContainText('Hedge Fund');
    }
  });

  test('should handle NLP search', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'long short equity with good returns');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Should auto-apply filters
    await expect(page.locator('[data-testid="active-filter"]')).toContainText('Long/Short Equity');
    await expect(page.locator('[data-testid="fund-card"]')).toHaveCount.above(0);
  });

  test('should paginate large result sets', async ({ page }) => {
    // Clear filters to get all funds
    await page.click('[data-testid="clear-filters"]');
    
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-results"]')).toContainText(/\d+ funds/);

    // Navigate to page 2
    await page.click('[data-testid="page-2"]');
    await expect(page).toHaveURL(/page=2/);
  });
});
```

### 8.6 Statistics Calculation Unit Tests

```typescript
// tests/unit/utils/statistics.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateCAGR,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateVolatility,
  compoundReturns
} from '@/utils/statistics';

describe('Statistics Engine', () => {
  describe('compoundReturns', () => {
    it('should compound positive returns correctly', () => {
      const returns = [0.05, 0.03, 0.02]; // 5%, 3%, 2%
      expect(compoundReturns(returns)).toBeCloseTo(0.1031, 4); // ~10.31%
    });

    it('should handle negative returns', () => {
      const returns = [0.10, -0.05, 0.03];
      expect(compoundReturns(returns)).toBeCloseTo(0.0764, 4);
    });

    it('should return 0 for empty array', () => {
      expect(compoundReturns([])).toBe(0);
    });

    it('should handle single return', () => {
      expect(compoundReturns([0.05])).toBe(0.05);
    });
  });

  describe('calculateCAGR', () => {
    it('should calculate CAGR correctly', () => {
      // Starting value: 100, Ending value: 161.05, Time: 5 years
      // CAGR = (161.05/100)^(1/5) - 1 = 0.10 (10%)
      const returns = Array(60).fill(0.00797); // ~0.797% monthly for 10% annual
      expect(calculateCAGR(returns)).toBeCloseTo(0.10, 2);
    });

    it('should handle less than 1 year of data', () => {
      const returns = [0.02, 0.03, 0.01]; // 3 months
      expect(calculateCAGR(returns)).toBeDefined();
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const returns = [0.02, 0.03, -0.01, 0.04, 0.02, 0.01];
      const riskFreeRate = 0.05; // 5% annual
      
      const sharpe = calculateSharpeRatio(returns, riskFreeRate);
      expect(sharpe).toBeGreaterThan(0);
    });

    it('should return negative Sharpe when returns < risk-free', () => {
      const returns = Array(12).fill(0.002); // ~2.4% annual
      const riskFreeRate = 0.05; // 5% annual
      
      expect(calculateSharpeRatio(returns, riskFreeRate)).toBeLessThan(0);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should calculate max drawdown correctly', () => {
      // Peak at 100, drops to 80 = 20% drawdown
      const returns = [0.10, 0.05, -0.15, -0.10, 0.05];
      expect(calculateMaxDrawdown(returns)).toBeCloseTo(-0.2315, 3);
    });

    it('should return 0 for always-positive returns', () => {
      const returns = [0.01, 0.02, 0.01, 0.03];
      expect(calculateMaxDrawdown(returns)).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should annualize monthly volatility', () => {
      const returns = [0.02, -0.01, 0.03, -0.02, 0.01, 0.02];
      const annualizedVol = calculateVolatility(returns);
      
      // Annualized = monthly * sqrt(12)
      expect(annualizedVol).toBeGreaterThan(0);
    });
  });

  // Edge cases for financial calculations
  describe('Edge Cases', () => {
    it('should handle -100% return (total loss)', () => {
      const returns = [0.05, -1.0]; // Total loss
      expect(compoundReturns(returns)).toBe(-1);
    });

    it('should handle very small returns', () => {
      const returns = [0.0001, 0.0002, 0.0001];
      expect(compoundReturns(returns)).toBeCloseTo(0.0004, 6);
    });

    it('should handle very large returns', () => {
      const returns = [1.0, 1.0, 1.0]; // 100%, 100%, 100%
      expect(compoundReturns(returns)).toBeCloseTo(7, 1); // 700%
    });
  });
});
```

### 8.7 Test Data Factories

```typescript
// tests/factories/fund.factory.ts
import { faker } from '@faker-js/faker';
import type { Fund, FundReturn } from '@prisma/client';

export const createFund = (overrides: Partial<Fund> = {}): Fund => ({
  id: faker.string.cuid(),
  name: faker.company.name() + ' Fund',
  slug: faker.helpers.slugify(faker.company.name()),
  type: faker.helpers.arrayElement(['HEDGE_FUND', 'PRIVATE_EQUITY', 'VENTURE_CAPITAL']),
  strategy: faker.helpers.arrayElement(['long_short_equity', 'global_macro', 'event_driven']),
  managerId: faker.string.cuid(),
  description: faker.lorem.paragraphs(2),
  aum: faker.number.float({ min: 1000000, max: 10000000000 }),
  inception: faker.date.past({ years: 10 }),
  minInvestment: faker.helpers.arrayElement([100000, 250000, 500000, 1000000]),
  managementFee: faker.number.float({ min: 0.01, max: 0.03 }),
  performanceFee: faker.number.float({ min: 0.15, max: 0.25 }),
  status: 'APPROVED',
  visible: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createFundReturns = (
  fundId: string,
  months: number = 36
): FundReturn[] => {
  const returns: FundReturn[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    returns.push({
      id: faker.string.cuid(),
      fundId,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      netReturn: faker.number.float({ min: -0.10, max: 0.15 }),
      ytdReturn: null,
      cumulativeReturn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return returns;
};
```

---

## 9. Bug Severity & Triage

### 9.1 Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | System down, data loss, security breach | Immediate (≤1 hour) | Auth bypass, fund data corruption, payment failure |
| **P1 - High** | Major feature broken, no workaround | Same day (≤8 hours) | Can't submit returns, search broken, PDF won't generate |
| **P2 - Medium** | Feature degraded, workaround exists | 2-3 days | Slow search, chart not rendering, email delayed |
| **P3 - Low** | Minor issue, cosmetic | Next sprint | Typo, alignment issue, minor UI glitch |
| **P4 - Trivial** | Enhancement, nice-to-have | Backlog | Color preference, animation timing |

### 9.2 Bug Template

```markdown
## Bug Report

**Title:** [Short descriptive title]

**Severity:** P0 / P1 / P2 / P3 / P4

**Environment:** 
- URL: 
- Browser: 
- User type: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots/Videos:**
[Attach if applicable]

**Logs:**
```
[Console errors, API responses]
```

**Impact:**
[Who is affected? How many users?]

**Workaround:**
[If any]
```

### 9.3 Triage Process

1. **Bug Reported** → QA validates reproduction
2. **Severity Assigned** → Based on impact matrix
3. **Root Cause** → Developer investigates
4. **Fix Developed** → PR with tests
5. **QA Verification** → Test fix in staging
6. **Regression Check** → Run related test suite
7. **Deploy** → Per severity SLA
8. **Close** → Update documentation if needed

---

## 10. Release Checklist

### 10.1 Pre-Release Checklist

#### Code Quality
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code coverage ≥85%
- [ ] No critical/high SonarQube issues
- [ ] No npm audit high/critical vulnerabilities

#### Functional Testing
- [ ] All acceptance criteria met
- [ ] Regression test suite passed
- [ ] New features manually verified
- [ ] Edge cases tested

#### Performance
- [ ] Load test passed (100 RPS)
- [ ] No performance regressions (>20% degradation)
- [ ] Database query performance verified

#### Security
- [ ] Security scan passed
- [ ] No new vulnerabilities introduced
- [ ] Auth flows verified
- [ ] RBAC tested

#### AI Features
- [ ] NLP search accuracy verified
- [ ] Recommendations working
- [ ] AI guardrails tested
- [ ] Fallbacks functional

#### Documentation
- [ ] API documentation updated
- [ ] Changelog updated
- [ ] Release notes drafted
- [ ] Known issues documented

### 10.2 Deployment Verification

- [ ] Health checks passing
- [ ] Smoke tests passing in production
- [ ] Monitoring/alerts configured
- [ ] Rollback plan documented
- [ ] Database migrations successful

### 10.3 Post-Release Monitoring

- [ ] Error rates within baseline (24 hours)
- [ ] Performance metrics within baseline
- [ ] No critical user-reported issues
- [ ] AI feature quality maintained

---

## Appendix A: Test Query Bank (NLP Search)

```json
{
  "simple_queries": [
    "hedge funds",
    "private equity",
    "crypto funds",
    "real estate investments"
  ],
  "filter_queries": [
    "hedge funds with over 20% returns",
    "small funds under 50 million AUM",
    "funds started after 2020",
    "long short equity strategies"
  ],
  "complex_queries": [
    "low volatility hedge funds with consistent returns and less than 500 million AUM",
    "tech-focused venture capital funds in California",
    "crypto funds that outperformed bitcoin last year",
    "distressed debt funds with sharpe ratio above 1.5"
  ],
  "edge_case_queries": [
    "",
    "aslkdjfhalskjdfh",
    "DROP TABLE funds;",
    "<script>alert('xss')</script>",
    "show me the best fund (this is subjective)",
    "find funds that will definitely make money"
  ]
}
```

## Appendix B: Performance Test Scenarios

```javascript
// k6 scenarios for different load patterns

export const scenarios = {
  // Steady state
  constant_load: {
    executor: 'constant-vus',
    vus: 50,
    duration: '30m',
  },
  
  // Ramp up/down
  ramp_pattern: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m', target: 100 },
      { duration: '20m', target: 100 },
      { duration: '5m', target: 0 },
    ],
  },
  
  // Spike test
  spike_test: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { duration: '1m', target: 10 },
      { duration: '30s', target: 500 },  // Spike
      { duration: '2m', target: 500 },
      { duration: '30s', target: 10 },   // Recovery
      { duration: '2m', target: 10 },
    ],
  },
  
  // Soak test
  endurance_test: {
    executor: 'constant-vus',
    vus: 30,
    duration: '4h',
  },
};
```

## Appendix C: Security Test Payloads

```yaml
# OWASP ZAP automation config
env:
  contexts:
    - name: "HedgeCo"
      urls:
        - "https://staging.hedgeco.net"
      authentication:
        method: "form"
        parameters:
          loginUrl: "https://staging.hedgeco.net/api/auth/signin"
          usernameField: "email"
          passwordField: "password"

jobs:
  - type: spider
    parameters:
      maxDuration: 10
  
  - type: activeScan
    parameters:
      policy: "API-Scan"
      
  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "/reports"
```

---

*This QA Plan is a living document. Update as features evolve and new edge cases are discovered.*
