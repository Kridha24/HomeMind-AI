# HomeMind AI — Financial Precision & Money Model Audit

**Date:** October 2026  
**Document Version:** 1.0.0  
**Status:** Audit Completed / Non-Destructive Mitigation Established  
**Author:** HomeMind Financial Systems Engineering  

---

## 1. Executive Summary & Audit Findings

An exhaustive audit of financial data structures across `backend/prisma/schema.prisma`, API controllers, and frontend calculations reveals that monetary amounts are currently stored and transmitted as **64-bit IEEE 754 Floating-Point Numbers (`Float`)**:

| Entity | Field | Prisma Type | DB Storage (PostgreSQL) | DB Storage (SQLite) |
| :--- | :--- | :--- | :--- | :--- |
| **`Expense`** | `amount` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`Income`** | `amount` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`Transaction`** | `amount` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`Budget`** | `monthlyLimit` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`Bill`** | `amount` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`MaintenanceLog`** | `cost` | `Float` | `DOUBLE PRECISION` | `REAL` |
| **`AIRecommendation`** | `savingsEstimate`| `Float?` | `DOUBLE PRECISION` | `REAL` |

---

## 2. Risk Assessment of IEEE 754 Floating-Point Money

In binary floating-point representation, base-10 decimal fractions like `0.1` and `0.2` cannot be represented exactly:
$$0.1 + 0.2 = 0.30000000000000004$$

### Risks Identified in HomeMind:
1. **Ledger Discrepancy Accumulation:** Aggregating thousands of monthly household transactions can accumulate cent/paise rounding drift.
2. **Equality Comparison Errors:** Conditions like `if (balance === targetAmount)` can fail due to precision artifacts.
3. **Idempotency Hash Fragility:** If one process formats `450.0` as `450` and another as `450.00000000000006`, hash mismatch may occur.

---

## 3. Phase 1 Non-Destructive Safety Guardrails

In Phase 1, schema modifications that would break SQLite compatibility or invalidate existing production backups are **strictly forbidden**. The following application-level guardrails are implemented in `@homemind/shared`:

### 3.1. Standardized Currency Normalization Utility
All monetary inputs, computations, and ledger writes are passed through `roundMoney()`:

```typescript
// packages/shared/src/utils/money.ts
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const rounded = roundMoney(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function toMinorUnits(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return roundMoney(minorUnits / 100);
}
```

---

## 4. Phase 3 Migration Blueprint: PostgreSQL `DECIMAL(12, 2)` / Integer Minor Units

When the production database migrates to a dedicated multi-tenant PostgreSQL cluster (Phase 3), the schema will transition to fixed-point arithmetic:

### Option A: `Decimal(12, 2)` (Selected Target)
```prisma
// Target PostgreSQL Schema in Phase 3
model Transaction {
  amount       Decimal  @db.Decimal(12, 2)
  balanceAfter Decimal? @db.Decimal(12, 2)
}
```
- **Precision:** Supports amounts up to 9,999,999,999.99 (₹10 Billion / $10 Billion) with exact 2-decimal precision.
- **Prisma Support:** Maps to `Prisma.Decimal` (Decimal.js under the hood), completely eliminating binary float inaccuracies.

### Option B: Integer Minor Units (Paise / Cents)
- Alternative: Store integer `amountMinor` (e.g. ₹450.50 stored as `45050`).
- While fast, it requires client-side display transformation across hundreds of UI components.
- **Verdict:** `DECIMAL(12, 2)` provides the ideal balance of mathematical safety and DX.
