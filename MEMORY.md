# MEMORY.md — Long-Term Context

## About Evan
- Has a dog named Teddy (I'm Teddy 2.0, named after the dog)
- Timezone: Eastern (ET)
- Watches stock markets, publishes daily Twitter updates
- Building a website with Manus

## Active Projects

### 🏢 HedgeCo.Net Rebuild (MAJOR)
**Started:** 2026-02-12
**Status:** Discovery complete, ready for development sprint

**What it is:** 20+ year old PHP hedge fund database — one of the leading free alternative investment databases. Covers hedge funds, PE, VC, real estate, crypto, SPVs.

**The mission:** Complete rebuild with modern stack + AI-native features.

**Team (Mystery Inc.):**
- 🐕 Scooby (me) — Project Lead
- 🧣 Shaggy — Backend (Node.js, PostgreSQL, tRPC/Hono)
- 🧡 Daphne — Frontend (Next.js 14, Tailwind, shadcn)
- 🤓 Velma — AI/Data (embeddings, RAG, recommendations)
- 🧢 Fred — QA/DevOps (Playwright, CI/CD)

**Tech Stack:**
- Frontend: Next.js 14+, TypeScript, Tailwind, shadcn/ui
- Backend: Node.js, tRPC or Hono, Prisma ORM
- Database: PostgreSQL + pgvector
- AI: OpenAI GPT-4o, text-embedding-3-small
- Deploy: Vercel/Railway

**Project docs:** `/projects/hedgeco/`
- PROJECT.md — overview
- DISCOVERY.md — current site mapping
- ARCHITECTURE.md — proposed stack
- FRONTEND_SPEC.md, BACKEND_SPEC.md, AI_SPEC.md
- QA_PLAN.md, TEAM.md

**Credentials:** Received for investor, manager, admin accounts (staging.hedgeco.net)

**Timeline estimate:** 30-42 weeks

**Sprint 8:** ✅ COMPLETE (2026-02-17)
- Scheduled reports, email campaigns, bulk exports
- Customizable dashboard with drag-drop widgets
- Docker + CI/CD + health monitoring
- Deployed to Vercel: https://hedgeco.vercel.app

**Sprint 9:** In Progress (matching original site exactly)
- ✅ Email templates captured and analyzed (4 user types)
- ✅ Email system updated to match staging exactly (subjects, content, formatting)
- ⏳ Need to implement exact registration flow with admin approval
- ⏳ Match colors, logos, and sections to staging.hedgeco.net
- ⏳ Add SPV section, fix footer tabs, add Hedgecuation

**Email System Updates (2026-02-19):**
- **Service Provider Template**: Subject "HedgeCo.Net - Service Provider Listing", phone +1 (561) 835-8690 for immediate confirmation
- **Investor Template**: Subject "Investor Welcome to HedgeCo.Net", fixed {{firstName}} bug
- **Fund Manager Template**: Subject "Manager Welcome to HedgeCo.Net DD-MM-YYYY", fixed {{firstName}} bug
- **News Member Template**: Subject "News Member", simple activation flow
- Registration flow already implemented with admin notifications to support@hedgeco.net

---

## Preferences & Notes
- (Add as I learn them)

---

*Last updated: 2026-02-19*
