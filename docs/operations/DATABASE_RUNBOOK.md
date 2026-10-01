# Database Operations Runbook

## 1. Connection Saturation (`FATAL: remaining connection slots`)

### Symptoms:
- Alert: `DatabaseConnectionSaturation`
- API errors: `Can't reach database server at postgres:5432` or connection pool timeout.

### Verification:
```sql
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
SELECT count(*), client_addr FROM pg_stat_activity GROUP BY client_addr ORDER BY count DESC;
```

### Mitigation:
1. Verify connection formula: Total = (API pods × 15) + (Worker pods × 10) + 10.
2. If total connections approach `max_connections`, temporarily terminate idle connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```
3. Deploy PgBouncer in transaction mode as documented in `DATABASE_CONNECTIONS.md`.

---

## 2. Slow Queries & Deadlocks

### Verification:
```sql
-- Identify running queries taking > 5 seconds
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - query_start) > interval '5 seconds'
  AND state != 'idle';
```

### Mitigation:
1. Terminate runaway query:
   ```sql
   SELECT pg_cancel_backend(pid);
   ```
2. Run `EXPLAIN (ANALYZE, BUFFERS)` on the query.
3. Verify indexes on `Transaction`, `Expense`, and `OutboxEvent`.

---

## 3. Database Restoration Drill

### Verification Protocol (Disaster Recovery):
1. **Target:** RPO $\le 1\text{ hour}$, RTO $\le 30\text{ minutes}$.
2. **Procedure:**
   ```bash
   # 1. Download latest encrypted snapshot from backup bucket
   aws s3 cp s3://homemind-backups/postgres-latest.dump.gpg .
   gpg --decrypt --passphrase "$BACKUP_PASSPHRASE" postgres-latest.dump.gpg > postgres-latest.dump

   # 2. Restore to test instance
   pg_restore -h postgres-dr.internal -U homemind -d homemind_restore -v postgres-latest.dump

   # 3. Verify record integrity
   psql -h postgres-dr.internal -U homemind -d homemind_restore -c 'SELECT count(*) FROM "Transaction";'
   ```
3. A backup is considered **unverified** until full restoration testing succeeds in staging.
