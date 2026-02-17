# Sprint 6: Real-time, Notifications & Mobile
**Started:** 2026-02-17
**Goal:** Real-time updates, notification system, mobile optimization, data migration

---

## 🎯 Sprint Objectives

1. **Real-time Updates** — WebSocket/SSE for live notifications
2. **Notification System** — In-app, email, push notifications
3. **Mobile Optimization** — PWA, responsive polish, touch interactions
4. **Data Migration Scripts** — Import from legacy PHP database
5. **Document Upload** — Fund document management
6. **Saved Searches** — Store and alert on search criteria

---

## 📋 Task Assignments

### 🧣 Shaggy — Notifications & Migration
- [ ] Notification router (create, list, mark read, preferences)
- [ ] Notification model in Prisma (type, status, metadata)
- [ ] Email notification templates (new message, fund update, inquiry)
- [ ] Legacy data migration scripts (funds, users, providers)
- [ ] Document upload router (presigned URLs, metadata)

### 🧡 Daphne — Mobile & Notifications UI
- [ ] Notification dropdown/panel in header
- [ ] Notification settings page
- [ ] PWA manifest.json and service worker
- [ ] Mobile navigation (hamburger menu, bottom nav)
- [ ] Touch-friendly fund cards with swipe actions
- [ ] Pull-to-refresh on lists

### 🤓 Velma — Real-time & Saved Searches
- [ ] Server-Sent Events endpoint for notifications
- [ ] Saved search model and CRUD
- [ ] Saved search alert system (notify on new matches)
- [ ] Real-time fund update broadcasting
- [ ] Background job for search monitoring

### 🧢 Fred — Mobile Polish & Tests
- [ ] Responsive audit across all pages
- [ ] Mobile-specific E2E tests
- [ ] Lighthouse mobile audit
- [ ] Touch gesture testing
- [ ] Offline mode basics
- [ ] Migration data validation tests
