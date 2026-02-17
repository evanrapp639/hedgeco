# HedgeCo.Net Frontend Audit

**Date:** 2026-02-17  
**Audited By:** Daphne 🧡 (Frontend Specialist)  
**Purpose:** Document existing site for exact recreation

---

## 📌 Executive Summary

HedgeCo.Net is an alternative investments database platform serving hedge fund managers, investors, and service providers. The site uses **Tailwind CSS** with **jQuery** for JavaScript interactions. It's a modern, responsive design with a teal/dark slate color scheme.

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
| **Light Gray** | `#f8fafc` (slate-50) | Page backgrounds, alternating sections |
| **Gray** | `#94a3b8` (slate-400) | Secondary text, muted elements |
| **Dark Text** | `#1e293b` (slate-800) | Primary text color |

### Accent Colors
| Name | Hex Code | Usage |
|------|----------|-------|
| **Success Green** | `#10b981` (emerald-500) | Success states, checkmarks |
| **Link Blue** | `#0ea5e9` (sky-500) | Text links (some instances) |
| **Category Teal** | `#14b8a6` (teal-500) | Footer section headings |

---

## 🖼️ Logo & Branding

### Logo Locations
1. **Header** - Top left corner of navigation (links to homepage)
   - URL: `/` (homepage link)
   - Alt text: "HedgeCo.Net"
   - Appears to be a hedgehog icon with "HEDGECO.NET" text
   
2. **Footer** - Not present (text only copyright)

### Logo Image
- **Format:** PNG (likely)
- **Path:** `/assets/images/logo/` (assumed standard path)
- **Variants:** Single version used throughout

### Brand Elements
- Company Name: **HedgeCo.Net** (or just HedgeCo)
- Legal Entity: **HedgeCo Ventures LLC**
- Tagline: "The Leading Free Alternative Investment Database"

---

## 🧭 Navigation Structure

### Header Navigation (Main Nav)
| Label | URL | Notes |
|-------|-----|-------|
| Home | `/` | Logo also links here |
| Database | `/funds/search.php` | **Requires login** |
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

### Footer Copyright
```
© 2025 HedgeCo.Net. All rights reserved. | Alternative Investments Platform
```

---

## 📄 Page Structure & Sections

### 1. Homepage (`/`)
- **Hero Section**
  - H1: "The Leading Free Alternative Investment Database"
  - Subheading: "Access thousands of dollars worth of data..."
  - Description paragraph about connecting with professionals
  - CTA button: "Get Free Access Now" → `/signInRegistration.php`
  - Background: Dark slate with gradient/pattern

- **Alternative Investment Asset Classes** (6 cards grid)
  - Hedge Funds 🏦
  - Private Equity 🏢
  - Venture Capital 🚀
  - Real Estate 🏘️
  - Crypto & Digital Assets ₿
  - SPV's 🌐
  - Each card: emoji icon, H3 title, description paragraph

- **Recent News & Insights**
  - H2: "Recent News & Insights"
  - "View All News" link → `/news`
  - 6 article cards with images, category tag, headline, excerpt
  - Each article shows: image, "Hedge News" category, title, excerpt

- **Why Choose HedgeCo.Net?**
  - H2 heading
  - Subtitle about $50,000+ value
  - 6 feature cards (2x3 grid):
    - Comprehensive Search 🔍
    - Performance Analytics 📊
    - Global Coverage 🌐
    - Mobile Access 📱
    - Real-time Alerts 🔔
    - Industry Network 🤝

- **CTA Section** (Bottom)
  - H2: "Ready to Access Premium Alternative Investment Data?"
  - Description about joining professionals
  - Two buttons: "Start Free Access" | "Contact Sales"

---

### 2. Registration Page (`/signInRegistration.php`)

**Step 1: Choose Registration Type**
- H1: "Join HedgeCo.Net Today"
- 4 registration type cards:
  
  1. **Fund Manager** 💼
     - "List your hedge funds, private equity..."
     - Benefits: List unlimited funds, Access to Thousands of Users, Performance tracking, Investor communication, Monthly reporting
     - Button: "Register as Fund Manager"
  
  2. **Investor** 📊
     - "Search and discover alternative investment opportunities..."
     - Benefits: Access to Thousands of funds, Advanced search, Fund performance analytics, Direct manager contact, Personalized recommendations
     - Button: "Register as Investor"
  
  3. **Service Provider** 🏢
     - "Connect with alternative investment professionals..."
     - Benefits: Professional directory listing, Lead generation, Client testimonials, Marketing analytics, Industry networking
     - Button: "Register as Service Provider"
  
  4. **News Member** 📰
     - "Stay informed with latest alternative investment news..."
     - Benefits: Daily news updates, Market analysis reports, Industry newsletters, Exclusive interviews, Research publications
     - Button: "Register for News Access"

