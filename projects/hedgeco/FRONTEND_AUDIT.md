# HedgeCo.Net Frontend Audit (Staging)

**Date:** 2026-02-17  
**Audited By:** Daphne 🧡 (Frontend Specialist)  
**Source:** https://staging.hedgeco.net  
**Purpose:** Document existing site for exact recreation

---

## 📌 Executive Summary

HedgeCo.Net is an alternative investments database platform serving hedge fund managers, investors, and service providers. The site uses **Tailwind CSS** with **jQuery** for JavaScript interactions. It's a modern, responsive design with a teal/dark slate color scheme.

**⚠️ CRITICAL: Two-Tier Access Control System**
- Fund data is RESTRICTED - only registered AND approved users see fund/SPV details
- Non-registered users can see teaser data (limited fields hidden)
- Registration requires dual approval: Email verification + Accredited Investor status

---

## 🔐 Access Control System

### User Access Levels

| Level | Fund Database | SPV List | SPV Details | Valuation Data | Documents |
|-------|---------------|----------|-------------|----------------|-----------|
| **Anonymous** | ❌ Redirect to login | ✅ Teaser data | ✅ Partial | ❌ "Hidden" | ❌ "Login Required" |
| **Registered (Pending)** | ❌ | ✅ | ✅ Partial | ❌ | ❌ |
| **Approved** | ✅ Full access | ✅ Full | ✅ Full | ✅ | ✅ |

### SPV Teaser Data (Visible to All)
- SPV/Company name ✅
- Status badges (Open, Approved, Closing Soon) ✅
- Description/Investment thesis ✅
- Type badge (SPV) ✅
- Raised amount & percentage ✅
- Minimum Investment amount ✅
- Target Raise ✅
- Pre-Money Valuation ✅ (in detail view)
- Management Fee ✅
- Carried Interest ✅
- Deal Lead name/role ✅

### SPV Restricted Data (Login Required)
- **Valuation** - Shows "Hidden" with "Login to View" link
- **Documents** - Shows "Login Required" modal with login CTA
- Full contact/messaging capabilities

### Fund Database Access
- **Completely protected** - redirects to login page
- No teaser data shown for funds
- URL: `/funds/search.php` → redirects to `/sign-in.php`

### Approval Requirements
1. **Email verification** - Standard account activation
2. **Accredited Investor status** - Admin verifies eligibility
3. **Both approvals required** before seeing any fund or SPV details

Terms include: *"By using restricted areas, you represent that you are an 'accredited investor,' 'qualified purchaser,' or 'qualified client,' as applicable."*

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex Code | Usage |
|------|----------|-------|
| **Primary Teal** | `#0d9488` (teal-600) | Primary buttons, CTAs, links |
| **Dark Teal** | `#0f766e` (teal-700) | Button hover states |
| **Header Dark** | `#1e293b` (slate-800) | Header/Nav background |
| **Footer Dark** | `#1e293b` (slate-800) | Footer background |

### Secondary Colors
| Name | Hex Code | Usage |
|------|----------|-------|
| **White** | `#ffffff` | Card backgrounds, text on dark |
| **Light Gray** | `#f8fafc` (slate-50) | Page backgrounds |
| **Gray** | `#94a3b8` (slate-400) | Secondary text |
| **Dark Text** | `#1e293b` (slate-800) | Primary text |

### Status Badge Colors
| Status | Color |
|--------|-------|
| Open | Teal/Green |
| Approved | Green |
| Closing Soon | Orange/Yellow |
| Closed | Gray |
| Coming Soon | Blue |

---

## 🧭 Navigation Structure

### Header Navigation (Staging)
| Label | URL | Notes |
|-------|-----|-------|
| Home | `/` | Logo also links here |
| Database | `/funds/search.php` | **Requires login** - redirects |
| **SPVs** | `/spv/search.php` | **NEW** - Shows teaser data |
| Conferences | `/conferences/conferences.php` | Public |
| News | `/news` | Public |
| Find Experts | `/service-providers/` | Public |
| About | `/about/index.php` | Public |

### Header CTAs (Right Side)
| Label | URL | Style |
|-------|-----|-------|
| Start Free Access | `/signInRegistration.php` | Teal filled button |
| Login | `/sign-in.php` | Teal outlined button |

### Footer Navigation
(Same as production - see below)

**Platform**
- Fund Database → `/funds/search.php`
- Advanced Search → `/funds/search.php`

**Resources**
- Conferences → `/conferences/`
- Industry News → `/news/`
- Education Center → `/hedgeducation/`

**Services**
- Service Providers → `/service-providers/`
- Marketing Solutions → `/contact-us.php`
- Data Licensing → `/contact-us.php`

