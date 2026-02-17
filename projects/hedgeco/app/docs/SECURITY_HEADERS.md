# Security Headers Documentation

This document describes the security headers implemented in the HedgeCo application and their purpose.

## Overview

Security headers are HTTP response headers that help protect against common web vulnerabilities. They are implemented in `src/middleware.ts` and applied to all requests.

## Implemented Headers

### Content-Security-Policy (CSP)

**Purpose:** Prevents XSS attacks, clickjacking, and other code injection attacks by specifying which sources of content are allowed.

**Current Configuration:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: http:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://api.stripe.com https://www.google-analytics.com wss:;
frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests;
```

**Directives Explained:**
- `default-src 'self'` - Only allow resources from same origin by default
- `script-src` - Allow scripts from self, Stripe (payments), and Google Tag Manager (analytics)
- `style-src` - Allow styles from self and Google Fonts
- `img-src` - Allow images from any HTTPS source (for user avatars, etc.)
- `font-src` - Allow fonts from Google Fonts
- `connect-src` - Allow AJAX/WebSocket to self, Stripe API, and Google Analytics
- `frame-src` - Allow iframes from Stripe (for payment forms)
- `frame-ancestors 'none'` - Prevent our site from being embedded in frames
- `form-action 'self'` - Only allow forms to submit to same origin
- `object-src 'none'` - Block Flash and other plugins
- `upgrade-insecure-requests` - Automatically upgrade HTTP to HTTPS

### X-Frame-Options

**Value:** `DENY`

**Purpose:** Prevents the page from being embedded in frames (clickjacking protection).

**Note:** This is redundant with `frame-ancestors 'none'` in CSP but provides backward compatibility with older browsers.

### X-Content-Type-Options

**Value:** `nosniff`

**Purpose:** Prevents browsers from MIME-sniffing the content type. Forces browsers to use the declared Content-Type header, preventing XSS attacks via type confusion.

### Referrer-Policy

**Value:** `strict-origin-when-cross-origin`

**Purpose:** Controls how much referrer information is sent with requests:
- Same-origin requests: Full URL sent
- Cross-origin requests: Only the origin is sent
- HTTPS→HTTP requests: No referrer sent

This protects user privacy while maintaining functionality.

### Permissions-Policy

**Value:**
```
camera=(),
microphone=(),
geolocation=(),
interest-cohort=(),
payment=(self),
usb=(),
magnetometer=(),
gyroscope=(),
accelerometer=()
```

**Purpose:** Restricts which browser features can be used:
- `camera=()` - Disable camera access
- `microphone=()` - Disable microphone access
- `geolocation=()` - Disable geolocation
- `interest-cohort=()` - Opt out of FLoC (Google tracking)
- `payment=(self)` - Allow Payment Request API only from same origin
- Other sensors disabled for security

### X-XSS-Protection

**Value:** `1; mode=block`

**Purpose:** Legacy XSS protection for older browsers. Modern browsers have built-in protection.

### X-DNS-Prefetch-Control

**Value:** `on`

**Purpose:** Allows DNS prefetching for better performance while maintaining security.

### Strict-Transport-Security (HSTS)

**Value:** `max-age=31536000; includeSubDomains; preload`

**Purpose:** Forces HTTPS connections:
- `max-age=31536000` - Remember for 1 year
- `includeSubDomains` - Apply to all subdomains
- `preload` - Allow inclusion in browser preload lists

## Testing Security Headers

### Using Browser DevTools

1. Open your site in Chrome/Firefox
2. Open DevTools (F12)
3. Go to Network tab
4. Reload the page
5. Click on the document request
6. Check the "Headers" tab under "Response Headers"

### Using curl

```bash
curl -I https://your-site.com
```

### Using Online Tools

- [SecurityHeaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com)

### Automated Testing

Run the security headers test:

```bash
# Test locally
npm run dev
curl -I http://localhost:3000

# Or use the e2e tests
npm run test:e2e -- --grep "security headers"
```

## Customization

### Modifying CSP for Development

In development, you may need to relax CSP to allow Hot Module Replacement (HMR):

```typescript
// In middleware.ts, add condition:
if (process.env.NODE_ENV === 'development') {
  csp += " 'unsafe-eval'"; // Already included for HMR
}
```

### Adding New Third-Party Services

When integrating a new service, update the CSP:

1. Scripts: Add to `script-src`
2. Styles: Add to `style-src`
3. API calls: Add to `connect-src`
4. Iframes: Add to `frame-src`

Example for adding Intercom:
```typescript
script-src: "... https://widget.intercom.io"
connect-src: "... https://api-iam.intercom.io wss://nexus-websocket-a.intercom.io"
```

## Troubleshooting

### CSP Violations in Console

If you see errors like `Refused to execute inline script`, check:
1. Is the script source in `script-src`?
2. For inline scripts, consider using nonces or hashes
3. Move inline scripts to external files

### Images Not Loading

Add the image domain to `img-src`:
```typescript
img-src: "... https://new-cdn.example.com"
```

### WebSocket Connection Failed

Add the WebSocket URL to `connect-src`:
```typescript
connect-src: "... wss://new-service.example.com"
```

## Security Headers Checklist

- [x] Content-Security-Policy configured
- [x] X-Frame-Options set to DENY
- [x] X-Content-Type-Options set to nosniff
- [x] Referrer-Policy configured
- [x] Permissions-Policy configured
- [x] HSTS enabled with preload
- [x] X-XSS-Protection enabled (legacy)

## References

- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Google CSP Guide](https://developers.google.com/web/fundamentals/security/csp)
