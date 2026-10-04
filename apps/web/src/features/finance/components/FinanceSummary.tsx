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
      <div className="relative overflow-hidden p-4 sm:p-5 border border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[3px] w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            This Month Spent
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-2xs group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono tracking-tight block">
            -{formatINR(thisMonthSpent)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
            Confirmed outlays
          </span>
        </div>
      </div>

      {/* 2. This Month Income */}
      <div className="relative overflow-hidden p-4 sm:p-5 border border-emerald-500/30 dark:border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-white dark:from-emerald-500/[0.14] dark:via-emerald-950/20 dark:to-slate-900 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            This Month Income
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight block">
            +{formatINR(thisMonthIncome)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
            Deposits & earnings
          </span>
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className={`relative overflow-hidden p-4 sm:p-5 border rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group ${
        isNetPositive
          ? 'border-teal-500/30 dark:border-teal-500/35 bg-gradient-to-br from-teal-500/[0.08] via-teal-500/[0.03] to-white dark:from-teal-500/[0.14] dark:via-teal-950/20 dark:to-slate-900'
          : 'border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900'
      }`}>
        <div className={`h-[3px] w-full absolute top-0 left-0 right-0 opacity-90 ${
          isNetPositive ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-500'
        }`} />
        <div className="flex items-center justify-between pt-0.5">
          <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
            isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            Net Cash Flow
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs transition-colors ${
              isNetPositive
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight block ${
              isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {isNetPositive ? `+${formatINR(netCashFlow)}` : formatINR(netCashFlow)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
            {isNetPositive ? 'Positive surplus' : 'Deficit this period'}
          </span>
        </div>
      </div>

      {/* 4. Transactions Count */}
      <div className="relative overflow-hidden p-4 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.03] to-white dark:from-indigo-500/[0.14] dark:via-indigo-950/20 dark:to-slate-900 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            Transactions
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-indigo-100 font-mono tracking-tight">
              {transactionsCount}
            </span>
            {needsReviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-2.5 h-2.5" />
                {needsReviewCount} review
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
            Total recorded entries
          </span>
        </div>
      </div>

      {/* 5. Largest Expense */}
      <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 relative overflow-hidden p-4 sm:p-5 border border-purple-500/30 dark:border-purple-500/35 bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.03] to-white dark:from-purple-500/[0.14] dark:via-purple-950/20 dark:to-slate-900 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[3px] w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Largest Expense
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          {largestExpense ? (
            <>
              <span className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 font-mono tracking-tight block">
                {formatINR(largestExpense.amount)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block mt-0.5" title={largestExpense.merchant}>
                {largestExpense.merchant}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-slate-400 font-mono block">—</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">No expenses yet</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
