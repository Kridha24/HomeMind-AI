# Phase 3 Baseline Assessment: Production Runtime & Observability

## Date: 2026-10-02
## Branch: feat/production-runtime-platform
## Status: BASELINE RECORDED

---

## 1. Initial State Inspection

Prior to starting Phase 3 implementation, the workspace was validated on clean commit state branched from `feat/production-data-platform`:
- **Workspace Tooling:** pnpm 12.8.1, Turborepo 2.11, TypeScript 5.3.3.
- **Packages:**
  - `@homemind/shared`: Domain types, event enums, money model.
  - `@homemind/database`: Prisma ORM client with `OutboxEvent` and `IdempotencyRecord` models.
  - `@homemind/config`: Centralized configuration.
  - `@homemind/validation`: Zod schemas.
  - `@homemind/observability`: Basic initial logger with partial sanitization.
- **Applications:**
  - `apps/api`: REST API with SQLite local database, in-memory rate limiting (`express-rate-limit`), and basic health checks.
  - `apps/worker`: BullMQ queue processor and outbox polling dispatcher.
  - `apps/web`: React 18 / Vite 5 dashboard SPA with Capacitor mobile sync.

---

## 2. Baseline Test Results

All quality gates passed before code modification:
- `pnpm install`: OK (resolved workspace dependencies cleanly)
- `pnpm typecheck`: OK (0 errors across 8 packages)
- `pnpm lint`: OK (all workspace packages passed)
- `pnpm test`: OK (28/28 tests passed: 7 security, 11 bank parsers, 10 phase2 async)
- `pnpm build`: OK (all apps and shared packages compiled cleanly)

---

## 3. Key Observations & Action Plan

1. **Observability:** Observability package lacks OpenTelemetry distributed tracing and W3C `traceparent` context propagation. Traces do not flow from HTTP entry -> Outbox -> BullMQ -> Worker.
2. **Metrics:** No Prometheus `/metrics` endpoint exists. Metrics need strict label cardinality guardrails.
3. **Rate Limiting:** Currently uses in-memory `express-rate-limit`. Needs replacement with distributed Redis sliding window with HMAC-SHA256 identity hashing.
4. **OTP Abuse:** Single-use cooldown exists but lacks multi-layered defense (per-IP limits, daily caps, verification lockout).
5. **Database Connections & Query Optimization:** Dashboard summary executes ~16 individual queries in parallel on cache miss. Needs consolidation to fewer round trips.
6. **Object Storage:** Direct storage of receipts/documents missing; requires cloud-neutral signed upload abstraction.
7. **CI & SRE:** CI needs real PostgreSQL and Redis service containers. Kubernetes manifests and SRE runbooks required for production readiness.