- **Why Join Section** (Bottom)
  - 4 benefit cards: Completely Free 🆓, Global Reach 🌍, Secure Platform 🔒, Performance Tracking 📈

**Step 2: Investor Registration Form**
*(Example - Investor selected)*

**Your Contact Information:**
- First Name* | Last Name* (2-column)
- Company* | Position or Job Title* (2-column)
- Address (No P.O. Boxes)* | Line 2 (2-column)
- Town/City* | State/Province* (2-column)
- Zip/Postal Code* | Country* dropdown (2-column)

**Phone Number:**
- Telephone Country Code* (dropdown) | Telephone Number* (2-column)
- Example placeholder: "561-295-3709"

**Account Login Information:**
- Email Address (username)* - placeholder: "firstname@mycompany.com"
- Password*

**Newsletter Signup:**
- Subscribe To Our Daily Newsletter: ○ Yes (default) ○ No
- Subscribe To Our Weekly Newsletter: ○ Yes (default) ○ No

**Terms & Conditions:**
- Full legal terms displayed in scrollable box
- Checkbox: "I agree to the above terms of use.*"

- Button: "Continue With My Registration" (teal filled)

**⚠️ Note:** Registration requires admin approval before access is granted.

---

### 3. Login Page (`/sign-in.php`)
- Centered card layout
- H2: "Login to Your Account" (teal text)
- Form fields:
  - Email Address (label), textbox with placeholder "your@example.com"
  - Password (label), textbox with placeholder "********"
  - Login button (teal filled, full width)
  - "Forgot Password?" link → `/account/password.php?request=reset`
  - "Not a member? Create Account" link → `/signInRegistration.php`

**🔐 NO Google OAuth or social login options visible.**

---

### 4. Hedgeducation (`/hedgeducation/`)

**Hero Section:**
- Badge: "📚 Learning Hub"
- H1: "HEDGEDUCATION"
- Subtitle: "Your gateway to the world of hedge funds and alternative investments"

**Hedgeducation New Topics:**
- H3 with 📚 icon
- List of 10 educational articles:
  1. 📈 Hedge Funds 101: Strategies, Fees, and Portfolio Role
  2. 🚀 Venture Capital Origins: ARDC, DEC, and the SBIC Framework
  3. 💼 Private Equity Buyouts: LBOs and Value Creation
  4. 🏢 What Is an SPV? Structure, Uses & SPV vs. Funds
  5. 📊 How Alternatives Fit: Lessons from the Endowment Model
  6. 💰 Liquidity, the J‑Curve, Capital Calls & Distributions
  7. ✅ Eligibility & Regulations
  8. 🔍 The Taxonomy of Alternatives: Types, Drivers, Examples
  9. 📋 Alternative Investments Due Diligence Checklist
  10. 📜 The Origins of Alternative Investments: From Hedging to a $5 Trillion Pillar

**Alternative Investing 101:**
- H2 heading
- Descriptive paragraph about Hedgeducation
- 4 category cards (2x2):
  - Industry Overview 📊 → `industry-overview.php`
  - New to Hedge Funds 🚀 → `new-to-hedge-funds.php`
  - Hedge Fund FAQ ❓ → `faq.php`
  - Hedge Fund Glossary 📖 → `hedge-fund-glossary/`

**Terms In Focus:**
- H3: "📖 Terms In Focus"
- Glossary term cards:
  - Alpha
  - Beta
  - Fund of Funds
  - General Partner
  - View Complete Glossary → link to full glossary

---

### 5. About Page (`/about/`)

**Hero:**
- H1: "Our Story"
- Subtitle: "From pioneering hedge fund transparency to building..."

**History Narrative:**
- Multiple paragraphs about founding in 2002
- 2025 Relaunch Mission box with checkmarks:
  - ✅ Expand coverage beyond hedge funds
  - ✅ Deliver modern, advisor-focused experience with AI
  - ✅ Keep HedgeCo.net the only truly free alternatives database

