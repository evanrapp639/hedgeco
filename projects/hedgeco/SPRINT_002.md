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
- [x] Set up tRPC with Next.js App Router
- [x] Create fund router (list, get, search, create, update)
- [x] Create user router (profile, watchlist, saved searches)
- [ ] Create stats router (calculate fund statistics)
- [x] Add proper error handling and validation

### Frontend Integration
- [x] Install and configure @tanstack/react-query
- [x] Create tRPC client hooks
- [x] Connect funds page to real API
- [ ] Connect fund detail page to real API
- [x] Wire up auth forms to API

### Data Layer
- [ ] Implement fund statistics calculation
- [x] Add fund search with filters
- [x] Set up fund watchlist functionality (API ready)

---

## 📝 Notes

Sprint 1 delivered a fully functional UI with mock data. Sprint 2 connects it to real data.
