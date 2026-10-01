# Operational Runbook: Redis Infrastructure & Cache Management

**Target Audience:** SREs, Backend Engineers, Operations  
**Scope:** Redis 7.0+, Distributed Caching, Graceful Degradation  
**Last Updated:** October 2, 2026

---

## 1. Quick Verification & Health Checks

### Check Redis Liveness & Ping
```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli ping
# Expected: PONG
```

### Check Memory Usage & Connected Clients
```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli info memory
docker compose -f docker-compose.dev.yml exec redis redis-cli info clients
```

### Inspect API Readiness Endpoint
```bash
curl -s http://localhost:5001/health/ready | jq .
# Expected output:
# {
#   "status": "ready",
#   "dependencies": {
#     "database": "up",
#     "redis": "up"
#   }
# }
```

---

## 2. Manual Cache Flush & Invalidation

### Invalidate a Specific Household Dashboard
```bash
# Invalidate household cache without restarting services:
docker compose exec redis redis-cli del "homemind:v1:dashboard:<HOUSEHOLD_UUID>"
```

### Clear All Dashboard Caches Safely (Scan & Del)
```bash
docker compose exec redis redis-cli --scan --pattern "homemind:v1:dashboard:*" | xargs -L 50 docker compose exec -T redis redis-cli del
```

> [!CAUTION]
> Never run `FLUSHALL` or `FLUSHDB` in production! BullMQ queues and rate limiter buckets share the Redis instance. Use pattern-based key deletion only.

---

## 3. Degradation Policy & Disaster Recovery

### What happens if Redis fails?
1. **API Behavior:** `RedisService` enters fallback mode. Cache GET returns `null` (cache miss), prompting the API to read fresh aggregates from PostgreSQL. Cache SET operations log a warning and return silently.
2. **Transaction Writes:** Financial transactions, expenses, incomes, and bills continue to save into PostgreSQL and OutboxEvent without interruption.
3. **Recovery Procedure:**
   ```bash
   docker compose restart redis
   ```
   Once Redis is healthy, `RedisService` automatically reconnects via exponential backoff, and the Outbox Dispatcher resumes publishing pending events.
