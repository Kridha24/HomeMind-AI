export interface BaseJob<T = any> {
  id: string;
  type: string;
  payload: T;
  createdAt: string;
}

export type JobType =
  | 'TRANSACTION_PARSING'
  | 'NOTIFICATION_DISPATCH'
  | 'AI_CATEGORIZATION'
  | 'REPORT_GENERATION'
  | 'ANALYTICS_AGGREGATION';

export interface TransactionParsingJobPayload {
  householdId: string;
  sender: string;
  body: string;
  timestamp: number;
}
