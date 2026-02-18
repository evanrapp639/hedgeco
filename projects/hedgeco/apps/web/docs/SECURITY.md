# HedgeCo.Net Security Configuration

Comprehensive security checklist and configuration guide for production deployments.

## Table of Contents

- [Authentication](#authentication)
- [Authorization](#authorization)
- [API Security](#api-security)
- [Data Protection](#data-protection)
- [Infrastructure Security](#infrastructure-security)
- [Compliance Considerations](#compliance-considerations)
- [Security Checklist](#security-checklist)

---

## Authentication

### JWT Configuration

HedgeCo.Net uses JWT tokens for authentication with access/refresh token rotation.

#### Token Settings

| Setting | Recommended Value | Description |
|---------|------------------|-------------|
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `JWT_SECRET` | 64+ chars | HMAC signing secret |

#### Secret Generation

Always use cryptographically secure secrets:

```bash
# Generate 256-bit secret
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ Never use default secrets in production!**

#### Token Storage

- **Access tokens**: Stored in memory (React state)
- **Refresh tokens**: HttpOnly, Secure, SameSite=Strict cookies
- **Session data**: Server-side only (never in client-accessible storage)

### Password Security

Passwords are hashed using bcrypt with a cost factor of 12:

```typescript
// Password hashing (in auth module)
const hashedPassword = await bcrypt.hash(password, 12);
```

#### Password Requirements

Recommended password policy (implement in registration):

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common password lists

---

## Authorization

### Role-Based Access Control (RBAC)

HedgeCo.Net implements RBAC with the following roles:

| Role | Access Level |
|------|--------------|
| `INVESTOR` | View funds, manage watchlist, messaging |
| `MANAGER` | Manage own funds, view analytics |
| `SERVICE_PROVIDER` | Manage provider profile, view leads |
| `NEWS_MEMBER` | Read news, basic platform access |
| `ADMIN` | User management, fund approval, platform settings |
| `SUPER_ADMIN` | Full access, system configuration |

### Route Protection

Protected routes check authentication and authorization:

```typescript
// Middleware checks (in auth context)
if (!user) redirect('/login');
if (user.role !== 'ADMIN') redirect('/unauthorized');
```

### API Authorization

tRPC procedures verify permissions:

```typescript
// Example: Admin-only procedure
const adminRouter = router({
  getStats: adminProcedure
    .query(async ({ ctx }) => {
      // Only admins reach here
    }),
});
```

---

## API Security

### Rate Limiting

Configure rate limiting to prevent abuse:

```typescript
// Recommended rate limits
const rateLimits = {
  // General API
  api: {
    windowMs: 60 * 1000,  // 1 minute
    max: 100,              // 100 requests
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 attempts
  },
  // Sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10,                    // 10 operations
  },
};
```

#### Implementation with Redis

For distributed rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});
```

### CORS Configuration

Configure CORS to allow only trusted origins:

```typescript
// next.config.js or API routes
const corsOrigins = [
  'https://hedgeco.net',
  'https://www.hedgeco.net',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);

// In API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigins.includes(origin) ? origin : '',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};
```

### Content Security Policy (CSP)

Configure CSP headers in `vercel.json` or middleware:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.hedgeco.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

#### CSP Directives Explained

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default policy for all resources |
| `script-src` | `'self' 'unsafe-inline'` | Allow scripts (Next.js needs inline) |
| `style-src` | `'self' 'unsafe-inline'` | Allow styles |
| `img-src` | `'self' data: https:` | Allow images from self and HTTPS |
| `connect-src` | `'self' https://api...` | API connections |
| `frame-ancestors` | `'none'` | Prevent clickjacking |

### Additional Security Headers

Configure these headers in `vercel.json` or middleware:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

---

## Data Protection

### SQL Injection Prevention

Prisma ORM provides parameterized queries by default:

```typescript
// ✅ Safe - Prisma parameterizes automatically
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ Avoid raw queries with user input
// If you must use raw queries, use $queryRaw with tagged templates:
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### XSS Prevention

#### React's Built-in Protection

React escapes values by default:

```tsx
// ✅ Safe - React escapes this
<div>{userInput}</div>

// ❌ Dangerous - avoid dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### Additional Measures

1. **Sanitize rich text** if allowing HTML input:
   ```bash
   npm install dompurify
   ```
   ```typescript
   import DOMPurify from 'dompurify';
   const clean = DOMPurify.sanitize(dirtyHtml);
   ```

2. **Validate input** on both client and server:
   ```typescript
   import { z } from 'zod';
   
   const userSchema = z.object({
     name: z.string().min(1).max(100),
     email: z.string().email(),
   });
   ```

### Data Encryption

#### At Rest

- Database: Enable encryption at rest (cloud providers offer this)
- Sensitive fields: Consider application-level encryption for PII

#### In Transit

- Always use HTTPS (TLS 1.2+)
- Enable HSTS header
- Use secure cookie flags

```typescript
// Secure cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

---

## Infrastructure Security

### Database Security

1. **Use strong passwords** for database users
2. **Limit network access** - Allow only application servers
3. **Enable SSL** for database connections
4. **Regular backups** with encryption
5. **Principle of least privilege** for database users

```bash
# PostgreSQL SSL connection
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Environment Variables

1. **Never commit secrets** to version control
2. **Use platform secrets** (Vercel, Railway) for production
3. **Rotate secrets** periodically
4. **Audit access** to secret management

### Dependency Security

Regular security audits:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Update dependencies
npm update
```

Consider using automated tools:
- **Dependabot** (GitHub)
- **Snyk** (CI/CD integration)
- **Socket** (supply chain security)

---

## Compliance Considerations

### GDPR (EU)

If serving EU users:

- [ ] Privacy policy displayed
- [ ] Cookie consent banner
- [ ] Data export capability
- [ ] Account deletion capability
- [ ] Data processing agreements with vendors

### SOC 2

For enterprise customers:

- [ ] Access controls documented
- [ ] Audit logging enabled
- [ ] Encryption in transit and at rest
- [ ] Incident response plan
- [ ] Regular security assessments

### Financial Regulations

As a hedge fund platform:

- [ ] Accredited investor verification
- [ ] Document retention policies
- [ ] Audit trail for sensitive operations
- [ ] Data residency requirements

---

## Security Checklist

### Pre-Launch

- [ ] **Secrets rotated** - No default/development secrets
- [ ] **HTTPS enforced** - SSL certificate valid
- [ ] **Security headers** - CSP, HSTS, X-Frame-Options
- [ ] **Rate limiting** - Configured for all endpoints
- [ ] **Input validation** - All user inputs validated
- [ ] **Authentication tested** - Login, logout, token refresh
- [ ] **Authorization tested** - Role-based access working
- [ ] **Error handling** - No sensitive data in error messages
- [ ] **Logging configured** - Security events captured
- [ ] **Dependencies audited** - No known vulnerabilities

### Ongoing

- [ ] **Weekly**: Run `npm audit`
- [ ] **Monthly**: Review access logs
- [ ] **Quarterly**: Rotate secrets
- [ ] **Annually**: Full security assessment
- [ ] **Continuously**: Monitor for security alerts

### Incident Response

If a security incident occurs:

1. **Contain** - Disable affected systems
2. **Investigate** - Determine scope and impact
3. **Remediate** - Fix vulnerabilities
4. **Notify** - Inform affected users if required
5. **Document** - Create incident report
6. **Improve** - Update procedures to prevent recurrence

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security@hedgeco.net with details
3. Allow 90 days for remediation before disclosure
4. We appreciate responsible disclosure
