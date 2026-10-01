export const EventType = {
  // Finance - Expenses
  EXPENSE_CREATED: 'finance.expense.created.v1',
  EXPENSE_UPDATED: 'finance.expense.updated.v1',
  EXPENSE_DELETED: 'finance.expense.deleted.v1',

  // Finance - Income
  INCOME_CREATED: 'finance.income.created.v1',
  INCOME_UPDATED: 'finance.income.updated.v1',
  INCOME_DELETED: 'finance.income.deleted.v1',

  // Finance - Transactions
  TRANSACTION_INGESTED: 'finance.transaction.ingested.v1',
  TRANSACTION_CREATED: 'finance.transaction.created.v1',
  TRANSACTION_CONFIRMED: 'finance.transaction.confirmed.v1',
  TRANSACTION_IGNORED: 'finance.transaction.ignored.v1',

  // Billing
  BILL_CREATED: 'billing.bill.created.v1',
  BILL_UPDATED: 'billing.bill.updated.v1',
  BILL_PAID: 'billing.bill.paid.v1',

  // Tasks
  TASK_CREATED: 'tasks.task.created.v1',
  TASK_COMPLETED: 'tasks.task.completed.v1',

  // System
  CACHE_INVALIDATE: 'system.cache.invalidate.v1',
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export interface DomainEventEnvelope<T = any> {
  eventId: string;
  eventType: EventTypeValue | string;
  occurredAt: string;
  aggregateType: string;
  aggregateId: string;
  householdId?: string;
  version: number;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  data: T;
}

export function createEventEnvelope<T>(params: {
  eventType: EventTypeValue | string;
  aggregateType: string;
  aggregateId: string;
  householdId?: string;
  data: T;
  eventId?: string;
  version?: number;
  traceId?: string;
  spanId?: string;
  requestId?: string;
}): DomainEventEnvelope<T> {
  return {
    eventId: params.eventId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    eventType: params.eventType,
    occurredAt: new Date().toISOString(),
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    householdId: params.householdId,
    version: params.version || 1,
    traceId: params.traceId,
    spanId: params.spanId,
    requestId: params.requestId,
    data: params.data,
  };
}

