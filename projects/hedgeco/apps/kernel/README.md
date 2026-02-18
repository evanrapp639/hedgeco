# HedgeCo.Net Operations Kernel

A permissioned service layer that sits between agents and sensitive actions. Provides BullMQ queues, audit logging, human approval gates, and policy enforcement.

## Why It Matters

Prevents "oops I approved 300 users" scenarios. Makes everything replayable/debuggable.

## Architecture

```
Agent → Kernel API → BullMQ Queue → Worker → Action
      ↑            ↑              ↑
      │            │              └── Audit Log
      │            └── Permission Gate
      └── Policy Enforcement
```

## Core Features

### 1. Permissioned Tool Endpoints
- Agents call kernel instead of direct database/API
- Role-based permissions (scooby, shaggy, daphne, velma, fred)
- Action-specific policy evaluation

### 2. BullMQ Queues with Redis Persistence
- **Email**: welcome, confirmation, notification, newsletter
- **Embedding**: user profiles, fund data, provider data  
- **Webhook**: stripe, plaid, sendgrid, slack
- **Notification**: urgent, alert, digest
- **Approval**: membership approvals, fund verification, provider upgrades
- **Publish**: news, announcements, updates

### 3. Audit Logging
- Every action logged with agent, timestamp, outcome
- Replay/debug capability for any job
- Export to JSON/CSV for analysis

### 4. Human Approval Gates
- High-risk actions require human approval
- Configurable approval levels (low/medium/high)
- Evidence collection (screenshots, logs, data)

### 5. Safe Send Gate for Emails
- Marketing agents never call Resend directly
- Audience size limits
- Compliance flag checking
- Throttle rate enforcement
- Unsubscribe link verification

## Quick Start

### 1. Install Dependencies
```bash
cd kernel
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Redis and API settings
```

### 3. Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis/redis-stack-server:latest

# Or use Upstash (recommended for production)
```

### 4. Run the Kernel
```bash
npm run dev  # Development
npm start    # Production
```

## API Usage

### Submit an Action
```bash
curl -X POST http://localhost:3001/action \
  -H "X-Agent: daphne" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "daphne",
    "action": "send_welcome_email",
    "entityId": "user_123",
    "data": {
      "email": "user@example.com",
      "firstName": "John"
    }
  }'
```

### Check Safe Send
```bash
curl -X POST http://localhost:3001/email/safe-send \
  -H "X-Agent: velma" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "audienceDefinition": { "count": 500 },
    "copy": { ... },
    "sendingDomain": "hedgeco.net",
    "throttle": 1000,
    "unsubscribeLink": true,
    "complianceFlags": ["promotional"]
  }'
```

### Query Audit Log
```bash
curl -X GET "http://localhost:3001/audit?agent=daphne&limit=10" \
  -H "X-Agent: scooby" \
  -H "Authorization: Bearer your-api-key"
```

## Agent Permissions

| Agent | Read | Write | Exec | Browser | Cron | Message |
|-------|------|-------|------|---------|------|---------|
| scooby | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| shaggy | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| daphne | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| velma | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| fred | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

## High-Risk Actions (Require Approval)

1. **Membership Actions**
   - `approve_membership`
   - `verify_fund`
   - `upgrade_provider`

2. **Publishing Actions**
   - `publish_news`
   - `publish_announcement`
   - `publish_update`

3. **Email Actions**
   - `send_newsletter` (bulk)
   - Any email to > 1000 recipients

4. **User Actions**
   - `delete_user`
   - `update_payment`
   - `change_role`

## Safe Send Rules

### Automatic Block
- Audience > 10,000 recipients
- Missing unsubscribe link
- Unauthorized sending domain
- High-risk compliance flags (financial advice, guaranteed returns)

### Requires Approval
- Audience 1,000–10,000 recipients
- Medium-risk compliance flags (promotional, limited time)
- Fast throttle rate (< 1 second between emails)

### Automatic Send
- Audience < 1,000 recipients
- Low-risk content
- Proper throttle rate
- Valid sending domain
- Unsubscribe link present

## Deployment

### Railway (Recommended)
```bash
railway up
```

### Docker
```bash
docker build -t hedgeco-kernel .
docker run -p 3001:3001 hedgeco-kernel
```

### Manual
```bash
npm run build
npm start
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Queue Stats
```bash
curl -H "X-Agent: scooby" http://localhost:3001/queues
```

### Job Status
```bash
curl http://localhost:3001/job/{jobId}
```

## Development

### Environment Variables
```env
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
API_KEYS=agent-key-1,agent-key-2
ALLOWED_ORIGINS=http://localhost:3000
```

### Running Tests
```bash
npm test
```

### Building
```bash
npm run build
```

## Integration with HedgeCo App

1. **Update agent calls** to use kernel API instead of direct actions
2. **Implement approval dashboard** for human review
3. **Add audit log viewer** for debugging
4. **Configure safe send gates** for all email sending

## Next Steps

1. **Phase 1**: Kernel service + basic queues
2. **Phase 2**: Approval dashboard UI
3. **Phase 3**: Ticketing MVP integration
4. **Phase 4**: News pipeline + safe send gate
5. **Phase 5**: Model router + RAG system