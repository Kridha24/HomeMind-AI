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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
      {/* 1. This Month Spent */}
      <div className="relative overflow-hidden p-2.5 sm:p-5 border border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[2px] sm:h-[3px] w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[9.5px] sm:text-[11px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider truncate">
            This Month Spent
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-2xs group-hover:bg-rose-600 group-hover:text-white transition-colors flex-shrink-0">
            <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1 sm:mt-2.5">
          <span className="text-sm xs:text-base sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono tracking-tight block truncate">
            -{formatINR(thisMonthSpent)}
          </span>
          <span className="hidden xs:block text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            Confirmed outlays
          </span>
        </div>
      </div>

      {/* 2. This Month Income */}
      <div className="relative overflow-hidden p-2.5 sm:p-5 border border-emerald-500/30 dark:border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-white dark:from-emerald-500/[0.14] dark:via-emerald-950/20 dark:to-slate-900 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[2px] sm:h-[3px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[9.5px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider truncate">
            This Month Income
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1 sm:mt-2.5">
          <span className="text-sm xs:text-base sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight block truncate">
            +{formatINR(thisMonthIncome)}
          </span>
          <span className="hidden xs:block text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            Deposits & earnings
          </span>
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className={`relative overflow-hidden p-2.5 sm:p-5 border rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group ${
        isNetPositive
          ? 'border-teal-500/30 dark:border-teal-500/35 bg-gradient-to-br from-teal-500/[0.08] via-teal-500/[0.03] to-white dark:from-teal-500/[0.14] dark:via-teal-950/20 dark:to-slate-900'
          : 'border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900'
      }`}>
        <div className={`h-[2px] sm:h-[3px] w-full absolute top-0 left-0 right-0 opacity-90 ${
          isNetPositive ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-500'
        }`} />
        <div className="flex items-center justify-between pt-0.5">
          <span className={`text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate ${
            isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            Net Cash Flow
          </span>
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center border shadow-2xs transition-colors flex-shrink-0 ${
              isNetPositive
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1 sm:mt-2.5">
          <span
            className={`text-sm xs:text-base sm:text-2xl font-black font-mono tracking-tight block truncate ${
              isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {isNetPositive ? `+${formatINR(netCashFlow)}` : formatINR(netCashFlow)}
          </span>
          <span className="hidden xs:block text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            {isNetPositive ? 'Positive surplus' : 'Deficit this period'}
          </span>
        </div>
      </div>

      {/* 4. Transactions Count */}
      <div className="relative overflow-hidden p-2.5 sm:p-5 border border-indigo-500/30 dark:border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.03] to-white dark:from-indigo-500/[0.14] dark:via-indigo-950/20 dark:to-slate-900 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[2px] sm:h-[3px] w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[9.5px] sm:text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider truncate">
            Transactions
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1 sm:mt-2.5">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-sm xs:text-base sm:text-2xl font-black text-indigo-950 dark:text-indigo-100 font-mono tracking-tight">
              {transactionsCount}
            </span>
            {needsReviewCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[8.5px] sm:text-[10px] font-extrabold px-1 sm:px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-2.5 h-2.5" />
                {needsReviewCount}
              </span>
            )}
          </div>
          <span className="hidden xs:block text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            Total entries
          </span>
        </div>
      </div>

      {/* 5. Largest Expense */}
      <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 relative overflow-hidden p-2.5 sm:p-5 border border-purple-500/30 dark:border-purple-500/35 bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.03] to-white dark:from-purple-500/[0.14] dark:via-purple-950/20 dark:to-slate-900 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="h-[2px] sm:h-[3px] w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-400 absolute top-0 left-0 right-0 opacity-90" />
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[9.5px] sm:text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider truncate">
            Largest Expense
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
            <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1 sm:mt-2.5">
          {largestExpense ? (
            <div className="flex items-baseline justify-between sm:block">
              <span className="text-sm xs:text-base sm:text-2xl font-black text-purple-950 dark:text-purple-100 font-mono tracking-tight block truncate">
                {formatINR(largestExpense.amount)}
              </span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block mt-0.5" title={largestExpense.merchant}>
                {largestExpense.merchant}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-between sm:block">
              <span className="text-sm font-bold text-slate-400 font-mono block">—</span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">No expenses yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
