import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  CreditCard,
  FileText,
  ShoppingBag,
  Tv,
  Pill,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  History,
  Edit3,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { useI18n } from '../utils/i18n';
import { COUNTRY_DEFAULTS } from '../utils/currency';

// Dashboard Experience OS Components
import { DashboardGreeting } from '../components/dashboard/DashboardGreeting';
import { QuickActionCommandBar } from '../components/dashboard/QuickActionCommandBar';
import { FinancialSummaryGrid } from '../components/dashboard/FinancialSummaryGrid';
import { TodayOverview } from '../components/dashboard/TodayOverview';
import { UpcomingBillsCard } from '../components/dashboard/UpcomingBillsCard';
import { PendingTasksCard } from '../components/dashboard/PendingTasksCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { HomeMindInsightCard } from '../components/dashboard/HomeMindInsightCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../components/dashboard/DashboardErrorState';
import { computeDeterministicInsights } from '../components/dashboard/utils/dashboardUtils';

// Startup UI Components
import { HouseholdVitalRings } from '../components/dashboard/HouseholdVitalRings';
import { ActionableAIFeed } from '../components/dashboard/ActionableAIFeed';

// Modals
import { AddIncomeModal } from '../components/common/AddIncomeModal';
import { AddExpenseModal } from '../components/common/AddExpenseModal';
import { AddBillModal } from '../components/common/AddBillModal';
import { AddGroceryModal } from '../components/common/AddGroceryModal';
import { AddApplianceModal } from '../components/common/AddApplianceModal';
import { AddTaskModal } from '../components/common/AddTaskModal';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  JP: '🇯🇵',
  CA: '🇨🇦',
  AU: '🇦🇺',
  SG: '🇸🇬',
  AE: '🇦🇪',
  SA: '🇸🇦',
  CH: '🇨🇭',
  CN: '🇨🇳',
};

