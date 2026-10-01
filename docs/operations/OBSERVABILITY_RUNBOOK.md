# Observability & Monitoring Runbook

## 1. Prometheus Scrape Failures

### Symptoms:
- Alert: `TargetDown` in Prometheus for `homemind-api` job.
- Metric charts showing gaps in Grafana.

### Verification:
```bash
# 1. Test endpoint inside cluster
kubectl exec -it deployment/homemind-api -n homemind-prod -- curl -I http://localhost:5001/metrics

# 2. Check if METRICS_AUTH_TOKEN is required and properly configured on Prometheus scrape job
```

### Mitigation:
- Ensure Prometheus scraper includes bearer token header or scrapes from trusted loopback/pod IP.
- Verify API pods are not hitting CPU throttling or memory OOM limits.

---

## 2. Distributed Tracing Gaps

### Symptoms:
- Traces show missing spans between HTTP request and Worker job execution.

### Verification:
1. Verify `OutboxService.recordEvent` captured `traceId` and `spanId` in event envelope payload.
2. Check `OutboxDispatcher.routeAndPublish` forwarded `traceId` and `spanId` to BullMQ job data.
3. Check `AIWorker` / `NotificationWorker` extracted `traceId` from `job.data`.

### Resolution:
- If trace context is missing, verify `packages/observability` is imported and `tracer.startSpan()` is active during the operation.

---

## 3. High Metric Cardinality Alert

### Symptoms:
- Prometheus server memory usage increasing exponentially.

### Verification:
1. Run Prometheus query:
   ```promql
   topk(10, count by (__name__)({__name__=~"homemind_.*|http_.*"}))
   ```
2. Check if dynamic IDs (e.g. `userId` or `transactionId`) were accidentally added to label sets.

### Resolution:
- The centralized label validator (`packages/observability/src/metrics.ts`) strictly strips keys matching `userId`, `householdId`, `transactionId`, `requestId`, `jobId`, `eventId`, `email`, `phone`.
- Ensure new metrics use predefined bounded labels.
