# HomeMind AI — High Level Design (HLD)

**Document Version:** 2.0.0  
**Status:** Approved Target Architecture  
**Author:** HomeMind Engineering & Architecture Team  
**Last Updated:** October 2026  

---

## 1. System Vision & Architectural Objectives

HomeMind AI is designed as a high-throughput, multi-tenant household operating system that unites personal finance, chore distribution, smart grocery replenishment, appliance monitoring, and autonomous financial SMS detection.

The target enterprise architecture evolves the system into a **modular Monorepo structure** (powered by Turborepo and pnpm workspaces), decoupling user-facing HTTP interactions from long-running background tasks, standardizing shared business logic into versioned packages, and containerizing infrastructure across cloud environments.

### Key Architectural Pillars
- **Zero-Trust Multi-Tenancy**: Guaranteed tenant boundary isolation keyed strictly on cryptographic `household_id`.
- **Event-Driven Asynchrony**: Offloading computationally expensive tasks (SMS ingestion bursts, OCR vision processing, recurring budget aggregations) to a dedicated worker pool via Redis BullMQ.
- **Strict Package Modularity**: DRY codebase with centralized validation, typed contracts, unified database models, and centralized telemetry.
- **Enterprise High Availability**: Horizontal scalability across API and worker instances with zero-downtime rolling deployments.

---

## 2. Target Monorepo Architecture Blueprint

```
HomeMind/
├── apps/
│   ├── web/                    # React 18 + Vite SPA & Android Capacitor App
│   ├── api/                    # Express + Node.js REST API & WebSocket Gateway
│   └── worker/                 # BullMQ Distributed Asynchronous Job Processor
│
├── packages/
│   ├── shared/                 # Common interfaces, DTOs, utilities, and constants
│   ├── database/               # Prisma client, migrations, seeders, and db extensions
│   ├── config/                 # Environment schemas, global configs, and feature flags
│   ├── validation/             # Shared Zod validation schemas for API & UI
│   └── observability/          # OpenTelemetry instrumentation, Winston logger, metrics
│
├── infra/
│   ├── docker/                 # Production multi-stage Dockerfiles & local compose files
│   ├── kubernetes/             # Helm charts, Kube manifests, ingress, and HPA policies
│   └── terraform/              # Cloud infrastructure provisioning (AWS/GCP, RDS, ElastiCache)
│
└── docs/                       # Architectural, operational, and performance blueprints
```

---

## 3. C4 Architecture Specification

### 3.1. Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - HomeMind AI

    Person(user, "Household Member", "Interacts via Web Browser or Android Mobile Application")
    Person_Ext(bank, "Banking / UPI Provider", "Sends financial SMS notifications to user device")

    System(homemind, "HomeMind AI Platform", "Multi-tenant household ledger, pantry manager, and AI Copilot")

    System_Ext(gemini, "Google Gemini AI", "LLM reasoning, context synthesis, and agentic workflows")
    System_Ext(twilio, "SMS & Notification Gateway", "Twilio / Fast2SMS for OTP & household alert dispatches")
    System_Ext(storage, "Cloud Object Storage", "S3 / GCS for receipt scans and user avatars")

    Rel(user, homemind, "Manages expenses, views reports, chats with copilot", "HTTPS / WSS")
    Rel(bank, user, "Delivers transaction SMS alerts", "Cellular SMS")
    Rel(homemind, gemini, "Executes natural language reasoning & tool execution", "gRPC / HTTPS")
    Rel(homemind, twilio, "Triggers SMS OTPs and push alerts", "REST API")
    Rel(homemind, storage, "Stores and retrieves encrypted receipt images", "HTTPS / S3 API")
```

---

### 3.2. Level 2: Container Diagram

```mermaid
graph TB
    subgraph Clients ["Client Applications"]
        WebSPA["Web Client (apps/web)<br/>React 18 + Vite"]
        AndroidCap["Android App (apps/web)<br/>Capacitor 7 + SMS Receiver"]
    end

    subgraph Edge ["Edge & Security"]
        Cloudflare["Cloudflare / Ingress Controller<br/>SSL Termination, DDoS, WAF"]
    end

    subgraph AppTier ["Application Tier"]
        API["API Gateway & Core Service (apps/api)<br/>Node.js / Express :5001"]
        Worker["Distributed Worker Pool (apps/worker)<br/>Node.js / BullMQ"]
        AIService["AI Vision Service (ai-service)<br/>Python / FastAPI :8000"]
    end

    subgraph Messaging ["Event Broker & Cache"]
        RedisQueue[("Redis Cluster / Valkey<br/>BullMQ Queues & Fast Session Cache")]
    end

    subgraph DataTier ["Data & Persistence Tier"]
        PgBouncer["PgBouncer<br/>Connection Pooler"]
        PostgresPrimary[("PostgreSQL Primary (RDS)<br/>Multi-Tenant Relational Store")]
        PostgresReplica[("PostgreSQL Read Replica<br/>Reporting & Analytics Queries")]
        ObjectStore[("S3 / Cloud Storage<br/>Encrypted Receipts & Assets")]
    end

    AndroidCap -->|TLS 1.3 REST| Cloudflare
    WebSPA -->|TLS 1.3 REST & WSS| Cloudflare
    Cloudflare --> API

    API -->|Enqueue Jobs| RedisQueue
    RedisQueue -->|Pull Jobs| Worker
    Worker -->|Inference Requests| AIService
    Worker -->|Receipt Uploads| ObjectStore

    API -->|Connection Pool| PgBouncer
    Worker -->|Connection Pool| PgBouncer
    PgBouncer -->|Write & Read| PostgresPrimary
    PostgresPrimary -.->|Async Streaming Replication| PostgresReplica
    API -.->|Read Heavy Queries| PostgresReplica
