# Sprint 2: API & Data Layer
**Started:** 2026-02-16
**Goal:** tRPC API, connect frontend to backend, fund statistics

---

## 🎯 Sprint Objectives

1. **tRPC Setup** — Type-safe API layer between frontend and backend ✅
2. **Fund Endpoints** — List, search, filter, get fund details ✅
3. **Auth Integration** — Connect login/register forms to API ✅
4. **Data Fetching** — React Query for frontend data management ✅
5. **Fund Statistics** — Calculate and display fund metrics ✅

---

## 📋 Task Breakdown

### Backend API
- [x] Set up tRPC with Next.js App Router
- [x] Create fund router (list, get, search, create, update)
- [x] Create user router (profile, watchlist, saved searches)
- [x] Create stats router (calculate fund statistics)
- [x] Add proper error handling and validation

### Frontend Integration
- [x] Install and configure @tanstack/react-query
- [x] Create tRPC client hooks
- [x] Connect funds page to real API
- [x] Connect fund detail page to real API
- [x] Wire up auth forms to API

### Data Layer
- [x] Implement fund statistics calculation library
- [x] Add fund search with filters
- [x] Set up fund watchlist functionality (API ready)

### Statistics Components (2026-02-17)
- [x] StatsCard — Key metrics display (AUM, returns, Sharpe, volatility)
- [x] PerformanceChart — Cumulative returns line chart with period selector
- [x] ReturnTable — Monthly returns heat map grid
- [x] Statistics library (CAGR, volatility, Sharpe, Sortino, Beta, Alpha, drawdown)
- [x] 58 unit tests for statistics functions

---

## 📝 Commits

- `b93cadf` Sprint 2: Add tRPC API layer
- `fa2f07c` Connect funds page to tRPC
- `33cf4eb` Connect fund detail page to tRPC
- `f88dada` Connect landing page to tRPC API
- `7c4c5c2` Sprint 2: Add fund statistics - stats router, calculations library, UI components

---

## ✅ Sprint 2 COMPLETE

**Completed:** 2026-02-17
