# HomeMind AI — Production Capacity Plan & Infrastructure Sizing

**Document Version:** 2.0.0  
**Status:** Approved  
**Author:** HomeMind Infrastructure & SRE Team  
**Last Updated:** October 2026  

---

## 1. Workload Profiles & Growth Tiers

This capacity plan sizes compute, memory, database IOPS, cache capacity, and network throughput across three distinct growth phases:
- **Tier 1 (Launch / Early Growth):** 10,000 Monthly Active Households (MAH)
- **Tier 2 (Scale):** 100,000 Monthly Active Households (MAH)
- **Tier 3 (Enterprise Scale):** 1,000,000 Monthly Active Households (MAH)

### Household Usage Baseline Assumptions
- **Users per Household:** 2.5 average
- **Transactions logged/month:** 45 per household (30 via auto-SMS, 15 manual)
- **Daily App Visits:** 3 sessions/day per active user
- **API Requests per Session:** 8 HTTP requests + 1 persistent WebSocket connection
- **Receipt / Pantry Scans:** 4 OCR scans per household/month
- **AI Copilot Prompts:** 6 conversational queries per household/month

---

## 2. Traffic & Throughput Projections

| Metric | Tier 1 (10K MAH) | Tier 2 (100K MAH) | Tier 3 (1M MAH) |
| :--- | :--- | :--- | :--- |
| **Active Users** | 25,000 | 250,000 | 2,500,000 |
| **Total Daily API Requests** | 600,000 | 6,000,000 | 60,000,000 |
| **Average QPS** | 7.0 req/sec | 70 req/sec | 700 req/sec |
| **Peak Traffic Multiplier** | 5.0x (Evening ledger peak) | 5.0x | 4.0x |
| **Peak Target QPS** | **35 QPS** | **350 QPS** | **2,800 QPS** |
| **Concurrent WebSocket Connections** | 1,200 | 12,000 | 110,000 |
| **Monthly SMS Messages Ingested** | 300,000 | 3,000,000 | 30,000,000 |
| **Monthly Receipt Scans** | 40,000 | 400,000 | 4,000,000 |

---

## 3. Storage & Database Sizing Calculations

### 3.1. Annual Data Growth per Household
- **Transactions & Incomes:** $540 \times 1.2\text{ KB} = 648\text{ KB}$
- **Bills & Utilities:** $120 \times 0.8\text{ KB} = 96\text{ KB}$
- **Inventory & History:** $350 \times 0.6\text{ KB} = 210\text{ KB}$
- **Tasks & Chores:** $200 \times 0.5\text{ KB} = 100\text{ KB}$
- **AI Memory & Logs:** $100 \times 2.0\text{ KB} = 200\text{ KB}$
- **Relational Overhead & Indices (40%):** $\approx 500\text{ KB}$
- **Total Annual Relational Storage:** **$\approx 1.75\text{ MB}$ per household / year**

### 3.2. Sizing Summary by Tier

| Storage Dimension | Tier 1 (10K MAH) | Tier 2 (100K MAH) | Tier 3 (1M MAH) |
| :--- | :--- | :--- | :--- |
| **Relational DB (Annual Delta)** | 17.5 GB / year | 175 GB / year | 1.75 TB / year |
| **Receipt Images (S3 Object Store)** | 120 GB / year | 1.2 TB / year | 12 TB / year |
| **Database IOPS (Peak Writes)** | 250 IOPS | 2,500 IOPS | 18,000 IOPS |
| **Database IOPS (Peak Reads)** | 600 IOPS | 5,500 IOPS | 42,000 IOPS |
| **Storage Class Recommendation** | AWS RDS PostgreSQL gp3 | AWS RDS PostgreSQL io2 | Aurora Multi-AZ / Sharded |

---

## 4. Compute & Container Sizing Specifications

### 4.1. Ingress & API Gateway (`apps/api`)
- Container: Node.js 20 Alpine
- Memory Footprint: ~256 MB base + ~128 MB active heap = 512 MB limit
- Max throughput per container: ~150 QPS before event loop latency rises > 20ms

| Tier | Pod Spec (vCPU / RAM) | Min Pods | Max Pods (HPA) | Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | 0.5 vCPU, 512 MiB | 2 | 4 | Multi-AZ High Availability |
| **Tier 2** | 1.0 vCPU, 1 GiB | 4 | 12 | HPA target 70% CPU |
| **Tier 3** | 2.0 vCPU, 2 GiB | 16 | 40 | Multi-cluster regional deploy |

### 4.2. Asynchronous Workers (`apps/worker`)
- Handlers: BullMQ consumer pool for SMS ingestion, OCR vision dispatch, and notification broadcasting.
- Max throughput per container: ~40 background jobs/sec

| Tier | Pod Spec (vCPU / RAM) | Min Pods | Max Pods | Queue Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | 0.5 vCPU, 512 MiB | 2 | 4 | Queue lag > 50 jobs |
| **Tier 2** | 1.0 vCPU, 1 GiB | 4 | 10 | Queue lag > 250 jobs |
| **Tier 3** | 2.0 vCPU, 2 GiB | 12 | 28 | Queue lag > 1,000 jobs |

### 4.3. In-Memory Cache & Message Broker (Redis Cluster)
- Memory allocation:
  - BullMQ Queue State: ~250 MB
  - Session & Rate Limiting Token Buckets: ~50 bytes $\times$ active users
  - Fast Query Cache (Budget summaries, category totals): TTL 5 min
- **Tier 1:** 1x Redis instance (AWS ElastiCache cache.t4g.small, 1.37 GiB RAM)
- **Tier 2:** 2x Redis Primary/Replica (cache.m6g.large, 6.38 GiB RAM)
- **Tier 3:** 3-Shard Redis Cluster (cache.r6g.xlarge, 26.32 GiB RAM)

---

## 5. Cost Model & Cloud Infrastructure Budget (Estimated Monthly USD)

```
Tier 2 (100,000 Active Households) Cost Projection:
┌────────────────────────────────────────┬──────────────────────┐
│ Infrastructure Component               │ Estimated Monthly    │
├────────────────────────────────────────┼──────────────────────┤
│ EKS / GKE Kubernetes Control Plane     │ $73.00               │
│ Worker Nodes (8x c6g.xlarge Spot/On-D) │ $410.00              │
│ PostgreSQL Primary + Read Replica      │ $580.00              │
│ Redis ElastiCache Multi-AZ Cluster     │ $165.00              │
│ S3 Object Storage & CloudFront CDN     │ $85.00               │
│ Twilio / Fast2SMS SMS Verification     │ $320.00              │
│ Gemini 1.5 Flash Token Consumption     │ $240.00              │
│ Monitoring (Datadog / Managed Grafana) │ $150.00              │
├────────────────────────────────────────┼──────────────────────┤
│ TOTAL MONTHLY COST (TIER 2)            │ $2,023.00            │
└────────────────────────────────────────┴──────────────────────┘
Cost per Active Household / Month: ~$0.020 USD
```
