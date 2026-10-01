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
}

export interface GetTransactionsQuery {
  status?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionStatsResult {
  totalCount: number;
  confirmedCount: number;
  needsReviewCount: number;
  ignoredCount: number;
  totalDebitSum: number;
  totalCreditSum: number;
}
