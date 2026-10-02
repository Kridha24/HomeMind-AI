import React from 'react';
import { CreditCard, Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatINR } from '../utils/financeFormatters';

interface FinanceSummaryProps {
  thisMonthSpent: number;
  thisMonthIncome: number;
  netCashFlow: number;
  transactionsCount: number;
  needsReviewCount?: number;
  largestExpense?: {
    amount: number;
    merchant: string;
  } | null;
  isLoading?: boolean;
}

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({
  thisMonthSpent,
  thisMonthIncome,
  netCashFlow,
  transactionsCount,
  needsReviewCount = 0,
  largestExpense,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-panel p-4 rounded-3xl h-24 bg-surface-elevated/40 border-primary/20" />
        ))}
      </div>
    );
  }

  const isNetPositive = netCashFlow >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
      {/* 1. This Month Spent */}
      <div className="glass-panel p-4 sm:p-5 border-rose-500/30 bg-rose-500/5 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            This Month Spent
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight block">
            -{formatINR(thisMonthSpent)}
          </span>
          <span className="text-[10px] text-muted font-medium block mt-0.5">
            Confirmed outlays
          </span>
        </div>
      </div>

      {/* 2. This Month Income */}
      <div className="glass-panel p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            This Month Income
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight block">
            +{formatINR(thisMonthIncome)}
          </span>
          <span className="text-[10px] text-muted font-medium block mt-0.5">
            Deposits & earnings
          </span>
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className="glass-panel p-4 sm:p-5 border-primary/40 bg-surface-elevated/40 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Net Cash Flow
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isNetPositive
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight block ${
              isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isNetPositive ? `+${formatINR(netCashFlow)}` : formatINR(netCashFlow)}
          </span>
          <span className="text-[10px] text-muted font-medium block mt-0.5">
            {isNetPositive ? 'Positive surplus' : 'Deficit this period'}
          </span>
        </div>
      </div>

      {/* 4. Transactions Count */}
      <div className="glass-panel p-4 sm:p-5 border-primary/40 bg-surface-elevated/40 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Transactions
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">
              {transactionsCount}
            </span>
            {needsReviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertCircle className="w-2.5 h-2.5" />
                {needsReviewCount} review
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted font-medium block mt-0.5">
            Total recorded entries
          </span>
        </div>
      </div>

      {/* 5. Largest Expense (Optional / responsive) */}
      <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 glass-panel p-4 sm:p-5 border-primary/40 bg-surface-elevated/40 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Largest Expense
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          {largestExpense ? (
            <>
              <span className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight block">
                {formatINR(largestExpense.amount)}
              </span>
              <span className="text-[10px] text-muted font-medium truncate block mt-0.5" title={largestExpense.merchant}>
                {largestExpense.merchant}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-muted font-mono block">—</span>
              <span className="text-[10px] text-muted font-medium block mt-0.5">No expenses yet</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
