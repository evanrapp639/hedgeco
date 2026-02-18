# Security Audit Checklist

This document provides a comprehensive security audit checklist for the HedgeCo platform. Use this for regular security reviews and before major releases.

**Last Updated:** February 2026  
**Next Review:** Quarterly

---

## 1. Authentication Checklist

### Password Security

| Item | Status | Notes |
|------|--------|-------|
| Passwords hashed with bcrypt (cost factor ≥ 12) | ✅ | Using bcryptjs with 12 rounds |
| Minimum password length enforced (≥ 8 chars) | ✅ | Validated client and server side |
| Password complexity requirements | ✅ | Requires uppercase, lowercase, number |
| Password breach database check | ⚠️ | Consider adding HaveIBeenPwned API |
| Old password required for change | ✅ | Implemented |
| Password reset tokens expire | ✅ | 1 hour expiration |
| Password reset invalidates old tokens | ✅ | Single-use tokens |

### Session Management

| Item | Status | Notes |
|------|--------|-------|
| JWT tokens used for auth | ✅ | Using jose library |
| Access tokens short-lived (≤ 15 min) | ✅ | 15 minute expiration |
| Refresh tokens properly rotated | ✅ | Token family rotation |
| Tokens stored in httpOnly cookies | ✅ | Not accessible via JS |
| Secure flag on cookies in production | ✅ | Enabled for HTTPS |
| SameSite cookie attribute set | ✅ | Using 'lax' |
| Session invalidation on logout | ✅ | Cookies cleared |
| Concurrent session limits | ⚠️ | Consider implementing |

### Multi-Factor Authentication

| Item | Status | Notes |
|------|--------|-------|
| MFA supported | ⚠️ | Planned for future release |
| MFA required for admin accounts | ⚠️ | Planned |
| Backup codes available | ⚠️ | Planned |
| MFA bypass protection | ⚠️ | N/A until MFA implemented |

### Account Protection

| Item | Status | Notes |
|------|--------|-------|
| Account lockout after failed attempts | ✅ | 5 attempts, 15 min lockout |
| Login rate limiting | ✅ | Implemented |
| Email verification required | ✅ | Required for new accounts |
| Suspicious login notifications | ⚠️ | Consider implementing |
| IP-based login anomaly detection | ⚠️ | Consider implementing |

---

## 2. Authorization Checklist

### Role-Based Access Control

| Item | Status | Notes |
|------|--------|-------|
| Roles defined and documented | ✅ | INVESTOR, MANAGER, SERVICE_PROVIDER, NEWS_MEMBER, ADMIN, SUPER_ADMIN |
| Role checks on all protected routes | ✅ | Middleware + API guards |
| Role hierarchy enforced | ✅ | SUPER_ADMIN > ADMIN > others |
| Default role is least privileged | ✅ | INVESTOR is default |
| Role changes require admin approval | ✅ | Implemented |

### API Authorization

| Item | Status | Notes |
|------|--------|-------|
| All API endpoints require auth (except public) | ✅ | Middleware enforced |
| Resource ownership verified | ✅ | Users can only access own data |
| Admin endpoints restricted | ✅ | Role check enforced |
| CORS properly configured | ✅ | Limited to known origins |
| API rate limiting implemented | ✅ | Using middleware |

### Privilege Escalation Prevention

| Item | Status | Notes |
|------|--------|-------|
| Users cannot modify own role | ✅ | Server-side enforcement |
| Admins cannot create super admins | ✅ | Only super admin can |
| Role changes logged in audit | ✅ | AuditLog captures changes |
| Parameter tampering prevented | ✅ | Server-side validation |

---

## 3. Input Validation Checklist

### Client-Side Validation

| Item | Status | Notes |
|------|--------|-------|
| Form validation implemented | ✅ | Using zod |
| Type checking on inputs | ✅ | TypeScript + runtime checks |
| Length limits on text inputs | ✅ | Enforced |
| Format validation (email, phone, etc.) | ✅ | Zod schemas |

### Server-Side Validation

| Item | Status | Notes |
|------|--------|-------|
| All inputs validated server-side | ✅ | tRPC + zod |
| SQL injection prevention | ✅ | Prisma ORM with parameterized queries |
| NoSQL injection prevention | ✅ | N/A - using PostgreSQL |
| XSS prevention (output encoding) | ✅ | React auto-escapes |
| Command injection prevention | ✅ | No shell commands executed |
| Path traversal prevention | ✅ | File paths validated |
| SSRF prevention | ⚠️ | Review URL inputs |

### File Upload Security

| Item | Status | Notes |
|------|--------|-------|
| File type validation (magic bytes) | ✅ | Checking file signatures |
| File size limits enforced | ✅ | Max 10MB |
| Filename sanitization | ✅ | Removing special characters |
| Files stored outside webroot | ✅ | Using S3 |
| Virus scanning | ⚠️ | Consider adding |

---

## 4. Data Protection Checklist

### Data at Rest

| Item | Status | Notes |
|------|--------|-------|
| Database encrypted | ✅ | RDS encryption enabled |
| Backup encryption | ✅ | Encrypted backups |
| Sensitive fields encrypted | ⚠️ | Consider field-level encryption |
| PII properly classified | ✅ | Documented |
| Data retention policy defined | ✅ | See PRIVACY.md |

### Data in Transit

| Item | Status | Notes |
|------|--------|-------|
| HTTPS enforced | ✅ | HSTS enabled |
| TLS 1.2+ required | ✅ | Configured |
| Certificate properly configured | ✅ | Auto-renewed |
| Internal traffic encrypted | ✅ | VPC + TLS |