```

---

## 4. Subsystems & Data Ingestion Pipelines

### 4.1. Real-Time Bank & UPI SMS Transaction Ingestion

The SMS pipeline provides autonomous financial accounting with guaranteed idempotency:

```mermaid
sequenceDiagram
    autonumber
    actor Android as Android Device
    participant API as apps/api
    participant Redis as Redis / BullMQ
    participant Worker as apps/worker
    participant DB as PostgreSQL
    participant WS as WebSocket Hub

    Android->>Android: Financial SMS Intercepted by BroadcastReceiver
    Android->>API: POST /api/v1/transactions/sync (Batch payload + HMAC)
    API->>API: Validate Token & Generate Batch Idempotency Key
    API->>Redis: Enqueue 'sms-parse-batch' (Priority High)
    API-->>Android: 202 Accepted (Batch Job ID)

    Worker->>Redis: Dequeue 'sms-parse-batch'
    Worker->>Worker: Run Regex Regex & Bank Header Lexer
    Worker->>Worker: Extract: Amount, Type, Merchant, Balance, RefNo
    Worker->>DB: Check Duplicate (hash: ref_no + amount + timestamp)
    
    alt Is Duplicate
        Worker->>DB: Log Audit Conflict & Skip
    else New Transaction
        Worker->>DB: INSERT into Transaction (Status: AUTO_IMPORTED / PENDING_REVIEW)
        Worker->>DB: UPDATE Budget & Balance Accumulators
        Worker->>Redis: Publish 'household.tx.created'
        Redis->>API: Subscriber Notification
        API->>WS: Push Socket.IO event to household channel
        WS-->>Android: Real-time UI Update (Sound & Ledger Refresh)
    end
```

### 4.2. Receipt & Pantry Vision OCR Pipeline
1. Client uploads an image of an invoice, grocery receipt, or pantry shelf.
2. `apps/api` generates a pre-signed S3 upload URL.
3. Once uploaded, `apps/api` enqueues an `ocr-receipt-job` in Redis.
4. `apps/worker` retrieves the image, invokes the FastAPI Vision microservice, normalizes line items and currency values, and upserts parsed inventory items directly into `GroceryItem` records.

### 4.3. AI Copilot & Context Synthesis Engine
- The Copilot coordinates user prompts with an in-memory knowledge retrieval layer.
- Relevant household records (recent transactions, active bills, budget limits, user chores) are compiled into structured JSON contexts.
- Multi-turn conversational memories are stored under `AIMemory` and `AIThread` tables for personalized, context-aware household recommendations.

---

## 5. Security & Isolation Architecture

1. **Authentication Token Lifecycle**:
   - Access Token: Short-lived HMAC-SHA256 JWT (15-minute expiry).
   - Refresh Token: Long-lived opaque string (7-day expiry) stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, tracked in the `RefreshToken` database table with device footprint fingerprints.
2. **Tenant Perimeter**:
   - Every internal service method signature requires `householdId: string` as the first argument.
   - Database queries utilize Prisma Client extensions that inject `where: { householdId }` automatically into all multi-tenant queries.
3. **Data Protection at Rest & In Transit**:
   - TLS 1.3 enforced across all ingress and inter-service communications.
   - PII fields (phone numbers, account references) encrypted using AES-256-GCM.

---

## 6. High Availability & Fault Tolerance Patterns

- **Circuit Breakers**: External integrations (Twilio, Fast2SMS, Gemini API) are wrapped with circuit breakers (opossum) to prevent cascading thread pool exhaustion.
- **Exponential Backoff with Jitter**: All worker jobs retry failed tasks up to 5 times before shunting them to a Dead-Letter Queue (DLQ).
- **Read/Write Splitting**: Read-heavy queries (historical analytics, yearly financial reports) target PostgreSQL read replicas, insulating the write-primary from resource contention.
- **Horizontal Pod Autoscaling (HPA)**: Kubernetes clusters scale `apps/api` based on CPU (>70%) and concurrent connections, and scale `apps/worker` based on Redis queue depth.
