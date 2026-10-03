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
      <div className="glass-panel p-5 border-primary/80 space-y-2 hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{incomeLabel}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-primary font-mono">
          +{formatINR(finance.periodIncome)}
        </p>
        <p className="text-[11px] text-muted truncate">
          Lifetime: +{formatINR(finance.allTimeIncome)}
        </p>
      </div>

      {/* 2. Expense Card */}
      <div className="glass-panel p-5 border-primary/80 space-y-2 hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{expenseLabel}</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-rose-500 font-mono">
          -{formatINR(finance.periodExpenses)}
        </p>
        <p className="text-[11px] text-muted truncate">
          Lifetime: -{formatINR(finance.allTimeExpenses)}
        </p>
      </div>

      {/* 3. Net Cash Flow Card */}
      <div className="glass-panel p-5 border-primary/80 space-y-2 hover:border-primary transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">{netLabel}</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isNetPositive
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-rose-500/10 text-rose-500'
            }`}
          >
            {isNetPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <p
          className={`text-2xl font-extrabold font-mono ${
            isNetPositive ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {isNetPositive ? '+' : ''}
          {formatINR(finance.netCashFlow)}
        </p>
        <p className="text-[11px] text-muted truncate">
          Monthly: {finance.monthlyNetCashFlow >= 0 ? '+' : ''}
          {formatINR(finance.monthlyNetCashFlow)}
        </p>
      </div>

      {/* 4. Savings Rate / Overall Lifetime Metric Card */}
      <div className="glass-panel p-5 border-primary/80 space-y-2 hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Savings Rate</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-blue-500 font-mono">
          {finance.savingsRate !== null ? `${finance.savingsRate}%` : '—'}
        </p>
        <p className="text-[11px] text-muted truncate">
          Lifetime Spend: -{formatINR(finance.allTimeExpenses)}
        </p>
      </div>
    </div>
  );
};
