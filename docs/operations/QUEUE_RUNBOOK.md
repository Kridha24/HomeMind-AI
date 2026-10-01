# Operational Runbook: Asynchronous Queues & Worker Management

**Target Audience:** Site Reliability Engineers, DevOps, On-Call Backend Engineers  
**Services:** `apps/worker`, `apps/api`, Redis BullMQ  
**Last Updated:** October 2, 2026

---

## 1. Quick Diagnostic Commands

### Check Worker Service Status
```bash
# Docker environment
docker compose -f docker-compose.dev.yml ps worker

# Inspect worker logs
docker compose -f docker-compose.dev.yml logs -f worker --tail 100
```

### Inspect Outbox Backlog Count
```sql
-- Query pending unpublished events
SELECT count(*), event_type 
FROM "OutboxEvent" 
WHERE "publishedAt" IS NULL 
GROUP BY event_type;

-- Oldest unpublished event age
SELECT id, "eventType", "createdAt", attempts, "lastError"
FROM "OutboxEvent"
WHERE "publishedAt" IS NULL
ORDER BY "createdAt" ASC
LIMIT 10;
```

---

## 2. Common Alert Scenarios & Remediation

### Alert: `HighOutboxBacklog` (Unpublished events > 1,000)
- **Likely Cause:** Redis connection failure, worker crash, or database locking delay.
- **Diagnostic:**
  1. Verify Redis health: `docker compose exec redis redis-cli ping`.
  2. Check worker process status: `docker compose ps worker`.
  3. Verify if worker is logging connection timeouts or unhandled rejections.
- **Remediation:**
  1. Restart Redis if unresponsive: `docker compose restart redis`.
  2. If worker crashed, restart worker: `docker compose restart worker`.
  3. The Outbox Dispatcher will automatically drain the backlog in batches of 50.

### Alert: `HighJobFailureRate` (DLQ count increasing)
- **Likely Cause:** Downstream AI endpoint error or schema mismatch in job payload.
- **Diagnostic:** Check worker failure logs:
  ```bash
  docker compose logs worker | grep -i "failed"
  ```
- **Remediation:**
  1. Check external AI provider endpoint availability.
  2. If the payload is malformed, identify the offending event type.
  3. Failed jobs are retained for 7 days in the BullMQ dead-letter set.

---

## 3. Worker Scaling & Concurrency Tuning

Adjust concurrency via environment variables in production:
```bash
TRANSACTION_WORKER_CONCURRENCY=10
NOTIFICATION_WORKER_CONCURRENCY=20
AI_WORKER_CONCURRENCY=4
ANALYTICS_WORKER_CONCURRENCY=5
OUTBOX_BATCH_SIZE=100
OUTBOX_POLL_INTERVAL_MS=2000
```

Restart worker instances with zero-downtime rolling restart (SIGTERM allows 500ms-2000ms for active jobs to finish before terminating).