**Company**
- About Us → `/about/`
- Contact → `/contact-us.php`
- Terms and Conditions → `/termsofuse.php`
- HedgeCo Privacy → `/privacypolicy.php`

---

## 📄 SPV Section Structure

### SPV Search Page (`/spv/search.php`)

**Hero Section:**
- Badge: "ss New Offerings Available" (green dot indicator)
- H1: "Access Exclusive Private Market Deals"
- Subtitle: "Invest in top-tier pre-IPO companies..."
- CTAs: "View Opportunities" | "List Your SPV" (login required)

**Filters:**
- Asset Type dropdown: All Assets, SPVs, Funds
- Status dropdown: All Status, Open, Closing Soon, Closed, Coming Soon

**SPV Card Structure:**
```
┌─────────────────────────────────────┐
│ [Logo/Icon]  SPV Name    [Status]   │
│                                     │
│ Description text...                 │
│                                     │
│ [SPV badge]                         │
├─────────────────────────────────────┤
│ Raised: 0% of $X.XM                 │
├─────────────────────────────────────┤
│ MIN INVESTMENT     VALUATION        │
│ $XX,XXX            [Hidden]         │
├─────────────────────────────────────┤
│ [HedgeCo Exclusive]   [Invest Now]  │
└─────────────────────────────────────┘
```

### SPV Detail Page (`/spv/overview/{id}`)

**Breadcrumb:**
Home › Hedge SPV Database › {SPV Name}

**Hero Section:**
- Logo/Icon with initial letter
- Tags: SPV, marketplace, etc.
- H1: SPV Name
- Description
- Stats card:
  - Min Investment: $XX.XX
  - Valuation: "Hidden" + "Login to View" link
  - "Invest Now" button
  - Helper text: "Contact the deal lead to express interest."

**Investment Highlights:**
- H3: "Investment Highlights"
- Full description/thesis text

**Deal Structure & Terms:**
- Grid of metrics with icons:
  - Target Raise
  - Pre-Money Valuation
  - Min Investment
  - Management Fee (%)
  - Carried Interest (%)

**Documents Section:**
- H3: "Documents"
- Lock icon
- H4: "Login Required"
- Text: "Please log in to view and download documents for this SPV."
- "Log In" button → `/account/`

**Deal Lead Section:**
- H3: "Deal Lead"
- Avatar with initials
- Name: "Deal Manager"
- Role: "External Lister"
- "Send Message" button

---

## 📝 Registration Flow

### Step 1: Choose Registration Type
Path: `/signInRegistration.php`

4 registration type cards:
1. **Fund Manager** 💼
2. **Investor** 📊
3. **Service Provider** 🏢
4. **News Member** 📰

### Step 2: Investor Registration Form
Path: `/registration/investors/register.php`

**Your Contact Information:**
- First Name* | Last Name*
- Company* | Position or Job Title*
- Address (No P.O. Boxes)* | Line 2
- Town/City* | State/Province*
- Zip/Postal Code* | Country* (dropdown)

**Phone Number:**
- Telephone Country Code* (dropdown)
- Telephone Number* (placeholder: "561-295-3709")

**Account Login Information:**
- Email Address (username)* (placeholder: "firstname@mycompany.com")
- Password*

**Newsletter Signup:**
- Subscribe To Our Daily Newsletter: ○ Yes (default) ○ No
- Subscribe To Our Weekly Newsletter: ○ Yes (default) ○ No

**Terms & Conditions:**
- Full legal terms in scrollable box
- Key provision: *"By using restricted areas, you represent that you are an 'accredited investor,' 'qualified purchaser,' or 'qualified client'"*
- Checkbox: "I agree to the above terms of use.*"

**Submit:** "Continue With My Registration" button

### Post-Registration Flow
1. User submits registration
2. Email verification sent
3. Admin reviews accredited investor status
4. **Both approvals required** before full access granted
5. Until approved: user can log in but sees restricted/teaser data only

---

## 🔑 Login Page (`/sign-in.php`)

- Centered card on gradient background
- H2: "Login to Your Account" (teal text)
- Form:
  - Email Address (placeholder: "your@example.com")
  - Password (placeholder: "********")
  - Login button (teal filled, full width)
  - "Forgot Password?" link → `/account/password.php?request=reset`
  - Divider: "OR"
  - "Not a member? Create Account" → `/signInRegistration.php`

**🔐 NO Google OAuth or social login options.**

---

## 📚 Hedgeducation Section (`/hedgeducation/`)

**Hero:**
- Badge: "📚 Learning Hub"
- H1: "HEDGEDUCATION"
- Subtitle: "Your gateway to the world of hedge funds..."

