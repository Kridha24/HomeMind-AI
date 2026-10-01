# HomeMind AI — Service Level Objectives (SLO) & Error Budget Policy

**Document Version:** 2.0.0  
**Status:** Approved  
**Author:** HomeMind Site Reliability Engineering (SRE) Team  
**Last Updated:** October 2026  

---

## 1. Terminology & Framework

- **Service Level Indicator (SLI):** A quantifiable metric measuring real-time service behavior (e.g. HTTP error rate, p95 latency).
- **Service Level Objective (SLO):** The targeted reliability goal agreed upon by product and engineering.
- **Service Level Agreement (SLA):** Formal contractual commitment to end users with financial/service credits upon violation.
- **Error Budget:** The permissible fraction of unreliability over a 30-day rolling measurement window ($100\% - \text{SLO}$).

---

## 2. Core Service Level Objectives (SLO Matrix)

| Service Dimension | Target SLO (30-Day Rolling) | Service Level Indicator (SLI) Formulation | Measurement Window |
| :--- | :--- | :--- | :--- |
| **API Availability** | **99.95%** | $\frac{\text{Successful Requests (2xx/3xx/4xx)}}{\text{Total Ingress Requests excluding } 429} \ge 99.95\%$ | Rolling 30 Days |
| **Core Read Latency** | **p95 < 120ms**<br/>**p99 < 300ms** | Duration of `GET /api/v1/expenses`, `/bills`, `/dashboard/summary` measured at reverse proxy. | Rolling 30 Days |
| **Transaction Write Latency** | **p95 < 180ms**<br/>**p99 < 450ms** | Duration of `POST /api/v1/expenses`, `/income`, `/transactions/sync`. | Rolling 30 Days |
| **SMS Ingestion Lag** | **99.0% < 5.0s** | Time elapsed between Android SMS submission and commit into ledger database. | Rolling 30 Days |
| **AI Copilot Streaming (TTFT)** | **p95 < 800ms** | Time-to-first-token on `/api/v1/ai/assistant/chat` SSE stream. | Rolling 30 Days |
| **WebSocket Connection Uptime** | **99.9%** | Unplanned disconnects due to server drops $< 0.1\%$ of active socket-hours. | Rolling 30 Days |

### Monthly Error Budget Allotments (30-Day Month = 43,200 Minutes)
- **99.95% Availability:** Maximum allowable downtime = **21.6 minutes / month**
- **0.05% Error Rate:** In a 10M request/month workload, maximum failed requests = **5,000 errors**

---

## 3. Burn Rate Alerting Multipliers

Alerting is driven by **multi-window multi-burn-rate** rules to eliminate false-positive noise while catching rapid outages immediately:

```mermaid
graph TD
    Monitor["Prometheus / Datadog Metric Stream"] --> BurnCalc["Compute Current Burn Rate"]
    
    BurnCalc -->|Burn Rate >= 14.4x (2% budget in 1h)| P1["P1 Critical Page (PagerDuty)<br/>On-call ack required < 5 min"]
    BurnCalc -->|Burn Rate >= 6.0x (5% budget in 6h)| P2["P2 High Alert (Slack/PagerDuty)<br/>On-call ack required < 15 min"]
    BurnCalc -->|Burn Rate >= 2.0x (10% budget in 36h)| P3["P3 Warning Ticket (Jira/Slack)<br/>Investigate within business day"]
    BurnCalc -->|Burn Rate < 1.0x (Budget Healthy)| Green["Normal Operation"]
```

### Alerting Conditions Matrix

| Alert Level | Burn Rate Multiplier | % Budget Consumed | Time Window | Notification Channel | Response SLA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - Critical** | **14.4x** | 2.0% in 1 hour | 1 Hour & 5 Min | PagerDuty Call + War Room | < 5 Minutes |
| **P2 - High** | **6.0x** | 5.0% in 6 hours | 6 Hours & 30 Min | PagerDuty + Slack `#alerts-prod` | < 15 Minutes |
| **P3 - Warning** | **2.0x** | 10.0% in 36 hours | 36 Hours & 2 Hours | Slack `#eng-reliability` | < 4 Hours |

---

## 4. Error Budget Policy & Enforcement

When a service consumes more than **100% of its rolling 30-day error budget**, the following automated governance takes effect:

1. **Feature Deployment Freeze:**
   - All non-emergency production deployments are paused immediately.
   - Ongoing feature branches are frozen from merging to `master`.
2. **Mandatory Reliability Sprints:**
   - 100% of sprint capacity is redirected to resolving root causes, optimizing database queries, fixing memory leaks, or strengthening test coverage.
3. **Budget Restoration Gate:**
   - Feature freezes are lifted only when the rolling error budget recovers to $> 20\%$ headroom and a formal Post-Incident Review (PIR) is completed.

---

## 5. Production PromQL SLI Queries

### 5.1. API Availability SLI
```promql
sum(rate(http_requests_total{status!~"5..|429"}[5m])) 
/ 
sum(rate(http_requests_total{status!~"429"}[5m]))
```

### 5.2. Transaction Sync Latency SLI (p95)
```promql
histogram_quantile(
  0.95, 
  sum(rate(http_request_duration_seconds_bucket{route="/api/v1/transactions/sync"}[5m])) by (le)
)
```

### 5.3. Worker Queue Ingestion Lag
```promql
bullmq_queue_latency_seconds{queue="sms-ingest-queue"}
```