**Timeline: "Our Journey"**
- Vertical timeline with year markers:
  - 2001-2002: Founding
  - 2004: Expansion into Marketing & Web Services
  - 2005: Industry Recognition
  - 2006-2007: Early Affiliates
  - 2008: Strategic Growth & Investment
  - 2010-2012: Scaling Services
  - 2013: Rapid Scale
  - 2014: Technology Breakthrough
  - 2015-2019: SmartX Era
  - 2020-2023: SmartX Recognition & Monetization
  - 2024-2025: Return to HedgeCo

**2025 Relaunch Vision:**
- H2 heading
- Vision statement
- CTA button: "Join the Relaunch"

---

### 6. Conferences Page (`/conferences/`)

**Hero:**
- H1: "Alternative Investment Conferences"
- Description about connecting with industry leaders

**Filters:**
- Location dropdown (all countries)
- Date Range dropdown: All Dates, Current Month, Next Month, Next Quarter, Next Year
- Search textbox: "Search conferences..."
- Apply Filters button

**Upcoming Conferences:**
- H2: "Upcoming Conferences"
- Conference cards (grid layout):
  - Conference image/logo
  - Date range (📅 Feb 23, 2026 - Feb 26, 2026)
  - Conference title (H3)
  - Venue info (🏢 icon)
  - Event type badge (📍 physical)
  - Buttons: "✨ Register Now" | "📋 View Details"

---

### 7. News Page (`/news/`)

**HedgeCo Insights:**
- H2: "HedgeCo Insights" with "View All News" link
- Article cards (list layout):
  - Category link (e.g., "Hedge Fund Strategies")
  - Article title (H3 with link)
  - Excerpt paragraph
  - Date | Read time (e.g., "February 17, 2026 | 4 min read")

**Explore Alternative Investment Categories:**
- H2 heading
- Description paragraph
- Large grid of category cards (60+ categories):
  - Each card shows: 🏦 icon, Category name (H3), Post count
  - Examples: Activist Funds (175), Bitcoin (37), Crypto (93), Hedge Fund Strategies (394), HedgeCo News (9,514), Syndicated (29,416)

---

### 8. Service Providers Page (`/service-providers/`)

**Hero:**
- Badge: "The Leading Alternative Investment Network"
- H1: "Service Providers Directory"
- Description
- Stats: "1316+ Service Providers" | "78+ Service Categories"

**Search Section:**
- Search textbox: "Search by company name, service, or keyword..."
- Category dropdown (78 categories)
- Country dropdown
- Search button

**Service Provider Categories:**
- H2: "Service Provider Categories"
- Grid of category cards (78 categories):
  - Each card: icon image, count badge, category name (H3)
  - Examples: Accounting Firms (91), Administrators (73), Attorneys/Lawyers (61), Technology Vendors (122), Consultants (116)

---

### 9. Database/Fund Search (`/funds/search.php`)
**⚠️ REQUIRES AUTHENTICATION**
- Redirects to login page if not authenticated
- Appears to be the core product feature behind registration wall

---

### 10. Contact Page (`/contact-us.php`)

**Hero:**
- H1: "Contact Us"
- Description about getting in touch

**Contact Form:**
- Full Name*
- Email Address*
- Phone (optional)
- Subject* dropdown: General Inquiry, Technical Support, Partnership Opportunities, Data & Research, Membership Questions, Press & Media, Other
- Message* (textarea)
- "Send Message" button

**Contact Info Cards:**
- 📧 Email Us: support@hedgeco.net
- 📞 Call Us: +1 (561) 295 3709, Mon-Fri 9AM-6PM ET
- 🌐 Social Media: Twitter link

**Contact by Department:**
- 6 department cards:
  - Sales & Partnerships
  - Technical Support
  - Data & Research
  - Press & Media
  - Legal & Compliance
  - Fund Managers
  - All redirect to support@hedgeco.net

**Our Offices:**
- South Florida HedgeCo, LLC
- Palm Beach Gardens, FL 33418
- Mon-Fri: 9:00 AM - 6:00 PM ET

**FAQ Accordion:**
- How quickly will I receive a response?
- What information should I include in my message?
- Do you offer phone support?
- Can I schedule a demo or consultation?
- How do I report a technical issue?

---

## 🔤 Typography

### Fonts
- **Primary Font:** System font stack (Tailwind default)
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Headings:** Same font, different weights

