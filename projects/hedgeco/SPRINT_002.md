# Sprint 2: API & Data Layer
**Started:** 2026-02-16
**Goal:** tRPC API, connect frontend to backend, fund data endpoints

---

## 🎯 Sprint Objectives

1. **tRPC Setup** — Type-safe API layer between frontend and backend
2. **Fund Endpoints** — List, search, filter, get fund details
3. **Auth Integration** — Connect login/register forms to API
4. **Data Fetching** — React Query for frontend data management
5. **Fund Statistics** — Calculate and display fund metrics

---

## 📋 Task Breakdown

### Backend API
- [ ] Set up tRPC with Next.js App Router
- [ ] Create fund router (list, get, search)
- [ ] Create user router (profile, update)
- [ ] Create stats router (calculate fund statistics)
- [ ] Add proper error handling and validation

### Frontend Integration
- [ ] Install and configure @tanstack/react-query
- [ ] Create tRPC client hooks
- [ ] Connect funds page to real API
- [ ] Connect fund detail page to real API
- [ ] Wire up auth forms to API (currently working but need error handling)

### Data Layer
- [ ] Implement fund statistics calculation
- [ ] Add fund search with filters
- [ ] Set up fund watchlist functionality

---

## 📝 Notes

Sprint 1 delivered a fully functional UI with mock data. Sprint 2 connects it to real data.
