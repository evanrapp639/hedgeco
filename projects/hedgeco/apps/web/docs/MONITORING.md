# Monitoring & Observability Guide

This document outlines the recommended monitoring setup for HedgeCo.Net production deployments.

## Table of Contents

- [Overview](#overview)
- [Error Tracking](#error-tracking)
- [Application Performance Monitoring (APM)](#application-performance-monitoring-apm)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Log Management](#log-management)
- [Key Metrics](#key-metrics)
- [Alert Thresholds](#alert-thresholds)
- [Dashboards](#dashboards)

## Overview

A robust monitoring stack for HedgeCo.Net should include:

| Layer | Recommended Tools |
|-------|------------------|
| Error Tracking | Sentry, Bugsnag |
| APM | Sentry Performance, DataDog, New Relic |
| Infrastructure | Prometheus + Grafana, DataDog |
| Logs | Loki, ELK Stack, DataDog Logs |
| Uptime | Better Uptime, Pingdom, UptimeRobot |

## Error Tracking

### Sentry Setup

1. **Install Sentry SDK:**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure environment variables:**
   ```env
   SENTRY_DSN=https://xxx@sentry.io/xxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_ORG=your-org
   SENTRY_PROJECT=hedgeco
   ```

3. **Run Sentry wizard:**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

### Error Tracking Best Practices

- **Set user context** when authenticated
- **Add breadcrumbs** for debugging context
- **Tag errors** by feature area (auth, payments, etc.)
- **Set release versions** for regression tracking

## Application Performance Monitoring (APM)

### Key Transactions to Monitor

| Transaction | Target | Critical |
|------------|--------|----------|
| `GET /dashboard` | < 500ms | Yes |
| `POST /api/auth/login` | < 300ms | Yes |
| `GET /api/funds` | < 200ms | Yes |
| `POST /api/trpc/*` | < 500ms | Yes |
| Server-side render | < 1000ms | No |

### Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s | > 4.0s |
| **FID** (First Input Delay) | < 100ms | < 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | < 200ms | < 500ms | > 500ms |
| **TTFB** (Time to First Byte) | < 200ms | < 500ms | > 500ms |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s | > 3.0s |

### Using the Monitoring Library

```typescript
import { 
  measureAsync, 
  captureError, 
  recordTiming,
  incrementCounter 
} from '@/lib/monitoring';

// Measure async operations
const result = await measureAsync('database.query.funds', async () => {
  return await prisma.fund.findMany();
});

// Track custom metrics
incrementCounter('user.login.success');
recordTiming('api.response', 150);

// Capture errors with context
try {
  await processPayment();
} catch (error) {
  captureError(error, { 
    userId: user.id, 
    action: 'payment.process' 
  });
}
```

## Infrastructure Monitoring

### Database (PostgreSQL)

| Metric | Warning | Critical |
|--------|---------|----------|
| Connection pool usage | > 70% | > 90% |
| Query latency (p95) | > 100ms | > 500ms |
| Disk usage | > 70% | > 85% |
| Replication lag | > 10s | > 60s |
| Active connections | > 80 | > 100 |

### Redis

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory usage | > 70% | > 85% |
| Connected clients | > 100 | > 200 |
| Keyspace misses ratio | > 20% | > 40% |
| Latency (p99) | > 5ms | > 20ms |

### Application Containers

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU usage | > 70% | > 90% |
| Memory usage | > 70% | > 85% |
| Container restarts | > 3/hour | > 10/hour |
| Request queue depth | > 100 | > 500 |

## Log Management

### Structured Logging Format

All logs follow JSON format:

```json
{
  "type": "request",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/auth/login",
  "statusCode": 200,
  "duration": 45,
  "userId": "user_xyz",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `error` | Unexpected errors requiring attention |
| `warn` | Degraded functionality, non-critical issues |
| `info` | Important business events (login, payment) |
| `debug` | Detailed debugging (disabled in production) |

### Log Retention

| Environment | Retention |
|------------|-----------|
| Production | 90 days |
| Staging | 30 days |
| Development | 7 days |

## Key Metrics

### Business Metrics

Track these for business health:

- **Daily Active Users (DAU)**
- **User signups** (daily/weekly/monthly)
- **Login success/failure rate**
- **Payment conversion rate**
- **API usage by endpoint**
- **Search queries per user**

### Technical Metrics

Track these for system health:

- **Request rate** (requests/second)
- **Error rate** (4xx, 5xx responses)
- **Response time percentiles** (p50, p95, p99)
- **Database query count and duration**
- **Cache hit rate**
- **Background job queue depth**

## Alert Thresholds

### Critical Alerts (Page immediately)

| Condition | Threshold |
|-----------|-----------|
| Error rate | > 5% for 5 minutes |
| Health check failing | > 3 consecutive failures |
| Database connection errors | Any |
| Payment processing errors | Any |
| CPU/Memory | > 95% for 5 minutes |

### Warning Alerts (Notify during business hours)

| Condition | Threshold |
|-----------|-----------|
| Error rate | > 1% for 15 minutes |
| Response time p95 | > 2s for 10 minutes |
| Disk usage | > 80% |
| SSL certificate expiry | < 14 days |
| Rate limit triggers | > 100/hour |

### Informational (Log only)

| Condition | Notes |
|-----------|-------|
| Deployment completed | Include version |
| Unusual traffic patterns | > 2x normal |
| New error types | First occurrence |

## Dashboards

### Operations Dashboard

Essential real-time view:

1. **Request rate** (line chart, last 1 hour)
2. **Error rate** (line chart, last 1 hour)
3. **Response time** (heatmap, p50/p95/p99)
4. **Active users** (counter)
5. **Recent errors** (table)
6. **Health status** (status indicators)

### Performance Dashboard

Deep-dive performance view:

1. **Web Vitals** (all metrics, trend)
2. **Slowest endpoints** (table)
3. **Database query times** (heatmap)
4. **Cache hit rates** (gauge)
5. **Memory/CPU usage** (line chart)

### Business Dashboard

Stakeholder view:

1. **Signups** (daily/weekly trend)
2. **Active users** (DAU/WAU/MAU)
3. **Revenue metrics** (if applicable)
4. **Feature usage** (bar chart)
5. **Geographic distribution** (map)

## Health Check Endpoints

### `/api/health`

Basic liveness probe:
- Returns `200` if application is running
- Use for load balancer health checks

### `/api/health/ready`

Readiness probe:
- Returns `200` only when all dependencies are ready
- Use for Kubernetes readiness probes
- Checks: database, Redis, migrations

### `/api/health?verbose=true`

Detailed health status:
- Returns full dependency check results
- Use for debugging and detailed monitoring

## Implementation Checklist

- [ ] Configure Sentry (or alternative error tracking)
- [ ] Set up uptime monitoring for production URL
- [ ] Configure log aggregation (Loki/ELK/DataDog)
- [ ] Create operations dashboard
- [ ] Set up alerting rules
- [ ] Configure SSL certificate monitoring
- [ ] Enable database monitoring
- [ ] Set up Redis monitoring
- [ ] Configure Web Vitals reporting
- [ ] Document on-call procedures
