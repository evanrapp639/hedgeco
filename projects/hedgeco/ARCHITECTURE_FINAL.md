# HedgeCo.Net Final Architecture

## 🎯 Mission
Complete rebuild of 20+ year old PHP hedge fund database with modern stack + AI-native features.

## 🏗️ Architecture Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: React Context + Zustand
- **Auth**: NextAuth.js
- **Deploy**: Vercel

### Backend Services
- **API Layer**: Hono + tRPC
- **Operations Kernel**: Permissioned tool endpoints
- **Workers**: BullMQ job processors
- **Deploy**: Railway (always-on)

### Data Layer
- **Database**: Neon PostgreSQL + pgvector
- **Cache/Queue**: Upstash Redis (AOF persistence)
- **File Storage**: Cloudflare R2
- **Search**: pgvector + OpenAI embeddings

### AI/ML
- **LLM**: OpenAI GPT-4o
- **Embeddings**: text-embedding-3-small
- **RAG**: Policy/document retrieval
- **Model Router**: Cost-optimized routing

### Email
- **Provider**: Resend
- **Templates**: React Email
- **Safe Send**: Kernel-enforced gates

## 🔐 Security Architecture

### Permission Model
```
Human Admin → Full access
System Service (API) → Limited writes
Agents → Kernel-mediated actions
Workers → Job-specific capabilities
```

### Agent Roles & Capabilities
| Agent | Read | Write | Exec | Browser | Kernel Actions |
|-------|------|-------|------|---------|----------------|
| Scooby | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| Shaggy | ✅ | ✅ | ✅ | ✅ | Backend tasks |
| Daphne | ✅ | ✅ | ✅ | ✅ | Frontend tasks |
| Velma | ✅ | ✅ | ✅ | ✅ | AI/data tasks |
| Fred | ✅ | ✅ | ✅ | ✅ | QA/DevOps |

### High-Risk Actions (Kernel-Mediated)
1. **Membership Approval**: approve/decline users
2. **Fund Verification**: mark funds as VERIFIED
3. **News Publishing**: draft → checks → publish
4. **Bulk Email**: safe send gates
5. **Financial Actions**: refunds/credits

## 📊 Data Flow

### User Registration
```
User signs up → API creates user → 
Kernel queues welcome email → 
Worker sends email → 
Audit log records action
```

### Membership Approval
```
Agent reviews application → 
Calls kernel with evidence → 
Kernel queues approval job → 
Human reviews in dashboard → 
Approved/rejected → 
Email sent → Audit logged
```

### News Pipeline
```
Agent drafts news → 
Fact/tone checks → 
Kernel queues for publish → 
Human approval → 
Published → Distributed
```

## 🚀 Deployment Topology

### Production
```
Domain: hedgeco.net
├── Frontend: Vercel (US-East)
├── API: Railway (US-East)
├── Kernel: Railway (US-East)
├── Workers: Railway ×3 (US-East)
├── Database: Neon (US-East)
└── Redis: Upstash (US-East)
```

### Staging
```
Domain: staging.hedgeco.net
├── Same topology, separate databases
└── Limited scale, test data
```

## 📈 Scaling Strategy

### Phase 1: MVP (0-1k users)
- Single region (US-East)
- Basic monitoring
- Manual backups

### Phase 2: Growth (1k-10k users)
- Add EU replication
- Automated alerts
- Daily backups

### Phase 3: Scale (10k+ users)
- Multi-region
- Advanced monitoring
- Point-in-time recovery

## 🛡️ Compliance & Audit

### Required Features
- [x] Audit logging (all actions)
- [x] Job replay/debug capability
- [x] Evidence collection
- [x] Human approval gates
- [x] Rate limiting
- [x] Data retention policies

### Financial Compliance
- CAN-SPAM (email)
- GDPR (EU users)
- Financial data encryption
- Access logging

## 💰 Cost Optimization

### AI Costs
- **80%**: Cheap models (classification, summarization)
- **15%**: Mid models (support, drafting)
- **5%**: Premium models (complex tasks, compliance)

### Infrastructure
- **Database**: Neon serverless (pay per query)
- **Redis**: Upstash pay-per-request
- **Compute**: Railway auto-scaling
- **Storage**: Cloudflare R2 (cheap egress)

## 🎪 Team Structure (Mystery Inc.)

### 🐕 Scooby (Project Lead)
- Overall architecture
- Kernel design
- Security/compliance
- Team coordination

### 🧣 Shaggy (Backend)
- Node.js services
- PostgreSQL schema
- tRPC/Hono APIs
- Queue systems

### 🧡 Daphne (Frontend)
- Next.js 14 app
- Tailwind UI
- User experience
- Design system

### 🤓 Velma (AI/Data)
- Embeddings/RAG
- Model routing
- Recommendations
- Data pipelines

### 🧢 Fred (QA/DevOps)
- Testing (Playwright)
- CI/CD pipelines
- Monitoring/alerts
- Deployment

## 📅 Implementation Timeline

### Sprint 1 (2 weeks) ✅
- [x] Prisma schema
- [x] Auth system
- [x] 8 core pages
- [x] TypeScript fixes

### Sprint 2 (3 weeks) 🚧
- [ ] Kernel deployment
- [ ] Approval dashboard
- [ ] tRPC API integration
- [ ] Email system fixes

### Sprint 3 (3 weeks)
- [ ] Ticketing MVP
- [ ] News pipeline
- [ ] AI search
- [ ] Member onboarding

### Sprint 4-10 (24 weeks)
- [ ] Full feature parity
- [ ] Performance optimization
- [ ] Compliance certification
- [ ] Launch preparation

## 🚨 Risk Mitigation

### Technical Risks
1. **Database migration**: Incremental rollout, dual-write
2. **Email delivery**: Multiple providers, fallbacks
3. **AI hallucinations**: Human review, confidence scores
4. **Queue backlog**: Auto-scaling, priority queues

### Business Risks
1. **Regulatory changes**: Modular compliance layer
2. **User adoption**: Gradual feature rollout
3. **Cost overruns**: Usage monitoring, budgets
4. **Team turnover**: Documentation, knowledge sharing

## 🎯 Success Metrics

### Technical
- Uptime: 99.9%
- API latency: < 200ms p95
- Email deliverability: > 95%
- Job processing: < 5s p95

### Business
- User growth: 20% MoM
- Member activation: > 60%
- Support response: < 4 hours
- Cost per user: < $2/month

## 🔗 Resources

### Documentation
- `/DEPLOYMENT.md` - Deployment guide
- `/apps/kernel/README.md` - Kernel docs
- `/apps/web/README.md` - Frontend docs

### Scripts
- `./setup-upstash.sh` - Redis setup
- `./test-kernel.sh` - Local testing
- `./deploy-all.sh` - Full deployment

### Monitoring
- Railway: Service metrics
- Upstash: Redis metrics
- Neon: Database metrics
- Vercel: Frontend analytics

## 🏁 Getting Started

1. **Set up infrastructure**: `./setup-upstash.sh`
2. **Test locally**: `./test-kernel.sh`
3. **Deploy**: Follow `DEPLOYMENT.md`
4. **Configure agents**: Generate API keys
5. **Monitor**: Set up alerts

## 📞 Support

### Emergency Contacts
- Infrastructure: Railway Support
- Database: Neon Support
- Redis: Upstash Support
- Email: Resend Support

### Internal Escalation
1. Automated alerts
2. On-call engineer
3. Team lead
4. External support

---

*Last updated: 2026-02-18*
*Architecture version: 2.0*
*Status: Ready for deployment*