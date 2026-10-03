import React, { useState } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { AnalyticsPeriod } from './types';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AnalyticsPeriodFilter } from './components/AnalyticsPeriodFilter';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { CashFlowTrend } from './components/CashFlowTrend';
import { ExpenseCategoryChart } from './components/ExpenseCategoryChart';
import { IncomeSourceChart } from './components/IncomeSourceChart';
import { BillsAnalytics } from './components/BillsAnalytics';
import { TasksAnalytics } from './components/TasksAnalytics';
import { GroceriesAnalytics } from './components/GroceriesAnalytics';
import { AnalyticsInsight } from './components/AnalyticsInsight';
import { AnalyticsSkeleton } from './components/AnalyticsSkeleton';
import { AnalyticsErrorState } from './components/AnalyticsErrorState';
import { AnalyticsEmptyState } from './components/AnalyticsEmptyState';
import { useAuthStore } from '../../stores/useAuthStore';
import { canViewHouseholdAnalytics } from '../../utils/permissions';
import { ShieldAlert } from 'lucide-react';

export const AnalyticsWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const isAuthorized = canViewHouseholdAnalytics(user?.role);
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [customDates, setCustomDates] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, isLoading, isError, error, refetch } = useAnalytics({
    period,
    startDate: customDates.startDate,
    endDate: customDates.endDate,
    enabled: isAuthorized,
  });


  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
  };

  const handleDateChange = (start?: string, end?: string) => {
    setCustomDates({ startDate: start, endDate: end });
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Household Analytics Restricted</span>
          </div>
          <p className="text-xs leading-relaxed">
            Household financial trends, expense category breakdowns, and income metrics are restricted to household Owners and Co-Owners.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <AnalyticsErrorState
          message={(error as Error)?.message || 'Failed to load household analytics.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Check if completely empty across all domains
  const isCompletelyEmpty =
    data.counts.expensesCount === 0 &&
    data.counts.incomesCount === 0 &&
    data.counts.billsCount === 0 &&
    data.counts.tasksCount === 0 &&
    data.counts.groceriesCount === 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <AnalyticsHeader
        transactionCount={data.finance.transactionCount}
        periodLabel={data.period.label}
      />

      {/* Period Filter Bar */}
      <AnalyticsPeriodFilter
        selectedPeriod={period}
        onSelectPeriod={handlePeriodChange}
        startDate={customDates.startDate}
        endDate={customDates.endDate}
        onDateChange={handleDateChange}
      />

      {isCompletelyEmpty ? (
        <AnalyticsEmptyState
          isFiltered={period !== 'all'}
          onResetFilter={() => setPeriod('all')}
        />
      ) : (
        <>
          {/* Top 4 Summary Cards */}
          <AnalyticsSummary data={data} />

          {/* Cash Flow Trends */}
          <CashFlowTrend data={data.trends.monthlyCashFlow} />

          {/* Categorical Breakdowns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseCategoryChart
              categories={data.categories.expenses}
              totalAmount={data.finance.periodExpenses}
            />
            <IncomeSourceChart
              sources={data.categories.income}
              totalAmount={data.finance.periodIncome}
            />
          </div>

          {/* Household Telemetry Grid (Bills, Tasks, Groceries) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BillsAnalytics bills={data.bills} />
            <TasksAnalytics tasks={data.tasks} />
            <GroceriesAnalytics groceries={data.groceries} />
          </div>

          {/* Deterministic Household Insights */}
          <AnalyticsInsight insights={data.insights} />
        </>
      )}
    </div>
  );
};
