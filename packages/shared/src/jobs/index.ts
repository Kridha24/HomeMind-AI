export const QUEUE_NAMES = {
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  AI: 'ai',
  ANALYTICS: 'analytics',
} as const;

export type QueueNameValue = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface BaseJobContract<T = any> {
  version: number;
  jobType: string;
  jobId: string;
  occurredAt: string;
  householdId?: string;
  correlationId?: string;
  payload: T;
}

export interface TransactionParseJobPayload {
  householdId: string;
  userId: string;
  rawSender?: string;
  body: string;
  timestamp: string | number;
  idempotencyKey?: string;
}

export interface AICategorizationJobPayload {
  householdId: string;
  transactionId: string;
  merchant?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface NotificationJobPayload {
  householdId: string;
  recipientId: string;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL';
  title: string;
  message: string;
  data?: Record<string, any>;
  dedupKey?: string;
}

export interface AnalyticsAggregationJobPayload {
  householdId: string;
  period: 'DAILY' | 'MONTHLY';
  date: string;
  eventType: string;
}

export type TransactionParseJob = BaseJobContract<TransactionParseJobPayload>;
export type AICategorizationJob = BaseJobContract<AICategorizationJobPayload>;
export type NotificationJob = BaseJobContract<NotificationJobPayload>;
export type AnalyticsAggregationJob = BaseJobContract<AnalyticsAggregationJobPayload>;
