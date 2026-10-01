# Phase 2 — Baseline Assessment

**Date:** October 2, 2026  
**Repository:** [HomeMind-AI](https://github.com/Kridha24/HomeMind-AI.git)  
**Branch:** `feat/production-data-platform` (branched from `refactor/production-foundation`)  
**Previous State:** Phase 1 (Production Foundation) completed and verified across all workspaces.

---

## 1. Current Workspace & Build State

### Workspace Packages & Status
| Package | Path | Type | Build Status | Test Status |
| :--- | :--- | :--- | :--- | :--- |
| `web` | `apps/web` | React 18 + Vite + Tailwind | PASS (1.66s) | PASS |
| `api` | `apps/api` | Express + Prisma + TypeScript | PASS | PASS (7 security tests) |
| `worker` | `apps/worker` | TypeScript Worker Daemon | PASS | PASS |
| `@homemind/shared` | `packages/shared` | Core Types, Money, Contracts | PASS | PASS |
| `@homemind/database`| `packages/database`| Prisma Client & Multi-Tenant Helpers | PASS | PASS |
| `@homemind/config` | `packages/config` | Centralized Environment Schema | PASS | PASS |
| `@homemind/validation`| `packages/validation`| Zod Schemas & Validators | PASS | PASS |
| `@homemind/observability`| `packages/observability`| Structured Logging & Metrics | PASS | PASS |

- **Turborepo Pipeline:** 8 packages building cleanly with zero TypeScript errors.
- **Node / Package Manager:** Node.js v20+, `pnpm` 12.8.1 with `onlyBuiltDependencies` configured.

---

## 2. API Endpoints Baseline

Existing API endpoints registered in `apps/api/src/routes/index.ts`:
- **Auth (Public):**
  - `POST /api/v1/auth/google` (Google GIS)
  - `POST /api/v1/auth/phone/request-otp` & `POST /api/v1/auth/phone/verify-otp`
  - `POST /api/v1/auth/email/request-otp` & `POST /api/v1/auth/email/verify-otp`
  - `POST /api/v1/auth/refresh` & `POST /api/v1/auth/logout`
- **Auth (Protected):**
  - `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `POST /api/v1/auth/logout-all`
- **Dashboard & Core Domains:**
  - `GET /api/v1/dashboard/summary` (synchronous 15-query aggregation without caching)
  - `GET`, `POST`, `PUT`, `DELETE` `/api/v1/income`
  - `GET`, `POST`, `PUT`, `DELETE` `/api/v1/expenses`
  - `GET`, `POST`, `PUT`, `DELETE`, `PUT /pay` `/api/v1/bills`
  - `GET`, `POST`, `PUT`, `DELETE` `/api/v1/inventory`
  - `GET`, `POST` `/api/v1/appliances`
  - `GET`, `POST`, `PUT` `/api/v1/medicines`
  - `GET`, `POST`, `PUT`, `DELETE` `/api/v1/tasks`
  - `GET`, `PUT`, `POST` `/api/v1/family/*`
  - `POST` `/api/v1/assistant/*` & legacy `/api/v1/ai/*`
  - `GET`, `PUT` `/api/v1/notifications`
  - `GET` `/api/v1/transactions` (SMS import, stats, list, update, delete)

---

## 3. Worker State Baseline

- `apps/worker` exists as a standalone service with basic shutdown signal handling.
- Basic interfaces exist for `BaseJob` and `JobProcessor`.
- No actual BullMQ worker loop or Redis connection is active yet.
- Jobs are executed synchronously in the API process instead of being dispatched to the worker.

---

## 4. Redis & Queue State Baseline

- **Redis:** Not yet connected in application code. No `ioredis` or `bullmq` installed in workspace packages.
- **Queues:** No active queue producers or consumers.
- **Rate Limiting:** In-memory `express-rate-limit` currently used for auth, OTP, and SMS import.

---

## 5. Database State Baseline

- **ORM:** Prisma 5.22.0.
- **Provider:** SQLite for local fast tests/development (`dev.db`), PostgreSQL 15 for Docker and production.
- **Models:**
  - `User`, `RefreshToken`, `OTPVerification`, `Household`, `DashboardConfig`
  - `ExpenseCategory`, `Expense`, `Income`, `Budget`, `Transaction`
  - `BillCategory`, `Bill`, `GroceryItem`, `InventoryHistory`, `Appliance`, `MaintenanceLog`
  - `Medicine`, `MedicineSchedule`, `Task`, `Notification`, `SustainabilityMetric`
  - `Setting`, `AIRecommendation`, `AIForecast`, `AIConversation`, `AIMemory`, `AIThread`, `AIMessage`, `AuditLog`
- **Missing Models for Phase 2:**
  - `OutboxEvent` (for reliable asynchronous event dispatching)
  - `IdempotencyRecord` (for durable financial operation deduplication and retry safety)

---

## 6. Identified Bottlenecks & Architectural Gaps

1. **Synchronous Controller Execution:**
   - Database writes (expenses, income, transactions) are coupled to synchronous downstream actions (audit logs, categorizations).
   - If downstream services or operations fail or take long, the client request blocks or transactions could be partially committed.
2. **Dashboard Query Overhead:**
   - `GET /api/v1/dashboard/summary` runs 15 database queries in parallel on every dashboard load without caching.
3. **No Transactional Outbox:**
   - Events are not durably persisted alongside database mutations in an atomic transaction.
4. **Idempotency Ephemeral:**
   - Financial SMS import only uses `sourceHash` unique constraint on `Transaction`, without durable generic HTTP request idempotency records (`Idempotency-Key` header support).
5. **No Decoupled Worker Processing:**
   - Workers are idle placeholders; heavy background work does not run through BullMQ.
6. **Rate Limiting Localized:**
   - Rate limiters use node in-memory stores, which does not scale across multiple API instances.

---

## 7. Phase 2 Target Outcomes

- Introduce `OutboxEvent` and `IdempotencyRecord` in Prisma schema.
- Modularize priority domains (`finance/transactions`, `finance/expenses`, `finance/income`, `bills`, `notifications`, `dashboard`).
- Implement Redis client infrastructure with graceful fallback when Redis is offline.
- Implement BullMQ queues (`transactions`, `notifications`, `ai`, `analytics`).
- Implement Outbox Dispatcher in `apps/worker` with bounded batching and claim locking.
- Implement Redis-backed Dashboard caching (`homemind:v1:dashboard:{householdId}`) with event-driven invalidation.
- Implement extensible SMS Bank/UPI Parser engine with safe synthetic test fixtures.
- Author comprehensive security, tenant isolation, and failure recovery tests.
