import React from 'react';
import { Wallet, CreditCard, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { HouseholdAnalyticsData } from '../types';
import { formatINR } from '../utils/analyticsFormatters';

interface AnalyticsSummaryProps {
  data: HouseholdAnalyticsData;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  const { finance, period } = data;
  const isMonth = period.key === 'month';
  const isAllTime = period.key === 'all';

  const incomeLabel = isMonth ? 'This Month Income' : isAllTime ? 'All-Time Income' : 'Period Income';
  const expenseLabel = isMonth ? 'This Month Expenses' : isAllTime ? 'All-Time Spend' : 'Period Expenses';
  const netLabel = isMonth ? 'This Month Net' : 'Net Cash Flow';

  const isNetPositive = finance.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Income Card */}
      <div className="group relative overflow-hidden p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-white dark:from-emerald-500/[0.14] dark:via-emerald-950/20 dark:to-slate-900 hover:border-emerald-500/50 hover:-translate-y-px transition-all duration-200 shadow-xs hover:shadow-md space-y-2">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">{incomeLabel}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
          +{formatINR(finance.periodIncome)}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
          Lifetime: +{formatINR(finance.allTimeIncome)}
        </p>
      </div>

      {/* 2. Expense Card */}
      <div className="group relative overflow-hidden p-5 rounded-2xl border border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 hover:border-rose-500/50 hover:-translate-y-px transition-all duration-200 shadow-xs hover:shadow-md space-y-2">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider">{expenseLabel}</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
          -{formatINR(finance.periodExpenses)}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
          Lifetime: -{formatINR(finance.allTimeExpenses)}
        </p>
      </div>

      {/* 3. Net Cash Flow Card */}
      <div className={`group relative overflow-hidden p-5 rounded-2xl border hover:-translate-y-px transition-all duration-200 shadow-xs hover:shadow-md space-y-2 ${
        isNetPositive
          ? 'border-teal-500/30 dark:border-teal-500/35 bg-gradient-to-br from-teal-500/[0.08] via-teal-500/[0.02] to-white dark:from-teal-500/[0.14] dark:via-teal-950/20 dark:to-slate-900 hover:border-teal-500/50'
          : 'border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 hover:border-rose-500/50'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-90 group-hover:opacity-100 transition-opacity ${
          isNetPositive ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
        }`} />
        <div className="flex items-center justify-between">
          <span className={`text-xs font-extrabold uppercase tracking-wider ${
            isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
          }`}>{netLabel}</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs transition-colors ${
              isNetPositive
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white'
            }`}
          >
            {isNetPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <p
          className={`text-2xl font-black font-mono ${
            isNetPositive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'
          }`}
        >
          {isNetPositive ? '+' : ''}
          {formatINR(finance.netCashFlow)}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
          Monthly: {finance.monthlyNetCashFlow >= 0 ? '+' : ''}
          {formatINR(finance.monthlyNetCashFlow)}
        </p>
      </div>

      {/* 4. Savings Rate / Overall Lifetime Metric Card */}
      <div className="group relative overflow-hidden p-5 rounded-2xl border border-indigo-500/30 dark:border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.02] to-white dark:from-indigo-500/[0.14] dark:via-indigo-950/20 dark:to-slate-900 hover:border-indigo-500/50 hover:-translate-y-px transition-all duration-200 shadow-xs hover:shadow-md space-y-2">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Savings Rate</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
          {finance.savingsRate !== null ? `${finance.savingsRate}%` : '—'}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
          Lifetime Spend: -{formatINR(finance.allTimeExpenses)}
        </p>
      </div>
    </div>
  );
};