**New Topics Section:**
10 educational articles with emoji icons

**Alternative Investing 101:**
4 category cards:
- Industry Overview 📊
- New to Hedge Funds 🚀
- Hedge Fund FAQ ❓
- Hedge Fund Glossary 📖

**Terms In Focus:**
Glossary highlights: Alpha, Beta, Fund of Funds, General Partner

---

## 🗓️ Conferences Page (`/conferences/`)

**Hero:**
- H1: "Alternative Investment Conferences"

**Filters:**
- Location dropdown (all countries)
- Date Range: All Dates, Current Month, Next Month, Next Quarter, Next Year
- Search textbox
- Apply Filters button

**Conference Cards:**
- Image/Logo
- Date range with 📅 icon
- Title (H3)
- Venue with 🏢 icon
- Type badge (📍 physical/virtual)
- "✨ Register Now" | "📋 View Details" buttons

---

## 📰 News Page (`/news/`)

**HedgeCo Insights Section:**
- H2 with "View All News" link
- Article cards with:
  - Category link
  - Title (H3)
  - Excerpt
  - Date | Read time

**Category Grid:**
60+ news categories with post counts

---

## 👥 Service Providers (`/service-providers/`)

**Hero:**
- H1: "Service Providers Directory"
- Stats: "1316+ Service Providers" | "78+ Service Categories"

**Search:**
- Keyword search
- Category dropdown (78 categories)
- Country dropdown
- Search button

**Category Grid:**
78 service provider categories with counts

---

## 📞 Contact Page (`/contact-us.php`)

**Contact Form:**
- Full Name*, Email*, Phone, Subject* (dropdown), Message*
- "Send Message" button

**Contact Info:**
- 📧 support@hedgeco.net
- 📞 +1 (561) 295 3709
- 🌐 Twitter link

**Contact by Department:**
6 department cards (all → support@hedgeco.net)

**Office:**
- South Florida HedgeCo, LLC
- Palm Beach Gardens, FL 33418

**FAQ Accordion:**
5 common questions

---

## 🔤 Typography

### Fonts
- **Primary:** System font stack (Tailwind default)
- `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Font Sizes (Tailwind)
| Element | Class |
|---------|-------|
| H1 Hero | `text-4xl` / `text-5xl` |
| H2 Section | `text-3xl` |
| H3 Cards | `text-xl` / `text-2xl` |
| Body | `text-base` (16px) |
| Small | `text-sm` (14px) |

---

## 🔘 Button Styles

### Primary (Filled)
- Background: `#0d9488` (teal-600)
- Text: white
- Hover: `#0f766e` (teal-700)
- Padding: `px-6 py-3`
- Border radius: `rounded-lg` (8px)

### Secondary (Outlined)
- Border: 1px solid teal
- Text: teal
- Hover: fill teal, text white

### Status Badges
- Rounded pills with status-specific colors
- Small text (`text-xs`)

---

## 📁 URL Structure

```
/                               Homepage
/sign-in.php                    Login
/signInRegistration.php         Registration type selection
/registration/investors/        Investor registration form

# SPV Section (NEW in staging)
/spv/search.php                 SPV search/listing (teaser data)
/spv/overview/{id}              SPV detail page

# Fund Section (PROTECTED)
/funds/search.php               Fund database (requires login)

# Public Pages
/news/                          News index
/news/category/{slug}           News by category
/conferences/                   Conferences list
/hedgeducation/                 Education center
/service-providers/             Service providers
/about/                         About page
/contact-us.php                 Contact form
/termsofuse.php                 Terms
/privacypolicy.php              Privacy policy
```

---

## 🛠️ Technical Stack

- **CSS:** Tailwind CSS (CDN)
- **JavaScript:** jQuery 3.x + Migrate 3.3.1
- **Backend:** PHP (traditional pages)
- **No frontend framework** (React/Vue) detected

---

## ⚠️ Key Implementation Notes

1. **Dual Approval System**
   - Email verification required
   - Accredited investor status verification by admin
   - Both must pass before full data access

2. **SPV vs Fund Access Patterns**
   - SPVs show teaser data to anonymous users
   - Funds completely block anonymous users (redirect)

3. **Hidden Field Pattern**
   - Valuation field shows "Hidden" text
   - "Login to View" link appears
   - Documents section shows lock icon + modal

4. **No Social Auth**
   - Email/password only
   - No Google OAuth or similar

5. **Domain Difference**
   - Staging: staging.hedgeco.net
   - Production: hedgeco.net / www.hedgeco.net

---

*Audit complete. This document contains all information needed for exact frontend recreation including the critical access control patterns.*
