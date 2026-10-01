# Data Retention & Lifecycle Policy

## 1. Overview

HomeMind collects financial and household information. To comply with privacy laws (GDPR, India DPDP Act), limit liability, and optimize storage costs, data is governed by strict retention lifecycles.

---

## 2. Retention Schedules

| Data Category | Target Retention Period | Storage Location | Purge / Archival Strategy |
| :--- | :--- | :--- | :--- |
| **Raw Transaction SMS** | **Do Not Retain** (Parsed in-memory or on device) | Transient | Raw SMS messages are scrubbed immediately after parsing. |
| **Normalized Transactions** | Account lifetime + 90 days after closure | PostgreSQL | Soft-delete flag; permanently purged upon household deletion request. |
| **Outbox Events** | **7 days** after successful publication | PostgreSQL (`OutboxEvent`) | Scheduled cron job runs `DELETE FROM "OutboxEvent" WHERE "publishedAt" < NOW() - INTERVAL '7 days'`. |
| **Idempotency Records** | **24 hours** | PostgreSQL / Redis | Key TTL / batch cleanup after 24-hour replay protection window. |
| **Audit Logs** | **365 days** (1 year) | PostgreSQL (`AuditLog`) | Archived to cold storage for compliance before deletion. |
| **Notifications** | **90 days** | PostgreSQL (`Notification`) | Read notifications purged after 30 days; unread after 90 days. |
| **Application Logs** | **30 days** | Log Aggregator (Loki/CloudWatch) | Automatic index rotation and expiration. |
| **Tracing Telemetry** | **14 days** | OpenTelemetry Collector / Jaeger | TTL-based expiration. |
| **Prometheus Metrics** | **90 days** | Prometheus TSDB | Downsampled at 30 days; purged at 90 days. |
| **Uploaded Receipts & Docs** | Account lifetime | Object Storage | Deleted when associated Expense / Document record is deleted. |

---

## 3. Automated Cleanup Implementation

Automated maintenance tasks run daily during off-peak hours (03:00 UTC) to execute lifecycle pruning:
```sql
-- 1. Purge published outbox events older than 7 days
DELETE FROM "OutboxEvent"
WHERE "publishedAt" IS NOT NULL
  AND "publishedAt" < NOW() - INTERVAL '7 days';

-- 2. Purge expired idempotency records older than 24 hours
DELETE FROM "IdempotencyRecord"
WHERE "createdAt" < NOW() - INTERVAL '24 hours';

-- 3. Purge read notifications older than 30 days
DELETE FROM "Notification"
WHERE "isRead" = true
  AND "createdAt" < NOW() - INTERVAL '30 days';
```
