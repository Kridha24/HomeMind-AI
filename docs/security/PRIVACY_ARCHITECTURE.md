# Privacy Architecture & Data Minimization

## 1. Principles

1. **Data Minimization:** Only collect data strictly required to deliver household finance insights.
2. **On-Device First:** Whenever possible, SMS financial parsing occurs on the client device (Android Capacitor app).
3. **No Credential Exposure:** Bank credentials, PINs, CVVs, passwords, and OTPs are never stored or logged.
4. **Tenant Isolation:** All household data is cryptographically or relationally isolated with strict tenant checks on every query.

---

## 2. Android SMS Privacy & Processing Flow

The Android application requests `READ_SMS` permission exclusively to detect financial transactions:

```
Incoming Bank SMS
        │
        ▼ (On Android Device)
SMS Privacy Filter (`privacyFilter.ts`)
        ├── Checks: Is this a login OTP, password, personal message, or promo?
        │     └── YES -> REJECT IMMEDIATELY. Message discarded from memory.
        └── NO  -> Candidate Financial Transaction
                 │
                 ▼
Multi-Bank Parser Engine (HDFC / ICICI / SBI / Axis / UPI)
        ├── Extracts: Amount, Merchant, Direction, Reference, Account Last 4
        └── Scrub: Any non-transactional personal text discarded
                 │
                 ▼
Payload Sent to API (`/api/v1/transactions/import-sms`)
        └── Only structured financial metadata transmitted (amount, merchant, category, date)
```

Raw SMS bodies are **NEVER stored in the PostgreSQL database**. Only the normalized metadata and a cryptographic deduplication fingerprint (`sourceHash`) are persisted.

---

## 3. Log & Telemetry Privacy Guardrails

1. **Centralized Redaction in Logger:**
   `packages/observability/src/logger.ts` recursively sanitizes all log inputs for keys matching:
   `authorization`, `cookie`, `set-cookie`, `password`, `otp`, `token`, `secret`, `bankaccount`, `rawsms`.
2. **Telemetry Sanitization:**
   `packages/observability/src/tracing.ts` masks bearer tokens, JWT strings, and bank account numbers (`...1234`).
3. **Redis Rate Limit Keys:**
   Mobile phone numbers and email addresses are hashed via HMAC-SHA256 (`hashIdentity`) before being used in Redis rate limiter keys. Raw telephone numbers never appear in Redis key namespaces.
