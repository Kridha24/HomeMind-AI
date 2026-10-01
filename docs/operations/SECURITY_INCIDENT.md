# Security Incident Response Runbook

## 1. Incident Severity Classification

| Level | Definition | Response SLA | Escalation |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | Active data breach, unauthorized access to multiple households, compromised database/production credentials, or active remote code execution. | **Immediate (< 15 mins)** | Page On-Call Lead, CTO, Lead Architect |
| **P2 - High** | Targeted account takeover, repeated OTP bypass attempts, persistent DDoS, or circuit breaker failure exposing external credentials. | **< 1 hour** | On-Call Engineer, Security Lead |
| **P3 - Moderate**| Isolated abuse of rate limits, abnormal parsing exceptions, or suspicious login failure spikes. | **< 4 hours** | Engineering Team during business hours |

---

## 2. Immediate Response Actions

### A. Compromised JWT Secret or Session Breach
If `JWT_SECRET` is suspected to be leaked:
1. **Rotate Secrets:** Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in cloud secret manager.
2. **Invalidate All Refresh Tokens:**
   ```sql
   DELETE FROM "RefreshToken";
   ```
3. **Restart API Pods:**
   ```bash
   kubectl rollout restart deployment/homemind-api -n homemind-prod
   ```
   All existing sessions will be instantly terminated, requiring users to log in with new credentials.

### B. OTP Flooding / SMS Gateway Exhaustion
If an attacker is attempting to burn SMS gateway credits:
1. Ensure `checkOTPSendAbuse` is active.
2. Verify Redis distributed rate limiters are functioning.
3. Block offending IP ranges at the Cloudflare / WAF edge.
4. Temporarily enforce email-only OTP by setting:
   ```bash
   kubectl set env deployment/homemind-api -n homemind-prod ALLOW_SMS_OTP=false
   ```

### C. IDOR / Cross-Tenant Breach Attempt
If logs indicate unauthorized household access attempts (`Unauthorized access to household resource`):
1. Query audit logs:
   ```sql
   SELECT * FROM "AuditLog"
   WHERE action = 'UNAUTHORIZED_ACCESS_ATTEMPT'
   ORDER BY "createdAt" DESC LIMIT 50;
   ```
2. Disable the offending user account:
   ```sql
   UPDATE "User" SET "isActive" = false WHERE id = 'compromised-user-id';
   ```
3. Delete all active sessions for that user.
