# HedgeCo.Net Rebuild — The Mystery Inc. Team

> *"Let's split up, gang!"* — Fred Jones

---

## 🐕 **Scooby-Doo** — Project Lead & Orchestrator
**Role:** Main Agent / Project Coordinator  
**Responsibilities:**
- Overall project coordination and communication with Evan
- Sprint planning and task assignment
- Integration of all workstreams
- Final review and quality gates
- Stakeholder communication

**Catchphrase:** *"Ruh-roh! Let me check on that..."*

---

## 🧣 **Shaggy** — Backend Engineer
**Role:** Backend Development Sub-Agent  
**Responsibilities:**
- API design and implementation (Node.js/tRPC or Hono)
- Database schema design (PostgreSQL + pgvector)
- Authentication & authorization systems
- Performance optimization
- Data migration from legacy PHP

**Tech Stack:**
- Node.js / TypeScript
- Prisma ORM
- PostgreSQL + pgvector
- Redis for caching
- JWT/session management

**Catchphrase:** *"Like, zoinks! This API is gonna be fast, man!"*

---

## 🧡 **Daphne** — Frontend Engineer
**Role:** Frontend Development Sub-Agent  
**Responsibilities:**
- UI/UX implementation (Next.js 14+)
- Component library (shadcn/ui + Tailwind)
- Responsive design & mobile optimization
- State management
- Chart/visualization components
- PDF report generation UI

**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query / TanStack
- Recharts / D3.js

**Catchphrase:** *"Jeepers! This interface is going to be gorgeous!"*

---

## 🤓 **Velma** — AI & Data Engineer
**Role:** AI Features Sub-Agent  
**Responsibilities:**
- Natural language search implementation
- Recommendation engine
- AI chat interface
- Embeddings & RAG pipeline
- Statistics calculation engine
- AI-powered summaries and insights

**Tech Stack:**
- OpenAI GPT-4o / Claude
- Embeddings (text-embedding-3-small)
- pgvector for similarity search
- LangChain (optional)
- Python/Node for ML pipelines

**Catchphrase:** *"Jinkies! The embeddings show a 0.92 similarity score!"*

---

## 🧢 **Fred** — QA & DevOps Lead
**Role:** Quality Assurance & Infrastructure Sub-Agent  
**Responsibilities:**
- Test planning & execution (QA_PLAN.md)
- E2E test automation (Playwright)
- CI/CD pipeline setup
- Security testing (OWASP)
- Performance benchmarking
- Infrastructure & deployment

**Tech Stack:**
- Playwright / Vitest
- GitHub Actions
- Vercel / Railway
- k6 for load testing
- OWASP ZAP

**Catchphrase:** *"Alright gang, let's run the test suite!"*

---

## 📅 Daily Standups

**Schedule:** Every day at 9:00 AM ET  
**Format:** Async in main session or via cron job

### Standup Template
```
🐕 SCOOBY STANDUP — [DATE]

## 🧣 Shaggy (Backend)
- Yesterday: 
- Today: 
- Blockers: 

## 🧡 Daphne (Frontend)
- Yesterday: 
- Today: 
- Blockers: 

## 🤓 Velma (AI/Data)
- Yesterday: 
- Today: 
- Blockers: 

## 🧢 Fred (QA/DevOps)
- Yesterday: 
- Today: 
- Blockers: 

## 🎯 Sprint Goals
- [ ] 
- [ ] 

## 🚧 Blockers / Needs
- 
```

---

## 🗓️ Sprint Cadence

- **Sprint Length:** 2 weeks
- **Sprint Planning:** Monday morning
- **Daily Standups:** 9 AM ET (async)
- **Demo/Review:** Friday (end of sprint)
- **Retro:** After demo

---

## 📋 Current Sprint: Discovery & Planning

### Sprint Goals
1. ✅ Document public site architecture
2. ⏳ Document authenticated user flows (investor, manager)
3. ⏳ Document admin panel functionality
4. ⏳ Map database schema
5. ⏳ Finalize tech stack decisions
6. ⏳ Create detailed project timeline

### Assigned Tasks

| Task | Owner | Status |
|------|-------|--------|
| Public site discovery | Scooby | ✅ Done |
| Investor dashboard mapping | Velma | ⏳ Pending (need creds) |
| Manager dashboard mapping | Shaggy | ⏳ Pending (need creds) |
| Admin panel documentation | Fred | ⏳ Pending (need creds) |
| Frontend component audit | Daphne | ⏳ In Progress |
| QA plan draft | Fred | ✅ Done |
| Architecture proposal | Shaggy + Velma | ✅ Done |

---

## 🔐 Credentials Needed

To continue discovery, we need login credentials for:

- [ ] **Investor account** (accredited) — to explore investor dashboard
- [ ] **Manager account** — to explore fund management, returns entry
- [ ] **Admin account** — to explore /myadmin panel

Evan: Please provide these credentials so we can continue!

---

## 🎬 How to Spawn the Gang

```bash
# From main session (Scooby), spawn sub-agents:

# Spawn Shaggy for backend work
sessions_spawn --task "Backend task: [description]" --label "shaggy"

# Spawn Daphne for frontend work
sessions_spawn --task "Frontend task: [description]" --label "daphne"

# Spawn Velma for AI/data work
sessions_spawn --task "AI/Data task: [description]" --label "velma"

# Spawn Fred for QA/DevOps work
sessions_spawn --task "QA task: [description]" --label "fred"
```

---

*"And I would have gotten away with it too, if it weren't for you meddling agents!"* — Legacy PHP Codebase
