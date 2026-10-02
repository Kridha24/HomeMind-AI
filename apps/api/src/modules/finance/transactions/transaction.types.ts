export interface ImportSmsTransactionDto {
  amount: number;
  currency?: string;
  type: 'DEBIT' | 'CREDIT';
  merchant?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  accountLast4?: string | null;
  bankName?: string | null;
  reference?: string | null;
  occurredAt: string | Date;
  sourceHash?: string | null;
  parserConfidence?: number | null;
  rawSender?: string | null;
  status?: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';
}

export interface IngestRawSmsDto {
  sender?: string;
  body: string;
  timestamp?: string | number;
}

export interface UpdateTransactionDto {
  status?: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';
  category?: string;
  merchant?: string;
  notes?: string;
  amount?: number;
  occurredAt?: string | Date;
}

export interface GetTransactionsQuery {
  status?: string;
  type?: string;
  search?: string;
  category?: string;
  source?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'occurredAt' | 'amount' | 'merchant';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TransactionStatsResult {
  totalCount: number;
  confirmedCount: number;
  needsReviewCount: number;
  ignoredCount: number;
  totalDebitSum: number;
  totalCreditSum: number;
  thisMonthSpent: number;
  thisMonthIncome: number;
  netCashFlow: number;
  largestExpense: {
    amount: number;
    merchant: string;
  } | null;
  categoryBreakdown: CategoryBreakdownItem[];
}
