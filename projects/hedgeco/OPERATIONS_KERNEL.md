# Operations Kernel Architecture

## Core Concept
A small Node.js service that sits between agents and sensitive actions. Provides:
- BullMQ queue management
- Permissioned tool endpoints
- Audit logging
- Human approval gates
- Policy enforcement

## Why It Matters
Prevents "oops I approved 300 users" scenarios. Makes everything replayable/debuggable.

---

## Architecture

### Kernel Service (Node.js + Hono)
```
src/
├── kernel/
│   ├── index.ts          # Main server
│   ├── queues/           # BullMQ setup
│   ├── gates/            # Approval gates
│   ├── audit/            # Audit logging
│   └── policies/         # Policy enforcement
├── agents/
│   ├── scooby.ts         # Project lead
│   ├── shaggy.ts         # Backend
│   ├── daphne.ts         # Frontend
│   ├── velma.ts          # AI/Data
│   └── fred.ts           # QA/DevOps
└── shared/
    ├── types.ts          # TypeScript types
    ├── schemas.ts        # Zod schemas
    └── utils.ts          # Shared utilities
```

### Agent → Kernel Flow
1. Agent wants to perform sensitive action
2. Calls kernel endpoint with action + evidence
3. Kernel validates permissions
4. Kernel creates BullMQ job with audit trail
5. Job runs through approval gates
6. Result logged, agent notified

---

## BullMQ + Redis Setup

### Redis Configuration
```javascript
// NEVER in-memory only for important queues
// Use Redis persistence (AOF) or managed Redis (Upstash/Redis Cloud)

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  // Enable persistence
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000)
};
```

### Job Idempotency Pattern
```javascript
// jobId = hash(action + entityId + version)
const generateJobId = (action: string, entityId: string, version: number) => {
  return crypto.createHash('sha256')
    .update(`${action}:${entityId}:${version}`)
    .digest('hex')
    .slice(0, 32);
};

// If job runs twice, it produces the same result once
```

---

## Queue Schema (Extended)

### 1. Email Queue
```javascript
{
  concurrency: 3,
  priority: ['welcome', 'confirmation', 'notification', 'newsletter'],
  opts: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
}
```

### 2. Embedding Queue
```javascript
{
  concurrency: 1,  // CPU-intensive
  priority: ['user_profile', 'fund_data', 'provider_data'],
  opts: {
    attempts: 2,
    timeout: 30000  // 30 seconds
  }
}
```

### 3. Webhook Queue
```javascript
{
  concurrency: 5,
  priority: ['stripe', 'plaid', 'sendgrid', 'slack'],
  opts: {
    attempts: 5,
    backoff: { type: 'fixed', delay: 5000 }
  }
}
```

### 4. Notification Queue
```javascript
{
  concurrency: 10,
  priority: ['urgent', 'alert', 'digest'],
  opts: {
    attempts: 3,
    removeOnComplete: true
  }
}
```

### 5. Approval Queue (NEW - Compliance Spine)
```javascript
{
  concurrency: 2,
  priority: ['high_risk', 'medium_risk', 'low_risk'],
  opts: {
    attempts: 1,  // Approval jobs don't retry automatically
    removeOnComplete: false  // Keep for audit
  },
  metadata: {
    evidence: [],      // Screenshots, logs, data
    reasonCode: string,
    riskLevel: 'low' | 'medium' | 'high',
    requiresHuman: boolean
  }
}
```

### 6. Publish Queue (NEW - Compliance Spine)
```javascript
{
  concurrency: 1,
  priority: ['news', 'announcement', 'update'],
  opts: {
    attempts: 1,
    removeOnComplete: false
  },
  metadata: {
    sourceUrls: [],    // Where info came from
    claims: [],        // Factual claims made
    factChecks: [],    // AI fact-check results
    toneChecks: [],    // Tone analysis
    requiresHuman: boolean
  }
}
```

---

## Email System (Resend + Safe Send)

