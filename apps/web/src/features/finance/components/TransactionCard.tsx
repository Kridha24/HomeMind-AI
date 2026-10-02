import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { TransactionItem } from './TransactionRow';
import { CategoryBadge } from './CategoryBadge';
import { TransactionSourceBadge } from './TransactionSourceBadge';
import { formatINR, formatFinanceDate } from '../utils/financeFormatters';

interface TransactionCardProps {
  transaction: TransactionItem;
  onSelect: (tx: TransactionItem) => void;
  timeZone?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
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
    transaction.bankName;

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onSelect(transaction)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(transaction);
      }}
      className={`glass-panel p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 min-h-[56px] ${
        isNeedsReview
          ? 'border-amber-500/40 bg-amber-500/[0.04]'
          : 'border-primary/40 hover:border-primary/70 bg-surface-elevated/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-primary truncate max-w-[170px] sm:max-w-[240px]">
              {displayTitle}
            </span>
            {isNeedsReview && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Review
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoryBadge category={transaction.category} className="text-[10px] py-0 px-2" />
            <TransactionSourceBadge
              source={transaction.source}
              paymentMethod={transaction.paymentMethod}
              bankName={transaction.bankName}
              className="scale-90 origin-left"
            />
          </div>

          {subtitle && (
            <span className="text-[10px] text-muted truncate max-w-[160px] block mt-1 font-mono">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <span
            className={`font-mono font-black text-sm block ${
              isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isDebit ? `-${formatINR(transaction.amount)}` : `+${formatINR(transaction.amount)}`}
          </span>
          <span className="text-[10px] text-muted font-mono block mt-0.5">
            {new Date(transaction.occurredAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: timeZone || undefined,
            })}
          </span>
        </div>

        <div className="w-6 h-6 rounded-lg text-muted flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
