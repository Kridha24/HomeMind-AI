# Production Runtime Architecture & SRE Hardening

## 1. Overview

HomeMind Phase 3 establishes an enterprise-grade production runtime environment engineered for resilience, graceful degradation, and strict security controls.

---

## 2. Distributed Rate Limiting & Abuse Prevention

### Algorithm: Redis Sliding Window
We implement a Redis-backed sliding window rate limiter utilizing Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`) within an atomic pipeline.

### Privacy-Preserving Identity Hashing:
Identifiers that contain PII (such as mobile phone numbers or email addresses) are **NEVER stored in raw text in Redis keys**.
- An HMAC-SHA256 hash using `JWT_SECRET` as the salt creates irreversible key signatures:
  `homemind:v1:ratelimit:otp_send:5f4dcc3b5aa765d61d8327deb882cf99`

### Policy Matrix:

| Policy | Identity | Window | Max Requests | Behavior on Limit |
| :--- | :--- | :--- | :--- | :--- |
| `general` | IP hash | 15 min | 200 | 429 Too Many Requests |
| `login` | IP + Email hash | 15 min | 15 | 429 (Prevent credential stuffing) |
| `google_auth` | IP hash | 15 min | 20 | 429 |
| `otp_send_ip` | IP hash | 15 min | 10 | 429 (Mitigate SMS gateway flooding) |
| `otp_send_cooldown`| Hashed Phone | 60 sec | 1 | 429 (Enforce 60s cooldown) |
| `otp_send_target` | Hashed Phone | 15 min | 5 | 429 |
| `otp_send_daily` | Hashed Phone | 24 hrs | 20 | 429 (Prevent excessive SMS costs) |
| `otp_verify` | Hashed Phone | 15 min | 5 attempts | Lockout for 15 minutes |
| `tx_ingest` | Household ID / IP | 15 min | 120 | 429 |
| `ai_copilot` | User ID / IP | 15 min | 30 | 429 |

---

## 3. Redis Outage Behavior (Phase 3I)

When Redis is unavailable or undergoing network partition, HomeMind behaves deterministically without data corruption:

1. **Cache Layer:** Bypasses to PostgreSQL directly; serves from local in-memory fallback where available.
2. **Rate Limiting Layer:**
   - General API: Degrades to node-level memory sliding window (fail-open for general traffic).
   - Auth & OTP endpoints: Enforces node-level strict limits (fail-closed against brute force).
3. **Queue & Background Workers:**
   - BullMQ cannot process jobs without Redis.
   - Core API operations (e.g. creating expenses or ingesting transactions) **continue to succeed**, persisting data in PostgreSQL and appending events to the `OutboxEvent` table with `publishedAt: null`.
   - Worker processing pauses safely.
   - When Redis connectivity is restored, the Outbox Dispatcher detects the connection and flushes all pending events to BullMQ. **Zero events or financial updates are lost.**

---

## 4. Resilience: Circuit Breakers & Request Timeouts

### Circuit Breakers:
External integrations (AI models, SMS gateways, email providers) are wrapped in `CircuitBreaker`:
- **States:** `CLOSED` (normal operation), `OPEN` (tripped after 4-5 consecutive failures), `HALF_OPEN` (probes downstream health).
- **Reset Timeout:** 20 to 30 seconds before testing downstream recovery.
- **Fail Fast:** When the circuit is OPEN, calls fail fast immediately instead of consuming threads or waiting for timeouts.

### Request Timeouts:
- Standard API endpoints: 15,000ms hard timeout.
- AI Copilot & scanning endpoints: 30,000ms timeout.
- Requests exceeding these limits receive a clean `504 Gateway Timeout` rather than hanging client connections.

---

## 5. Security & Configuration Validation

1. **Production Secret Validation:**
   At startup (`server.ts`), `validateProductionSecrets()` executes. If critical secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`) are missing, shorter than 32 characters, or match dictionary defaults (e.g. `secret`, `123456`), the process terminates immediately with an explanatory error.
2. **Security Headers (Helmet & CSP):**
   - HSTS with `includeSubDomains` and `preload` enabled in production.
   - Strict Content Security Policy allowing only verified Google OAuth and Google Font assets.
   - Strict CORS: Wildcard `*` is forbidden for credentialed APIs in production; only explicit domain allowlists are permitted.
3. **Feature Flags & Maintenance Mode:**
   - Config-driven feature flags (`FLAG_NEWSMSPARSER`, `FLAG_AICATEGORIES`, `FLAG_NEWDASHBOARD`).
   - Global `maintenanceMode`: Returns `503 Service Unavailable` with `Retry-After: 300` for write requests while maintaining read access and health probes.
