import React from 'react';
import {
  Wallet,
  CreditCard,
  BadgeDollarSign,
  PiggyBank,
  Landmark,
} from 'lucide-react';
import { FinancialSummaryCard } from './FinancialSummaryCard';

interface FinancialSummaryGridProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  overallExpenses: number;
  monthlySavings: number;
  overallSavings: number;
  format: (amount: number) => string;
  dateRangeStr: string;
}

export const FinancialSummaryGrid: React.FC<FinancialSummaryGridProps> = ({
  monthlyIncome,
  monthlyExpenses,
  overallExpenses,
  monthlySavings,
  overallSavings,
  format,
  dateRangeStr,
}) => {
  return (
    <section aria-label="Financial Snapshot">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* 1. Monthly Income */}
        <FinancialSummaryCard
          title="Income"
          period={dateRangeStr}
          value={monthlyIncome}
          formattedValue={`+${format(monthlyIncome)}`}
          icon={Wallet}
          contextLine="Earned this month"
          accent="emerald"
          delay={0}
        />

        {/* 2. Monthly Expenses */}
        <FinancialSummaryCard
          title="Spent"
          period={dateRangeStr}
          value={monthlyExpenses}
          formattedValue={`-${format(monthlyExpenses)}`}
          icon={CreditCard}
          contextLine="This month's total"
          accent="rose"
          delay={40}
        />

        {/* 3. All-Time Spend */}
        <FinancialSummaryCard
          title="All-Time Spend"
          period="Cumulative"
          value={overallExpenses}
          formattedValue={`-${format(overallExpenses)}`}
          icon={BadgeDollarSign}
          contextLine="All expenses logged"
          accent="rose"
          delay={80}
        />

        {/* 4. Saved This Month */}
        <FinancialSummaryCard
          title="Saved"
          period="Net Month"
          value={monthlySavings}
          formattedValue={monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
          icon={PiggyBank}
          contextLine={monthlySavings >= 0 ? 'Remaining surplus' : 'Current month deficit'}
          accent={monthlySavings >= 0 ? 'teal' : 'rose'}
          delay={120}
        />

        {/* 5. Total Balance */}
        <FinancialSummaryCard
          title="Total Balance"
          period="Household Reserves"
          value={overallSavings}
          formattedValue={overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
          icon={Landmark}
          contextLine="Net household assets"
          accent={overallSavings >= 0 ? 'violet' : 'rose'}
          delay={160}
          isFullWidthOnMobile
        />
      </div>
    </section>
  );
};