### Data Access

| Item | Status | Notes |
|------|--------|-------|
| Least privilege for DB access | ✅ | App uses limited role |
| Sensitive data masked in logs | ✅ | Passwords, tokens not logged |
| PII access logged | ✅ | Audit logs |
| Data export controlled | ✅ | Admin only |
| Deletion requests handled (GDPR) | ✅ | Implemented |

### Secrets Management

| Item | Status | Notes |
|------|--------|-------|
| Secrets in environment variables | ✅ | Not in code |
| .env files in .gitignore | ✅ | Confirmed |
| Production secrets in secure store | ✅ | Railway/Vercel secrets |
| Secrets rotated regularly | ⚠️ | Schedule rotation |
| API keys properly scoped | ✅ | Minimum permissions |

---

## 5. API Security Checklist

### Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| Bearer token authentication | ✅ | JWT in cookies |
| API key authentication (for partners) | ⚠️ | Consider for integrations |
| OAuth 2.0 for third-party | ⚠️ | Planned |
| Scoped API access | ✅ | Role-based |

### Rate Limiting

| Item | Status | Notes |
|------|--------|-------|
| Global rate limits | ✅ | 100 req/min default |
| Per-endpoint rate limits | ✅ | Stricter on auth endpoints |
| Rate limit headers returned | ✅ | X-RateLimit-* headers |
| Graceful 429 responses | ✅ | Includes Retry-After |

### API Design Security

| Item | Status | Notes |
|------|--------|-------|
| Versioned API | ✅ | /api/v1/ |
| Pagination enforced | ✅ | Max 100 per page |
| Field filtering/projection | ✅ | Only return needed fields |
| Error messages don't leak info | ✅ | Generic error messages |
| CORS properly configured | ✅ | Whitelist only |

### Documentation & Monitoring

| Item | Status | Notes |
|------|--------|-------|
| OpenAPI spec maintained | ✅ | openapi.json |
| Deprecated endpoints marked | ✅ | In docs |
| API access logged | ✅ | Request logging |
| Anomaly detection | ⚠️ | Consider implementing |

---

## 6. Infrastructure Checklist

### Server Security

| Item | Status | Notes |
|------|--------|-------|
| OS/runtime updated | ✅ | Node 22.x, latest patches |
| Unnecessary services disabled | ✅ | Minimal container |
| Firewall configured | ✅ | Security groups |
| SSH key-only access | ✅ | No password auth |
| Audit logging enabled | ✅ | CloudWatch/Railway logs |

### Container Security

| Item | Status | Notes |
|------|--------|-------|
| Base image from trusted source | ✅ | Official Node image |
| Non-root user in container | ✅ | Running as node user |
| Read-only filesystem | ⚠️ | Consider enabling |
| Image vulnerability scanning | ✅ | Snyk in CI |
| Secrets not in image | ✅ | Environment variables |

### Network Security

| Item | Status | Notes |
|------|--------|-------|
| WAF enabled | ⚠️ | Consider CloudFront WAF |
| DDoS protection | ✅ | Cloudflare |
| Private subnets for DB | ✅ | VPC isolation |
| TLS for all connections | ✅ | Enforced |

### Monitoring & Alerting

| Item | Status | Notes |
|------|--------|-------|
| Security event logging | ✅ | Audit logs |
| Failed login alerts | ✅ | Configured |
| Error rate monitoring | ✅ | Sentry |
| Uptime monitoring | ✅ | Better Uptime |
| Incident response plan | ✅ | See INCIDENT_RESPONSE.md |

---

## 7. Compliance Checklist

### GDPR

| Item | Status | Notes |
|------|--------|-------|
| Privacy policy published | ✅ | /privacy |
| Cookie consent implemented | ✅ | Cookie banner |
| Data access request process | ✅ | Settings page |
| Data deletion request process | ✅ | Account deletion |
| Data portability | ✅ | Export feature |
| DPO designated | ✅ | Contact info available |

### Financial Regulations

| Item | Status | Notes |
|------|--------|-------|
| Accreditation verification | ✅ | Third-party verification |
| KYC/AML compliance | ✅ | Stripe Identity |
| Transaction logging | ✅ | All transactions logged |
| Regulatory reporting | ✅ | Automated reports |

---

## 8. Security Testing

### Automated Testing

| Item | Status | Notes |
|------|--------|-------|
| SAST in CI/CD | ✅ | ESLint security rules |
| Dependency scanning | ✅ | npm audit, Snyk |
| Container scanning | ✅ | Snyk |
| DAST scheduled | ⚠️ | Consider OWASP ZAP |

### Manual Testing

| Item | Status | Notes |
|------|--------|-------|
| Penetration test (annual) | ⚠️ | Schedule with vendor |
| Code review for security | ✅ | PR reviews |
| Security design review | ✅ | For new features |

---

## Action Items

### High Priority
1. [ ] Implement MFA for admin accounts
2. [ ] Schedule penetration test
3. [ ] Add SSRF validation for URL inputs

### Medium Priority
4. [ ] Add password breach checking (HaveIBeenPwned)
5. [ ] Implement concurrent session limits
6. [ ] Add WAF rules
7. [ ] Schedule secret rotation

### Low Priority
8. [ ] Add suspicious login notifications
9. [ ] Implement IP-based anomaly detection
10. [ ] Add virus scanning for uploads

---

## Review History

| Date | Reviewer | Notes |
|------|----------|-------|
| 2026-02-17 | Security Team | Initial checklist |

---

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