### Font Sizes (Tailwind Scale)
| Element | Size | Class |
|---------|------|-------|
| H1 (Hero) | 36-48px | `text-4xl` / `text-5xl` |
| H2 (Section) | 30px | `text-3xl` |
| H3 (Cards) | 20-24px | `text-xl` / `text-2xl` |
| Body | 16px | `text-base` |
| Small | 14px | `text-sm` |

### Font Weights
- **Bold/Semibold:** Headings, buttons, labels
- **Regular/Normal:** Body text, descriptions
- **Medium:** Navigation items

---

## 📐 Spacing & Layout Patterns

### Container
- Max-width container with responsive padding
- Centered layout

### Section Spacing
- Section padding: `py-12` to `py-20` (48-80px vertical)
- Inner content padding: `px-4` to `px-8`

### Card Grid Patterns
- 2 columns on tablet, 3-4 columns on desktop
- Gap: `gap-6` (24px) or `gap-8` (32px)

### Card Styles
- Background: White
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-md` or `shadow-lg`
- Padding: `p-6` (24px)

---

## 🔘 Button Styles

### Primary Button (Filled)
```css
background: #0d9488 (teal-600)
color: white
padding: 12px 24px
border-radius: 8px (rounded-lg)
font-weight: 500-600
hover: #0f766e (teal-700)
```

### Secondary Button (Outlined)
```css
background: transparent
border: 1px solid #0d9488
color: #0d9488
padding: 12px 24px
border-radius: 8px
hover: background #0d9488, color white
```

### Button Sizes
- Default: `px-6 py-3`
- Small: `px-4 py-2`
- Large: `px-8 py-4`

---

## 📝 Form Styles

### Text Inputs
```css
background: white
border: 1px solid #e2e8f0 (slate-200)
border-radius: 6px (rounded-md)
padding: 10px 12px
focus: border-color #0d9488, ring
```

### Dropdowns/Select
- Same styling as text inputs
- Native select with custom arrow

### Labels
- Font size: 14px
- Font weight: 500 (medium)
- Color: slate-700
- Margin bottom: 4-8px

### Checkboxes/Radio
- Custom styled (teal accent)
- Labels inline

---

## 📱 Responsive Breakpoints

Uses Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Considerations
- Navigation collapses to hamburger menu
- Cards stack to single column
- Footer stacks vertically

---

## 🛠️ Technical Stack

### Frontend
- **CSS Framework:** Tailwind CSS (CDN version detected)
- **JavaScript:** jQuery 3.x + jQuery Migrate 3.3.1
- **No detected frontend framework** (React/Vue) - appears to be traditional PHP pages

### Libraries Detected
- jQuery
- jQuery Migrate
- Tailwind CSS (CDN)

---

## 🔐 Authentication Flow

### Login
1. User visits protected page (e.g., `/funds/search.php`)
2. Redirected to `/sign-in.php` with `ref` parameter
3. Login with email/password OR Google OAuth
4. After login, redirected to original URL

### Registration
1. User selects registration type (4 options)
2. Fills out detailed form with contact info
3. Accepts terms & conditions
4. Submits for **admin approval**
5. Account activated after approval

### Protected Areas
- Fund Database (`/funds/search.php`)
- Advanced Search
- Potentially user account/dashboard areas

---

## 📋 Additional Notes

1. **Google OAuth available** - Sign-in page has "Sign in with Google" option
2. **Admin approval required** for new registrations
3. **Tailwind CDN** in production (warning in console)
4. **Some 404 errors** for service provider icons
5. **Copyright shows 2025** despite current date being 2026
6. **Phone number format:** US format with country code dropdown

---

## 📁 URL Structure Summary

```
/                           Homepage
/sign-in.php               Login
/signInRegistration.php    Registration type selection
/registration/investors/   Investor registration form
/funds/search.php          Fund database (protected)
/news/                     News index
/news/category/{slug}      News by category
/news/MM/YYYY/{slug}.html  Individual article
/conferences/              Conferences list
/hedgeducation/            Education center
/hedgeducation/{slug}/     Education article
/hedge-fund-glossary/      Glossary
/service-providers/        Service providers directory
/service-providers/{category}/ Category page
/about/                    About page
/contact-us.php            Contact form
/termsofuse.php            Terms
/privacypolicy.php         Privacy policy
/account/password.php      Password reset
```

---

*Audit complete. This document contains all information needed for exact frontend recreation.*
