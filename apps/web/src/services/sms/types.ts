export type TransactionType = 'DEBIT' | 'CREDIT';

export type PaymentMethod = 'UPI' | 'CARD' | 'IMPS' | 'NEFT' | 'RTGS' | 'ATM' | 'BANK';

export type TransactionStatus = 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';

export interface ParsedSmsTransaction {
  amount: number;
  currency: string;
  type: TransactionType;
  merchant?: string | null;
  category?: string | null;
  paymentMethod?: PaymentMethod | string | null;
  accountLast4?: string | null;
  bankName?: string | null;
  reference?: string | null;
  occurredAt: string;
  sourceHash?: string | null;
  rawSender?: string | null;
  parserConfidence: number;
  status?: TransactionStatus;
}

export interface StoredTransaction extends ParsedSmsTransaction {
  id: string;
  householdId: string;
  userId: string;
  expenseId?: string | null;
  incomeId?: string | null;
  createdAt: string;
  updatedAt: string;
  expense?: {
    id: string;
    title: string;
    amount: number;
    category: string;
  } | null;
  income?: {
    id: string;
    title: string;
    amount: number;
    source: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface PendingSmsTransaction {
  localId: string;
  transaction: ParsedSmsTransaction;
  sourceHash: string;
  createdAt: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
}

export interface SmsScanResult {
  transactions: ParsedSmsTransaction[];
  count: number;
}

export interface SmsPermissionStatus {
  granted: boolean;
  status: 'GRANTED' | 'DENIED' | 'NOT_REQUESTED';
}

export interface TransactionStats {
  totalDetected: number;
  needsReview: number;
  autoImported: number;
  lastTransactionAt?: string | null;
}
