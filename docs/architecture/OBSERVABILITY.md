# Observability Architecture & Production Telemetry

## 1. Overview & Principles

HomeMind's Phase 3 observability architecture provides deep, vendor-neutral visibility across distributed components without sacrificing tenant privacy or leaking credentials.

The system is built on three core pillars:
1. **OpenTelemetry Distributed Tracing:** Full request lifecycle tracing with W3C Trace Context propagation.
2. **Prometheus Metrics:** Low-overhead, bounded-cardinality counters, gauges, and histograms.
3. **Structured JSON Logging:** Automated recursive redaction for sensitive fields.

---

## 2. Distributed Trace Flow

A transaction is traced end-to-end as follows:

```
Android / Web Client
        │
        ▼ (HTTP request with optional traceparent)
   HTTP Span (tracingMiddleware)
        │
        ▼
Transaction Service (transaction.service.ts)
        │
        ▼
PostgreSQL Transaction ($transaction)
        ├── Transaction row inserted
        └── Outbox row inserted (captures active traceId, spanId)
                 │
                 ▼
          Dispatcher Span (OutboxDispatcher.dispatchBatch)
                 │
                 ▼
             BullMQ Job (job.data carries traceId, spanId, eventId, jobId)
                 │
                 ▼
             Worker Span (AIWorker / NotificationWorker)
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
   AI Category         Notification
```

### Trace Correlation Context:
Every log, span, and event carries correlated IDs:
- `traceId`: 128-bit hex string (32 characters)
- `spanId`: 64-bit hex string (16 characters)
- `requestId`: UUID per inbound HTTP request
- `eventId`: UUID per domain outbox event
- `jobId`: Identifier for background BullMQ job

Client-provided tracing headers (`traceparent`) are validated before propagation; malformed headers are rejected and a new root trace is generated.

---

## 3. Telemetry Privacy & Attribute Sanitization

Under no circumstances may sensitive PII or credentials enter the telemetry stream. The centralized sanitizer (`packages/observability/src/tracing.ts`) filters all span attributes and events:

### Prohibited in Telemetry:
- JWTs and refresh tokens (`[REDACTED_TOKEN]`)
- One-Time Passwords (OTPs) and password hashes (`[REDACTED_TELEMETRY]`)
- Full SMS bodies (truncated and sanitized)
- Bank account numbers (masked to last 4 digits: `...1234`)
- Authorization headers and cookies
- Cloud provider and AI API keys

---

## 4. Prometheus Metrics Specification

All metrics are exposed at `GET /metrics` in Prometheus text exposition format (version 0.0.4).

### Cardinality Enforcement:
Prometheus labels are strictly bounded to prevent memory saturation. High-cardinality identifiers (e.g. `userId`, `householdId`, `transactionId`, `requestId`) are strictly forbidden in metric labels.

Allowed labels:
- `service`: `homemind-api`, `homemind-worker`
- `method`: `GET`, `POST`, `PUT`, `DELETE`
- `route`: Route template (e.g. `/api/v1/transactions`, not `/transactions/123`)
- `status_code`: `200`, `201`, `400`, `401`, `429`, `500`
- `queue`: `homemind:ai`, `homemind:notifications`, `homemind:analytics`
- `event_type`: Event category name

### Key Metric Catalog:

| Metric Name | Type | Description |
| :--- | :--- | :--- |
| `http_requests_total` | Counter | Total HTTP requests by service, method, route, status |
| `http_request_duration_seconds` | Histogram | Latency distribution of HTTP endpoints |
| `http_errors_total` | Counter | Errors categorized by server_error vs client_error |
| `db_query_duration_seconds` | Histogram | PostgreSQL query execution latency |
| `redis_cache_hits_total` | Counter | Cache hit count in Redis layer |
| `redis_cache_misses_total` | Counter | Cache miss count requiring DB query |
| `redis_errors_total` | Counter | Connection / command errors in Redis |
| `bullmq_jobs_started_total` | Counter | Worker job executions initiated |
| `bullmq_jobs_completed_total` | Counter | Successfully processed background jobs |
| `bullmq_jobs_failed_total` | Counter | Failed background jobs |
| `bullmq_job_duration_seconds` | Histogram | Background job execution latency |
| `bullmq_queue_depth` | Gauge | Active, waiting, and delayed jobs in queues |
| `outbox_pending_count` | Gauge | Number of unpublished outbox events in DB |
| `outbox_oldest_event_age_seconds`| Gauge | Age in seconds of the oldest pending event |
| `outbox_dispatch_failures_total` | Counter | Outbox dispatcher publication errors |
| `transaction_ingestion_total` | Counter | Ingested transactions count |
| `transaction_duplicate_total` | Counter | Duplicate transactions blocked by idempotency |
| `sms_parser_failures_total` | Counter | Bank SMS regex parsing failures |
| `ai_jobs_failed_total` | Counter | Async AI categorization failures |
| `notification_jobs_failed_total` | Counter | Push / In-app notification delivery failures |

---

## 5. Metrics Endpoint Protection

The `/metrics` endpoint is protected:
1. In production, requests require `Authorization: Bearer <METRICS_AUTH_TOKEN>` or network loopback (`127.0.0.1`).
2. Kubernetes Ingress blocks direct public internet access to `/metrics` (returns 403 Forbidden).
3. Prometheus scraping occurs over private pod network (`homemind-api:5001/metrics`).