export const Dashboard: React.FC = () => {
  const { user, household } = useAuthStore();
  const { format, currencySymbol, country } = useSettingStore();
  const { t } = useI18n();

  const {
    data: summary,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    },
  });

  // Fetch live income entries
  const { data: incomeData, refetch: refetchIncomes } = useQuery({
    queryKey: ['dashboardIncomes'],
    queryFn: async () => {
      const res = await apiClient.get('/income');
      return Array.isArray(res.data) ? res.data : res.data?.incomes || [];
    },
  });

  // Active Modals & Edit States
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);

  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [actionCenterTab, setActionCenterTab] = useState<'bills' | 'tasks'>('bills');

  const countryDefaults = COUNTRY_DEFAULTS[country] || COUNTRY_DEFAULTS['US'];
  const flag = COUNTRY_FLAGS[country] || '🌐';

  // Current Month Telemetry Calculation
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const monthShort = now.toLocaleString('default', { month: 'short' });
  const year = now.getFullYear();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDay);
  const dateRangeStr = `${monthShort} 1 – ${monthShort} ${daysInMonth}, ${year}`;

  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpenses || 0;
  const overallExpenses = summary?.overallExpenses || 0;
  const monthlySavings =
    summary?.monthlySavings !== undefined
      ? summary.monthlySavings
      : monthlyIncome - monthlyExpenses;
  const overallSavings =
    summary?.overallSavings !== undefined
      ? summary.overallSavings
      : summary?.summary?.overallSavings || 0;
  const upcomingBillsTotal = summary?.upcomingBillsTotal || 0;
  const upcomingBills = summary?.upcomingBills || [];
  const pendingTasks = summary?.pendingTasks || [];
  const recentHistory = summary?.recent5History || [];
  const incomesList = Array.isArray(incomeData) ? incomeData : [];

  // Deterministic Insights
  const deterministicInsights = useMemo(() => {
    return computeDeterministicInsights({
      monthlyIncome,
      monthlyExpenses,
      upcomingBills,
      pendingTasks,
    });
  }, [monthlyIncome, monthlyExpenses, upcomingBills, pendingTasks]);

  // Today's transaction count
  const todayTransactionsCount = useMemo(() => {
    const today = new Date();
    return recentHistory.filter((item: any) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [recentHistory]);

  const handleRefreshAll = () => {
    refetch();
    refetchIncomes();
  };

  const handleEditIncome = (inc: any) => {
    setEditingIncome(inc);
    setShowIncomeModal(true);
  };

  const handleEditBill = (bill: any) => {
    setEditingBill(bill);
    setShowBillModal(true);
  };

  const handleMarkBillPaid = async (billId: string) => {
    try {
      await apiClient.put(`/bills/${billId}/pay`);
      handleRefreshAll();
    } catch (e) {
      console.error('Failed to mark bill paid', e);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    await apiClient.put(`/tasks/${taskId}/status`, { status: 'COMPLETED' });
    handleRefreshAll();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !summary) {
    return <DashboardErrorState onRetry={handleRefreshAll} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-200 pb-12">
      {/* 1. Contextual Personalized Greeting Hero & Real System Status */}
      <DashboardGreeting
        user={user}
        household={household}
        countryName={countryDefaults.countryName}
        flag={flag}
        daysRemaining={daysRemaining}
        monthName={monthName}
        pendingTasksCount={pendingTasks.length}
        upcomingBillsCount={upcomingBills.length}
        isReady={!loading && !error}
      />

      {/* 2. Quick Action Command Strip */}
      <QuickActionCommandBar
        onAddIncome={() => {
          setEditingIncome(null);
          setShowIncomeModal(true);
        }}
        onAddExpense={() => {
          setEditingExpense(null);
          setShowExpenseModal(true);
        }}
        onAddBill={() => {
          setEditingBill(null);
          setShowBillModal(true);
        }}
        onAddGrocery={() => setShowGroceryModal(true)}
        onAddTask={() => setShowTaskModal(true)}
        onOpenCommandPalette={() => {
          // Trigger keyboard event for Cmd+K command palette
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        }}
      />

      {/* 3. Financial Snapshot Summary Cards (Staggered animation & semantic accents) */}
      <FinancialSummaryGrid
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        overallExpenses={overallExpenses}
        monthlySavings={monthlySavings}
        overallSavings={overallSavings}
        format={format}
        dateRangeStr={dateRangeStr}
      />

      {/* 4. Today At A Glance (Real-time household status) */}
      <TodayOverview
        pendingTasksCount={pendingTasks.length}
        billsDueSoonCount={upcomingBills.length}
        todayTransactionsCount={todayTransactionsCount}
        onSelectTab={(tab) => setActionCenterTab(tab)}
      />

      {/* 5. Deterministic Smart Insights Card */}
      <HomeMindInsightCard
        insights={deterministicInsights}
        onAction={(tab) => setActionCenterTab(tab)}
      />

      {/* 6. High-Priority Action Center: Upcoming Bills & Due Tasks */}
      <div className="space-y-3">
        {/* Mobile View Toggle */}
        <div className="lg:hidden flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActionCenterTab('bills')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              actionCenterTab === 'bills'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bills & Rent</span>
            {upcomingBills.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 text-white font-bold">
                {upcomingBills.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActionCenterTab('tasks')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              actionCenterTab === 'tasks'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks & Chores</span>
            {pendingTasks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 text-white font-bold">
                {pendingTasks.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Upcoming Bills & Rent */}
          <div className={actionCenterTab === 'bills' ? 'block' : 'hidden lg:block'}>
            <UpcomingBillsCard
              bills={upcomingBills}
              totalDue={upcomingBillsTotal}
              format={format}
              onPayBill={handleMarkBillPaid}
              onEditBill={handleEditBill}
              onAddBill={() => {
                setEditingBill(null);
                setShowBillModal(true);
              }}
            />
          </div>

          {/* Pending Tasks */}
          <div className={actionCenterTab === 'tasks' ? 'block' : 'hidden lg:block'}>
            <PendingTasksCard
              tasks={pendingTasks}
              onCompleteTask={handleCompleteTask}
              onAddTask={() => setShowTaskModal(true)}
            />
          </div>
        </div>
      </div>

      {/* 7. Household Vital Rings & Health Score */}
      <HouseholdVitalRings
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlySavings={monthlySavings}
        taskStats={{
          total: pendingTasks.length + 5,
          completed: 5,
        }}
        pantryStats={{ total: 24, fresh: 21, expiringSoon: 3 }}
      />

      {/* 8. Actionable Suggestions Feed */}
      <ActionableAIFeed
        upcomingBills={upcomingBills}
        onOpenExpenseModal={() => {
          setEditingExpense(null);
          setShowExpenseModal(true);
        }}
        onOpenTaskModal={() => setShowTaskModal(true)}
      />

      {/* 9. Income & Earnings Overview Section with Edit Shortcut */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/25 dark:border-emerald-900/40 p-4 sm:p-6 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />{' '}
              Income & Earnings
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Track salary, freelance payments, dividends, and earnings for {monthName} {year}.
            </p>
          </div>
          <div className="text-right">
            <span className="text-base sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
              +{format(monthlyIncome)}
            </span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Monthly Total
            </span>
          </div>
        </div>

        {incomesList.length > 0 ? (
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-3">
            {incomesList.slice(0, 3).map((inc: any) => (
              <div
                key={inc.id}
                className="min-w-[210px] sm:min-w-0 p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-2xs group hover:border-emerald-500/40 transition-colors flex-shrink-0 sm:flex-shrink"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[110px]">
                      {inc.title}
                    </span>
                    <button
                      onClick={() => handleEditIncome(inc)}
                      className="p-1 text-slate-400 hover:text-blue-500 rounded-md transition-colors"
                      title="Edit Income"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider inline-block">
                    {inc.source || 'Salary'}
                  </span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                    {new Date(inc.date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{format(inc.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-2xs">
            <span className="text-[11px] sm:text-xs">
              No income entries logged yet for this month.
            </span>
            <button
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeModal(true);
              }}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Add Income
            </button>
          </div>
        )}
      </div>

      {/* 10. Recent Activity Panel (Real timeline data) */}
      <RecentActivityCard items={recentHistory} format={format} />

      {/* Modals with Edit Support */}
      <AddIncomeModal
        isOpen={showIncomeModal}
        initialData={editingIncome}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSuccess={handleRefreshAll}
      />
      <AddExpenseModal
        isOpen={showExpenseModal}
        initialData={editingExpense}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSuccess={handleRefreshAll}
      />
      <AddBillModal
        isOpen={showBillModal}
        initialData={editingBill}
        onClose={() => {
          setShowBillModal(false);
          setEditingBill(null);
        }}
        onSuccess={handleRefreshAll}
      />
      <AddGroceryModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        onSuccess={handleRefreshAll}
      />
      <AddApplianceModal
        isOpen={showApplianceModal}
        onClose={() => setShowApplianceModal(false)}
        onSuccess={handleRefreshAll}
      />
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};

export default Dashboard;
