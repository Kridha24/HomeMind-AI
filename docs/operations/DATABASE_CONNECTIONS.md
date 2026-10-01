# Database Connection Budget & Connection Pooling Architecture

## 1. Executive Summary

PostgreSQL utilizes a process-per-connection architecture (`fork()` model). Each client connection consumes approximately 5MB to 10MB of server memory, along with internal lock tables, buffer pins, and CPU context switching overhead. Exceeding PostgreSQL's connection capacity (`max_connections`) causes connection queuing, latency spikes, and eventual connection rejection (`FATAL: remaining connection slots are reserved for non-replication superuser connections`).

This document formalizes HomeMind's production database connection budget, connection pooling formulas, and PgBouncer integration strategy.

---

## 2. Connection Budget Formula

The total active connection demand is governed by the following formula:

$$\text{Total Connections} = (N_{\text{API}} \times P_{\text{API}}) + (N_{\text{Worker}} \times P_{\text{Worker}}) + R_{\text{Admin}}$$

Where:
- $N_{\text{API}}$: Number of API container replicas
- $P_{\text{API}}$: Prisma connection pool size per API instance (`connection_limit` parameter)
- $N_{\text{Worker}}$: Number of Worker container replicas
- $P_{\text{Worker}}$: Prisma connection pool size per Worker instance
- $R_{\text{Admin}}$: Reserved connection capacity for migrations, DBAs, monitoring agents, and vacuum workers

### Hard Safety Constraint:
$$\text{Total Connections} \le 0.80 \times \text{PostgreSQL } \mathtt{max\_connections}$$

A 20% safety margin is strictly reserved for database superusers, cloud provider health checkers (e.g. AWS RDS / GCP Cloud SQL liveness), and automated backup snapshots.

---

## 3. Deployment Profiles & Capacity Tiers

| Profile | Target DB Instance | `max_connections` | API Replicas | API Pool | Worker Replicas | Worker Pool | Admin Reserve | Calculated Peak | Budget Margin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Small (Stage/Initial)** | 2 vCPU / 4GB RAM | 100 | 2 | 10 | 1 | 5 | 10 | **35** | **65% Headroom** |
| **Medium (Production Baseline)** | 4 vCPU / 16GB RAM | 250 | 4 | 15 | 2 | 10 | 20 | **100** | **60% Headroom** |
| **High Traffic (Peak Auto-Scale)** | 8 vCPU / 32GB RAM | 500 | 10 | 15 | 4 | 10 | 30 | **220** | **56% Headroom** |

---

## 4. PgBouncer Architecture & Readiness

When scaling beyond 10 API pods or 300 concurrent requests, a dedicated connection pooler (**PgBouncer**) or managed equivalent (AWS RDS Proxy / GCP Cloud SQL Auth Proxy with pooling) must be deployed between application pods and PostgreSQL.

### Architecture Topology:
```
[ API Pod 1..N ]  \
[ Worker Pod 1..N ] -> [ PgBouncer (Transaction Mode) ] -> [ PostgreSQL (Port 5432) ]
[ Admin / Migration ] -------------------------------------> [ PostgreSQL Direct Port ]
```

### PgBouncer Pool Mode:
HomeMind uses **Transaction Pooling** (`pool_mode = transaction`).
- Server connections are returned to the pool immediately upon completion of each transaction.
- Highly efficient for short-lived HTTP request transactions.
- **Prisma Requirement:** When using transaction pooling, Prisma migrations (`prisma migrate dev` / `prisma migrate deploy`) must connect directly to PostgreSQL or through a session-pooled port, because schema migrations utilize transaction-spanning advisory locks.

### Connection Strings:
- **Application Runtime Connection:**
  ```env
  DATABASE_URL="postgresql://homemind:password@pgbouncer.internal:6432/homemind?pgbouncer=true&connection_limit=15"
  ```
- **Prisma Migration Connection (`DIRECT_URL`):**
  ```env
  DIRECT_URL="postgresql://homemind:password@postgres.internal:5432/homemind"
  ```

### PgBouncer Reference Configuration (`pgbouncer.ini`):
```ini
[databases]
homemind = host=postgres.internal port=5432 dbname=homemind

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 30
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
server_idle_timeout = 600
server_connect_timeout = 15
server_login_retry = 3
query_timeout = 30
log_connections = 0
log_disconnections = 0
```

---

## 5. Slow Query Observability & Triage

1. **Slow Query Threshold:** Queries taking $> 200\text{ms}$ are logged with `[SlowQuery]` tag and observed in Prometheus histogram `db_query_duration_seconds`.
2. **Sanitization:** Bind parameters (names, amounts, passwords, tokens) are NEVER logged in query logs.
3. **EXPLAIN ANALYZE Workflow:**
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
   SELECT * FROM "Transaction"
   WHERE "householdId" = 'uuid-sample' AND "softDelete" = false
   ORDER BY "occurredAt" DESC
   LIMIT 20;
   ```
4. **Index Verification:** Ensure composite indexes `(householdId, softDelete, occurredAt)` and `(householdId, sourceHash)` exist to prevent sequential scans.
