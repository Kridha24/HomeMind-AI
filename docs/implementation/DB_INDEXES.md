# HomeMind AI — Database Index Audit & Query Performance Plan

**Date:** October 2026  
**Document Version:** 1.0.0  
**Status:** Audit Completed  
**Author:** HomeMind Data Engineering & SRE  

---

## 1. Audit Methodology

Indices were audited against real-world controller query patterns:
1. Multi-tenant filtering by `householdId` (present on 100% of read/write queries).
2. Temporal sorting on ledgers (`occurredAt DESC`, `date DESC`, `dueDate ASC`).
3. Status filter aggregations (`status = 'PENDING_APPROVAL'`, `isRead = false`, `status = 'PENDING'`).

---

## 2. Existing Index Inventory (Verified in `schema.prisma`)

| Model | Index Definition | Justification / Query Covered | Status |
| :--- | :--- | :--- | :--- |
| **`User`** | `@@index([householdId])`<br/>`@@index([email])`<br/>`@@index([phoneNumber])` | Member lookups, login lookups by phone/email. | ✅ Active |
| **`RefreshToken`** | `@@index([userId, expiresAt])` | Token lookup & expired session purge. | ✅ Active |
| **`Expense`** | `@@index([householdId, date])` | Monthly ledger queries & date-range aggregations. | ✅ Active |
| **`Transaction`** | `@@index([householdId, occurredAt])`<br/>`@@index([sourceHash])`<br/>`@@index([status])` | Reverse-chronological ledger display, deduplication checks. | ✅ Active |
| **`Bill`** | `@@index([householdId, status, dueDate])` | Upcoming bills widget, overdue bill sweeps. | ✅ Active |
| **`GroceryItem`** | `@@index([householdId, category])` | Pantry inventory view & category filtering. | ✅ Active |
| **`Task`** | `@@index([householdId, status])` | Pending chore lists, completion tracking. | ✅ Active |
| **`Notification`** | `@@index([householdId, isRead])` | Unread notifications counter & notification drawer. | ✅ Active |
| **`AIMemory`** | `@@index([householdId, type])` | Tenant context synthesis during Copilot chat. | ✅ Active |

---

## 3. Recommended Optimization Indexes (Non-Destructive Target)

The following composite indexes are identified for upcoming scale milestones:
1. `Transaction`: `@@index([householdId, status, occurredAt(sort: Desc)])` — Accelerates the "Pending Review" tab in the expenses page when transaction volume exceeds 50K rows.
2. `Task`: `@@index([householdId, assignedToId, status])` — Optimizes "My Assigned Tasks" queries for large family households.
3. `AuditLog`: `@@index([householdId, timestamp(sort: Desc)])` — Provides fast audit trail access without full table scans.
