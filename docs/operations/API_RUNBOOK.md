# API Operations Runbook

## 1. High Error Rate (5xx Spike)

### Symptoms:
- Alert: `APIHighErrorRate` firing (5xx errors $> 2\%$).
- Users experiencing 500/503 errors on web or mobile app.

### Verification:
```bash
# 1. Check pod status
kubectl get pods -n homemind-prod -l app.kubernetes.io/name=homemind-api

# 2. View recent API error logs
kubectl logs -n homemind-prod -l app.kubernetes.io/name=homemind-api --tail=100 | jq 'select(.level=="error")'

# 3. Check readiness probe output
curl -s http://localhost:5001/health/ready
```

### Mitigation:
1. **If Database Down:** Check PostgreSQL connectivity (`DATABASE_RUNBOOK.md`).
2. **If Bad Deployment:** Rollback immediately:
   ```bash
   kubectl rollout undo deployment/homemind-api -n homemind-prod
   ```
3. **If Redis Outage:** Verify API is operating in degraded mode (`mode: degraded`). The API should still allow basic transactions to persist via Outbox.
4. **If Dependency Failure:** Enable Maintenance Mode write protection:
   ```bash
   kubectl set env deployment/homemind-api -n homemind-prod FLAG_MAINTENANCEMODE=true
   ```

---

## 2. High Request Latency (p95 > 500ms)

### Symptoms:
- Alert: `APIHighLatencyP95` firing.
- Dashboard queries taking $> 1\text{s}$.

### Verification:
1. Query Prometheus:
   ```promql
   histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
   ```
2. Identify slow routes (e.g. `/api/v1/dashboard/summary` vs `/api/v1/transactions`).

### Mitigation:
1. **Cache Contention:** Check if Redis cache is missing or keys are expiring:
   ```promql
   rate(redis_cache_misses_total[5m]) / (rate(redis_cache_hits_total[5m]) + rate(redis_cache_misses_total[5m]))
   ```
2. **Database Slow Queries:** Check `db_query_duration_seconds` and examine slow query logs (`[SlowQuery]`).
3. **Scale API Replicas:** If CPU/Memory is saturated:
   ```bash
   kubectl scale deployment/homemind-api -n homemind-prod --replicas=6
   ```

---

## 3. Rate Limit / OTP Flooding Abuse

### Symptoms:
- Alert: `OTPAbuseDetected` or sudden spike in 429 responses.

### Verification:
```bash
kubectl logs -n homemind-prod -l app.kubernetes.io/name=homemind-api | grep -i "RateLimiter"
```

### Mitigation:
1. Identify offending IP block or destination pattern.
2. Add IP block to Ingress or Cloud WAF (Cloudflare / AWS WAF).
3. The multi-layer OTP protection engine automatically applies:
   - 60s cooldown per phone
   - 5 requests / 15m limit per phone
   - 20 requests / 24h daily cap
   - 5 attempts max verify lockout