### Template Structure
```typescript
interface EmailTemplate {
  template_key: string;      // e.g., "welcome_investor"
  template_version: number;  // Semantic versioning
  render_hash: string;       // hash(template + data) for reproducibility
  subject: string;
  body: React.ReactElement;
  metadata: {
    category: 'transactional' | 'marketing' | 'notification';
    compliance_flags: string[];
    throttle_ms: number;     // Delay between sends
  };
}
```

### Safe Send Gate
```typescript
// Marketing agent NEVER calls Resend directly
// Creates a job with:
interface SendJob {
  audience_definition: AudienceFilter;
  copy: EmailTemplate;
  sending_domain: string;
  throttle: number;          // Max emails per hour
  unsubscribe_link: boolean;
  compliance_flags: string[];
}

// Kernel either:
// 1. Sends immediately (if safe rules met)
// 2. Queues for Evan approval (if risky)
// 3. Blocks (if violates policy)
```

---

## Support System (Good Enough Zendesk)

### Database Schema
```sql
-- tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  last_agent TEXT,           -- Last agent who touched it
  last_human TEXT,           -- Last human who touched it
  sla_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ticket_messages table
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'web', 'discord', 'telegram')),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Agent Actions
- `draft_reply` - AI drafts response, human approves
- `request_info` - Ask user for more information
- `close` - Mark as resolved (with reason)
- `escalate` - Pass to human with urgency level

### Routing Logic
```typescript
const routeTicket = (ticket: Ticket) => {
  const risk = calculateRisk(ticket);
  
  if (risk === 'low') {
    return 'auto_send';      // AI handles, sends immediately
  } else if (risk === 'medium') {
    return 'draft_approve';  // AI drafts, human approves
  } else {
    return 'escalate';       // Immediate human attention
  }
};
```

---

## AI Stack Optimization

### Model Routing by Function
```typescript
const MODEL_ROUTING = {
  // Cheap models ($0.10/1M tokens)
  cheap: {
    uses: ['classification', 'extraction', 'summarization', 'rewriting'],
    model: 'gpt-3.5-turbo',
    budget: '80% of AI spend'
  },
  
  // Mid models ($1-5/1M tokens)
  mid: {
    uses: ['customer_support', 'marketing_drafts', 'admin_decisions'],
    model: 'gpt-4-turbo',
    budget: '15% of AI spend'
  },
  
  // Premium models ($10-30/1M tokens)
  premium: {
    uses: ['complex_coding', 'ambiguous_compliance', 'sensitive_disputes'],
    model: 'gpt-4o',
    budget: '5% of AI spend'
  }
};
```

### RAG Over Long Context
Agents should NOT carry giant histories. Retrieve:
```typescript
const RETRIEVAL_SOURCES = [
  'policies.md',
  'membership_rules.md',
  'prior_tickets.json',
  'fund_verification_checklist.md',
  'editorial_style_rules.md'
];

// Velma uses this 80% of the time
// Only calls expensive models when retrieval fails
```

---

## Implementation Priority (Highest Leverage)

### Phase 1: Foundation (Week 1-2)
1. **Kernel Service** - Permissions + audit + job submission
2. **Approval Dashboard** - ROI workflow #2
3. **Ticketing MVP** - Email ingest → ticket → agent draft

### Phase 2: Compliance (Week 3-4)
4. **News Pipeline** - Draft → checks → publish queue
5. **Email Template System** - Versioning + safe-send gate

### Phase 3: Scale (Week 5-6)
6. **Model Router** - Cheap/mid/premium routing
7. **RAG System** - Policy/document retrieval
8. **Agent Integration** - Full team coordination

---

## Next Steps

1. **Create kernel/ directory** in hedgeco/app
2. **Set up BullMQ + Redis** (Upstash recommended)
3. **Build approval dashboard** (shadcn table + filters)
4. **Implement ticket tables** + basic routing
5. **Add safe-send gate** to email system

Once these are live, your "full team" starts feeling real. Each agent has clear boundaries, audit trails, and escalation paths.