# HomeMind AI — Disaster Recovery (DR) & Business Continuity Plan

**Document Version:** 2.0.0  
**Status:** Approved  
**Author:** HomeMind SRE & Infrastructure Operations Team  
**Last Updated:** October 2026  

---

## 1. Disaster Recovery Objectives (RTO & RPO)

- **Recovery Time Objective (RTO):** **$\le 15$ Minutes**  
  The maximum acceptable duration of system unavailability following a catastrophic failure before core services must be restored.
- **Recovery Point Objective (RPO):** **$\le 1$ Minute**  
  The maximum acceptable age of data loss measured in time. Transactional records older than 60 seconds must be fully recoverable.

---

## 2. Backup Topology & Archival Cadence

```mermaid
graph TD
    subgraph PrimaryRegion ["Primary Cloud Region (e.g. ap-south-1)"]
        RDSPrimary[("RDS PostgreSQL Primary")]
        WALStream["WAL Archiver Process"]
        SnapService["AWS Backup / RDS Automated Snapshots"]
        S3Primary[("S3 Bucket: homemind-backups-primary")]
    end

    subgraph SecondaryRegion ["DR Region (e.g. ap-southeast-1)"]
        S3Replica[("S3 Bucket: homemind-backups-dr (CRR)")]
        RDSStandby[("Cold / Pilot Light Standby RDS")]
    end

    RDSPrimary -->|Continuous Archiving| WALStream
    WALStream -->|Every 60s / 16MB| S3Primary
    RDSPrimary -->|Daily Snapshot at 02:00 UTC| SnapService
    SnapService --> S3Primary

    S3Primary -->|S3 Cross-Region Replication (CRR)| S3Replica
    S3Replica -.->|Point-in-Time Recovery (PITR)| RDSStandby
```

### Backup Matrix

| Backup Type | Frequency | Retention Window | Storage Location | Encryption |
| :--- | :--- | :--- | :--- | :--- |
| **Continuous WAL Logs** | Every 60s / 16MB segment | 14 Days | S3 Primary + S3 DR Bucket | AWS KMS (AES-256) |
| **RDS Automated Snapshot** | Daily at 02:00 UTC | 35 Days | Multi-AZ S3 Glacier Instant | AWS KMS (AES-256) |
| **Logical Dump (`pg_dump`)** | Weekly Sunday 04:00 UTC | 90 Days | S3 Immutable Vault (WORM) | GPG + KMS (AES-256) |
| **Receipt Image Assets** | Real-time S3 Put | Permanent / 7 Years | Multi-Region S3 Storage | S3-Managed SSE-S3 |

---

## 3. Disaster Scenarios & Failover Playbooks

### Playbook 1: Primary Database Failure (Multi-AZ Automatic Failover)
- **Trigger:** RDS Primary node hardware failure or network partition.
- **Expected Downtime:** ~60 - 120 seconds.
- **Automated Workflow:**
  1. AWS RDS detects primary instance health check failure.
  2. Multi-AZ synchronous standby replica in secondary AZ is promoted to primary.
  3. CNAME DNS record for the database endpoint is automatically updated.
  4. `apps/api` and `apps/worker` connection pools reconnect via PgBouncer retry logic.
- **Manual Verification Step:**
  ```bash
  # Check RDS replication status and connectivity
  aws rds describe-db-instances --db-instance-identifier homemind-prod-pg \
    --query "DBInstances[0].DBInstanceStatus"
  ```

---

### Playbook 2: Regional Catastrophic Cloud Outage (Cross-Region DR Activation)
- **Trigger:** Entire cloud region experiences a multi-hour blackout.
- **Target RTO:** 15 Minutes.

#### Step 1: DNS & Ingress Redirection (Minutes 0 - 3)
Update Cloudflare global traffic management to reroute ingress to the DR region load balancers:
```bash
cloudflare-cli dns update --zone homemind.ai --name api --content $DR_INGRESS_IP
```

#### Step 2: Spin Up Database via Point-in-Time Recovery (Minutes 3 - 10)
Restore the latest database state in the secondary region using the replicated WAL archive:
```bash
aws rds restore-db-instance-to-point-in-time \
  --region ap-southeast-1 \
  --source-db-instance-automated-backups-arn $REPLICATED_BACKUP_ARN \
  --target-db-instance-identifier homemind-dr-restored-pg \
  --restore-time $(date -u -v-2M +"%Y-%m-%dT%H:%M:%SZ") \
  --db-instance-class db.r6g.xlarge \
  --multi-az
```

#### Step 3: Launch Kubernetes Workloads in DR Cluster (Minutes 10 - 13)
Apply production Helm manifests pointing to the restored database endpoint:
```bash
helm upgrade --install homemind-prod ./infra/kubernetes/homemind \
  --namespace production \
  --set global.databaseUrl="postgresql://app_user:$DR_DB_PASS@$DR_DB_HOST:5432/homemind?sslmode=require" \
  --set global.redisUrl="rediss://$DR_REDIS_HOST:6379"
```

#### Step 4: Health Check & Verification (Minutes 13 - 15)
Run automated synthetic smoke tests verifying user authentication, transaction ledger access, and SMS sync endpoint response:
```bash
curl -f https://api.homemind.ai/api/v1/health || exit 1
```

---

## 4. Disaster Recovery Game Day & Drill Schedule

To guarantee that failover runbooks remain valid, HomeMind mandates bi-annual **DR Game Days**:

| Quarter | Drill Type | Scenario Simulated | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Q1 (Spring)** | Tabletop Drill | Regional fiber cut + S3 data corruption | Team walks through runbooks, validates permissions and secret access. |
| **Q3 (Autumn)** | Live Chaos Drill | Unannounced kill of Primary RDS instance in Staging/Prod-Mirror | System recovers via automated failover in $< 120$ seconds with 0 data loss. |
