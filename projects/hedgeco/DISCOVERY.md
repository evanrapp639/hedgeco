# HedgeCo.Net Discovery Document

## Current Technical Stack

### Backend
- **Language:** PHP 7.2.34 (legacy, EOL)
- **Server:** Cloudflare (CDN/proxy)
- **Sessions:** PHPSESSID cookies
- **News CMS:** WordPress

### Frontend
- Bootstrap 5.3.0
- jQuery + jQuery UI
- Font Awesome 6.4
- Inter font family
- Custom CSS (multiple files, version tagged)

### Known Issues
- [ ] Conference page leaking raw PHP array data to frontend
- [ ] Double slashes in some URLs (//sign-in.php)
- [ ] PHP 7.2 is EOL — security risk

---

## Site Architecture

### Public Pages (No Auth Required)
| Page | URL | Notes |
|------|-----|-------|
| Homepage | / | Landing with stats, asset classes, news |
| Login | /sign-in.php | Email/password auth |
| Registration | /signInRegistration.php | 4 user types |
| About | /about/ | Company history, mission |
| Contact | /contact-us.php | |
| Privacy | /privacypolicy.php | |
| Terms | /termsofuse.php | |
| Service Providers | /service-providers/ | 78+ categories, 1317+ providers |
| Conferences | /conferences/conferences.php | Event listings |
| News | /news/ | WordPress blog |
| Education | /hedgeducation/ | Educational articles |

### Service Provider Categories (Sample)
- Accounting firms
- Administrators
- Attorneys/Lawyers
- Banks
- Brokers/Dealers
- CFOs
- Clearing services
- Asset valuation
- Tax calculations
- Communications/E-business
- (78+ total categories)

### Education Articles
- Hedge Funds 101
- Accredited Investor Eligibility
- Due Diligence Checklist
- Endowment Model
- History of Alternative Investments
- Liquidity & J-Curve
- Private Equity Basics
- SPV Structure
- Types of Alternatives
- Venture Capital Origins

### News Categories
- Activist Funds
- Alternative Investment Regulation
- Alternative Investments
- Artificial Intelligence
- Asian Hedge Funds
- Bitcoin/Crypto
- Bonds
- Hedge Fund Performance
- Private Capital
- Private Credit
- Technology

---

## User Types & Registration

### 1. Fund Manager
- List unlimited funds
- Access to investor users
- Performance tracking tools
- Investor communication platform
- Monthly reporting capabilities

### 2. Investor (Accredited)
- Access to fund database
- Advanced search/filtering
- Fund performance analytics
- Direct manager contact
- Personalized recommendations

### 3. Service Provider
- Professional directory listing
- Lead generation tools
- Client testimonials
- Marketing analytics
- Industry networking

### 4. News Member
- Daily news updates
- Market analysis reports
- Industry newsletters
- Exclusive interviews
- Research publications

---

## Database Content (Current Stats)

### Funds by Type
| Type | Count |
|------|-------|
| Hedge Funds | ~1,989+ |
| Private Equity | ~112+ |
| Venture Capital | 0+ |
| Real Estate | ~51+ |
| Crypto/Digital | 0+ |
| SPVs | ~275+ |

### Platform Stats (Homepage Claims)
- 513K+ Alternative Investment Funds (lifetime?)
- 172+ Investment Professionals
- 695M+ Assets Under Management
- 82+ Countries Worldwide

---

## Authenticated Areas (EXPLORED 2026-02-12)

### Investor Dashboard ✅ DOCUMENTED
**Login:** hedgecoinvestor@hedgeco.net / HedgeCo123

**Dashboard Features:**
- Welcome message with user type (Investor)
- Stats cards: Watchlist count, Portfolio Value, Avg Performance, Asset Allocation
- My Watch list — shows saved funds with:
  - Fund name, Strategy
  - AUM, YTD return, Last Update date
  - Contact link
- My Preferred Fund Strategies — quick links to filtered searches
- User menu: Dashboard, My Messages, My Watch list, Edit My Profile, Newsletter Settings, Logout

**Fund Search:**
- Filter by: Fund Type (Hedge/PE/VC/Crypto), Strategy (30+), AUM range, Geographic Focus, Min Investment, Track Record length, YTD Performance
- Results show: Fund type badge, Name, Description, AUM, YTD Return, Track Record years
- Actions: View Details, Contact

**Fund Detail Page:**
- Overview & Description
- Key metrics: YTD, Monthly return, VAMI, AUM, Min Investment, Fees, Sharpe Ratio, Std Dev, CAGR, Max Drawdown
- Monthly returns table (historical data going back years)
- Tabs: Overview, Disclaimer, Performance, Risk Management, Management Team, Similar Funds
- Actions: Add to Watch list, Contact Manager, Generate PDF

### Manager Dashboard ✅ DOCUMENTED
**Login:** hedgecomanager@hedgeco.net / HedgeCo123

**Dashboard Features:**
- Welcome message with user type (Manager)
- Stats cards: Total Funds, Active Investors, Avg Performance, Total AUM
- Fund Management section:
  - Add a New Fund / List Your SPV buttons
  - My Funds (count) / My SPVs (count) tabs
  - Fund cards showing: Name, Status, AUM, YTD, Investors, Sharpe
- Quick Actions: Dashboard, Manage My Funds, My Messages, My Watch list, Edit Profile, Logout
- Recently Updated Funds in Watch list
- Recent Activity feed (investor interest, performance updates)

**Fund Management Page (per fund):**
- Tabs:
  - Fund Home Page — overview
  - Fund General Details — editable fund info
  - Overview & Disclaimer — editable text
  - **Fund Historical Returns** — MONTHLY RETURNS ENTRY
  - Fund Service Providers — prime broker, admin, auditor, etc.
  - Fund Holdings & Sectors
  - Fund Management Team — add/edit team members
  - Fund Legal Documents — upload PPM, DDQ, etc.

**Returns Entry Page:**
- Year selector (all years since inception)
- CSV bulk upload option
- Monthly table with columns:
  - Month
  - Fund Return (%) — NET OF FEES
  - Fund Assets (mil)
  - Firm Assets (mil)
  - NAV
  - Status (Estimate / Confirmed / Audited / Managed Account)
- Save Changes button

### Admin Panel ✅ DOCUMENTED
**URL:** https://www.hedgeco.net/myadmin
**Login:** admin / HegeCoAccess

**Navigation:**
1. **Members Menu:**
   - Managers: Search/List — view all managers
   - Add Manager — create new manager account
   - Funds: Search/List — all funds with filters
   - Funds: Pending — awaiting approval
   - Funds: Approved — live funds
   - Investors: Search/List — all investors
   - Add Investor — create new investor
   - Conference: Search/List — event management
   - Add Conference
   - News Members: Search/List
   - Add News Members
   - Service Providers — directory management
   - Modify Access Info — change email/password/status

2. **Contact Members Menu:**
   - Contact Inactive Managers (by months inactive)
   - Contact Inactive Investors
   - Contact Inactive Service Providers
   - Confirm Email (Service Providers)
   - You've Got Mail — unread message alerts

**Fund Management (Admin):**
- Filter by status: All, Waiting/Pending, Approved/Active, Declined/Deleted
- Sort by: Fund ID, Date Added, Date Updated, Fund Name
- Search/filter text box
- Download Fund CSV export
- Bulk actions: Send Email, Delete (checkbox selection)
- Per-fund: View Fund details, View Docs

---

## Features to Rebuild

### Core
1. User authentication & authorization
2. Investor accreditation workflow
3. Fund database CRUD
4. Service provider directory
5. Conference listings
6. News/blog integration
7. Search (basic → AI-powered)
8. Contact/messaging system

### Statistics Engine
1. Monthly returns input
2. Performance calculations (CAGR, Sharpe, Sortino, etc.)
3. Risk metrics
4. Benchmarking
5. PDF report generation

### Communication
1. Internal messaging
2. Email notifications
3. Manager-Investor communication
4. Inquiry handling

---

## AI Features to Add

### Search & Discovery
- Natural language fund search ("find me long/short equity funds with >15% CAGR")
- Semantic search across all data
- Voice search

### Recommendations
- Personalized fund suggestions based on:
  - Investment history
  - Stated preferences
  - Risk tolerance
  - Similar investor behavior
- "Funds you might like"
- Alert on new funds matching criteria

### Communication
- AI-assisted inquiry responses
- Smart matching (investor ↔ manager)
- Chatbot for navigation/FAQ
- AI drafting for manager communications

### Analytics
- AI-generated fund summaries
- Risk analysis explanations
- Market context for performance
- Peer comparison narratives

### Due Diligence
- AI-powered DDQ generation
- Document analysis
- Red flag detection
- Compliance checking

---

## Next Steps

1. **Manual Exploration** — Login with provided credentials and document:
   - Investor dashboard screens
   - Manager dashboard screens
   - Admin panel functionality
   - Full search/filter options
   - PDF report samples

2. **Database Schema** — Get MySQL/database exports to understand data model

3. **Tech Stack Decision** — Propose modern architecture

4. **Project Planning** — Break into phases with milestones
