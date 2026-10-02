import React from 'react';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { TransactionSourceBadge } from './TransactionSourceBadge';
import { formatINR, formatFinanceDate } from '../utils/financeFormatters';

export interface TransactionItem {
  id: string;
  householdId: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'DEBIT' | 'CREDIT' | string;
  merchant?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  accountLast4?: string | null;
  bankName?: string | null;
  reference?: string | null;
  source: 'SMS' | 'MANUAL' | 'IMPORTED' | 'OCR' | string;
  status: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED' | string;
  parserConfidence?: number | null;
  occurredAt: string;
  expenseId?: string | null;
  incomeId?: string | null;
  expense?: any;
  income?: any;
  user?: { name?: string; email?: string };
}

interface TransactionRowProps {
  transaction: TransactionItem;
  onSelect: (tx: TransactionItem) => void;
  timeZone?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onSelect,
  timeZone,
}) => {
  const isDebit = transaction.type === 'DEBIT';
  const isNeedsReview = transaction.status === 'NEEDS_REVIEW';
  const displayTitle =
    transaction.merchant ||
    transaction.expense?.title ||
    transaction.income?.title ||
    (isDebit ? 'Expense' : 'Income Deposit');

  const subtitle =
    transaction.reference ||
    (transaction.accountLast4 ? `Acc **${transaction.accountLast4}` : null) ||
    transaction.bankName ||
    (isDebit ? 'Household Debit' : 'Deposit');

  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(transaction)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(transaction);
      }}
      className={`group cursor-pointer hover:bg-surface-elevated/80 transition-colors focus:outline-none focus:bg-blue-500/5 ${
        isNeedsReview ? 'bg-amber-500/[0.03]' : ''
      }`}
    >
      {/* Date */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-mono text-xs font-semibold text-secondary block">
          {formatFinanceDate(transaction.occurredAt, timeZone)}
        </span>
        <span className="font-mono text-[10px] text-muted block">
          {new Date(transaction.occurredAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: timeZone || undefined,
          })}
        </span>
      </td>

      {/* Transaction / Merchant */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <span className="font-bold text-xs text-primary truncate max-w-[220px] sm:max-w-[280px] block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {displayTitle}
            </span>
            <span className="text-[11px] text-muted truncate max-w-[200px] block font-medium">
              {subtitle}
            </span>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <CategoryBadge category={transaction.category} />
      </td>

      {/* Source */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <TransactionSourceBadge
          source={transaction.source}
          paymentMethod={transaction.paymentMethod}
          bankName={transaction.bankName}
          isAiCategorized={Boolean(transaction.parserConfidence && transaction.parserConfidence > 0.8)}
        />
      </td>

      {/* Type */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isDebit
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {isDebit ? 'Debit' : 'Credit'}
        </span>
      </td>

      {/* Amount */}
      <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono font-black text-xs sm:text-sm">
        <span className={isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
          {isDebit ? `-${formatINR(transaction.amount)}` : `+${formatINR(transaction.amount)}`}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5 whitespace-nowrap text-center">
        {isNeedsReview ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Review</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-muted bg-primary/5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span>Posted</span>
          </span>
        )}
      </td>

      {/* Details Chevron */}
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors ml-auto">
          <ChevronRight className="w-4 h-4" />
        </div>
      </td>
    </tr>
  );
};
