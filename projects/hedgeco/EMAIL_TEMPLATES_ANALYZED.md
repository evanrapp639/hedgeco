# HedgeCo.Net Email Templates Analysis
*Captured from actual staging emails - February 19, 2026*

## Template Summary

| User Type | Subject | Key Features | Bugs Found |
|-----------|---------|--------------|------------|
| Service Provider | "HedgeCo.Net - Service Provider Listing" | Phone contact, immediate confirmation option, username/password shown | None |
| Investor | "Investor Welcome to HedgeCo.Net" | 3-step guide, access preview sections, confirm button | `{{firstName}}` placeholder sometimes shows as blank |
| Fund Manager | "Manager Welcome to HedgeCo.Net DD-MM-YYYY" | Same as Investor template | `{{firstName}}` placeholder shows as "Hi ," |
| News Member | "News Member" | Simple activation link, free membership mention | None |

---

## Service Provider Template

**Subject:** `HedgeCo.Net - Service Provider Listing`

```
Hello {{firstName}},

Thank you for listing your services in our directory on HedgeCo.Net, your application is currently being reviewed. We will contact you as soon as possible to confirm your membership if you have a paid listing, or you can contact us immediately at +1 (561) 835-8690 or by email at support@hedgeco.net to confirm your listing and membership immediately.

Prior to being approved, you can visit the public pages of HedgeCo.Net, where you can read breaking hedge fund news, browse educational articles on hedge funds and view upcoming seminars in addition to a host of other features.

As a reminder, before you can sign-in on HedgeCo.Net your account will have to be approved by one of our associates. Once your account has been approved, you will be able to sign-in on HedgeCo.Net using your account information below:

Username: {{email}}
Password: **********

To speed up the the approval process for free listings please click to confirm your registration.

HedgeCo.Net will notify you by email that your account has been approved.

Thank you for using HedgeCo.Net.

The HedgeCo™ Team
P: (561) 295-3709
@: support@hedgeco.net
W: www.hedgeco.net

HC HedgeCo.Net
The world's largest independent alternative investments database connecting accredited investors since 2002

LinkedIn | Twitter | Website

Â© 2025 HedgeCo.Net. All rights reserved.
West Palm Beach, FL | Unsubscribe | Privacy Policy
```

---

## Investor Template

**Subject:** `Investor Welcome to HedgeCo.Net`

```
First name

Hi {{firstName}},

Thank you for registering with HedgeCo.Net, the platform built to connect investors, fund managers, and service providers across the alternative investment industry.

We've received your registration and our team is currently reviewing your information. We will get back to you if we need any additional information. Otherwise, you should be on the lookout for an approval email once the team has had a chance to review all the necessary information.

Speed Up Your Approval
To speed up the approval process for free listings, please click below to confirm your registration.

[Confirm Registration Button]
This helps us verify your email address and expedite your account approval

In the meantime, feel free to:
• Explore our public news and education sections
• Contact us with any questions at support@hedgeco.net

We're excited to have you in the HedgeCo.Net community and look forward to supporting your alternative investment journey.

Here's What You Get Access To
Everything you need to make informed alternative investment decisions

[Bank Icon] Hedge Fund Database
Comprehensive performance data, strategy analysis, and fund manager profiles

[Private Equity Icon] Private Equity Access
PE fund launches, performance metrics, and investment opportunities

[SPV Icon] SPV Opportunities
Special purpose vehicles and co-investment opportunities

[Crypto Icon] Crypto Funds
Digital asset strategies and cryptocurrency fund performance

Get Started in 3 Easy Steps
1. Search Database
   Use our advanced filters to find funds
2. Analyze Performance
   Review detailed metrics and rankings
3. Connect & Invest
   Contact fund managers directly

[Search Database Button] [View Rankings Button]

Need Help Getting Started?
Our team is here to help you make the most of your HedgeCo.Net membership

[Email Icon] Email Support
```

---

## Fund Manager Template

**Subject:** `Manager Welcome to HedgeCo.Net {{date}}` (e.g., "16-02-2026")

*Note: Same content as Investor template, but with Manager subject line*

**Bug observed:** Shows "Hi ," without the name populated.

---

## News Member Template

**Subject:** `News Member`

```
Hi {{firstName}},

Thank you for registering with HedgeCo.Net for your free News membership.

This email is to confirm that the address you listed during registration is accurate. If you did not request this membership, please disregard this email and the membership will remain inactive.

To confirm and active your account please click on the link below:

[Click here to activate your account]
```

---

## Implementation Notes

### Template Variables Needed:
- `{{firstName}}` - User's first name
- `{{email}}` - User's email address (Service Provider only)
- `{{date}}` - Current date (Manager template)

### Action Links:
1. **Service Provider/Investor/Manager**: "Confirm Registration" button
2. **News Member**: "Click here to activate your account" link

### Footer Consistency:
All templates should include:
- HedgeCo™ Team contact info
- Social links (LinkedIn, Twitter, Website)
- Copyright and unsubscribe

### Bugs to Fix:
1. Investor/Manager templates show "Hi ," when `{{firstName}}` is empty
2. Consider fallback: "Hi there," or "Hi {{email}},"

### Admin Notification:
- Support email: support@hedgeco.net
- Phone: (561) 295-3709
- Immediate contact option for paid Service Provider listings: +1 (561) 835-8690
