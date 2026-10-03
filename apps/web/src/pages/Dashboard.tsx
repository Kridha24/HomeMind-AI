import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { useI18n } from '../utils/i18n';
import { COUNTRY_DEFAULTS } from '../utils/currency';
import { canViewHouseholdFinancials } from '../utils/permissions';

// Dashboard Experience Components
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
import { HouseholdHeader } from '../components/common/HouseholdHeader';
import { InviteMemberModal } from '../features/household/components/InviteMemberModal';

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
  const queryClient = useQueryClient();
  const { user, household, updateUser } = useAuthStore();
  const { format, currencySymbol, country } = useSettingStore();
  const { t } = useI18n();

  const isOwnerOrCoOwner = canViewHouseholdFinancials(user?.role);

  // Scoped query keys by householdId, userId, and role (Part 43)
  const {
    data: summary,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboardSummary', household?.id, user?.id, user?.role],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    },
  });

  // Fetch live income entries (only for owner/co-owner or personal entries)
  const { data: incomeData, refetch: refetchIncomes } = useQuery({
    queryKey: ['dashboardIncomes', household?.id, user?.id, user?.role],
    queryFn: async () => {
      const res = await apiClient.get('/income');
      return Array.isArray(res.data) ? res.data : res.data?.incomes || [];
    },
    enabled: Boolean(isOwnerOrCoOwner),
  });

  // Fetch household groceries for member overview
  const { data: groceryData, refetch: refetchGroceries } = useQuery({
    queryKey: ['dashboardGroceries', household?.id],
    queryFn: async () => {
      const res = await apiClient.get('/inventory');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
    staleTime: 1000 * 30,
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionCenterTab, setActionCenterTab] = useState<'bills' | 'tasks'>('tasks');

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

  const monthlyIncome = summary?.monthlyIncome ?? summary?.metrics?.monthlyIncome ?? 0;
  const monthlyExpenses = summary?.monthlyExpenses ?? summary?.metrics?.monthlyExpenses ?? 0;
  const overallExpenses = summary?.overallExpenses ?? summary?.metrics?.allTimeExpenses ?? 0;
  const overallIncome = summary?.overallIncome ?? summary?.metrics?.allTimeIncome ?? 0;
  const overallSavings =
    summary?.overallSavings !== undefined
      ? summary.overallSavings
      : summary?.metrics?.netBalance !== undefined
      ? summary.metrics.netBalance
      : summary?.summary?.overallSavings ?? (overallIncome - overallExpenses);
  const monthlySavings =
    summary?.monthlySavings !== undefined
      ? summary.monthlySavings
      : summary?.metrics?.savingsRate !== undefined
      ? monthlyIncome - monthlyExpenses
      : monthlyIncome - monthlyExpenses;
  const upcomingBills = summary?.upcomingBills || [];
  const upcomingBillsTotal =
    summary?.upcomingBillsTotal !== undefined && summary.upcomingBillsTotal > 0
      ? summary.upcomingBillsTotal
      : upcomingBills
          .filter((b: any) => b.status !== 'PAID')
          .reduce((acc: number, b: any) => acc + (b.amount || 0), 0);
  const pendingTasks = summary?.pendingTasks || [];
  const recentHistory = summary?.recent5History || [];
  const incomesList = Array.isArray(incomeData) ? incomeData : [];
  const groceriesList = Array.isArray(groceryData) ? groceryData : [];

  // Deterministic Insights (Owner / Co-Owner)
  const deterministicInsights = useMemo(() => {
    return computeDeterministicInsights({
      monthlyIncome,
      monthlyExpenses,
      upcomingBills,
      pendingTasks,
    });
  }, [monthlyIncome, monthlyExpenses, upcomingBills, pendingTasks]);

  // Today's transaction count (for Owner)
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
    if (isOwnerOrCoOwner) {
      refetchIncomes();
    }
    refetchGroceries();
  };

  React.useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const onUpdate = () => {
      handleRefreshAll();
    };

    const onRoleUpdated = (payload?: any) => {
      const targetUserId = payload?.member?.id || payload?.userId;
      if (targetUserId && targetUserId === user?.id) {
        const newRole = payload?.newRole || payload?.member?.role;
        if (newRole) {
          updateUser({ role: newRole });
        }
        // Invalidate sensitive caches immediately on role promotion or downgrade (Part 7, 8)
        queryClient.removeQueries({ queryKey: ['dashboardSummary'] });
        queryClient.removeQueries({ queryKey: ['dashboardIncomes'] });
        queryClient.removeQueries({ queryKey: ['householdAnalytics'] });
        queryClient.removeQueries({ queryKey: ['expenses'] });
        queryClient.removeQueries({ queryKey: ['incomes'] });
      }
      handleRefreshAll();
    };

    socket.on('expense_created', onUpdate);
    socket.on('income_created', onUpdate);
    socket.on('bill_paid', onUpdate);
    socket.on('task_updated', onUpdate);
    socket.on('transaction_created', onUpdate);
    socket.on('role_updated', onRoleUpdated);

    return () => {
      socket.off('expense_created', onUpdate);
      socket.off('income_created', onUpdate);
      socket.off('bill_paid', onUpdate);
      socket.off('task_updated', onUpdate);
      socket.off('transaction_created', onUpdate);
      socket.off('role_updated', onRoleUpdated);
    };
  }, [household?.id, user?.id, user?.role, isOwnerOrCoOwner]);

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

  // Prevent flash of owner financials during initial load (Part 46)
  if (loading) {
    return <DashboardSkeleton showFinancials={isOwnerOrCoOwner} />;
  }

  if (error && !summary) {
    return <DashboardErrorState onRetry={handleRefreshAll} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200 pb-12">
      {/* 0. Compact Horizontal Household Header */}
      <HouseholdHeader
        memberCount={summary?.activeMembersCount || summary?.membersCount || 2}
        onInviteClick={() => setShowInviteModal(true)}
      />

      {/* 1. Contextual Personalized Greeting Hero & Bold Localized Date */}
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

      {/* 2. Compact Quick Action Command Strip */}
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
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        }}
      />

      {/* 3. Conditional Layout: OWNER & CO-OWNER vs MEMBER */}
      {isOwnerOrCoOwner ? (
        /* ==================== OWNER & CO-OWNER DASHBOARD (Part 6) ==================== */
        <>
          {/* Financial Snapshot Summary Cards (Compact 120-135px height) */}
          <FinancialSummaryGrid
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            overallExpenses={overallExpenses}
            monthlySavings={monthlySavings}
            overallSavings={overallSavings}
            format={format}
            dateRangeStr={dateRangeStr}
          />

          {/* Today At A Glance (Real-time household status) */}
          <TodayOverview
            pendingTasksCount={pendingTasks.length}
            billsDueSoonCount={upcomingBills.length}
            todayTransactionsCount={todayTransactionsCount}
            onSelectTab={(tab) => setActionCenterTab(tab)}
          />

          {/* Deterministic Smart Insights Card */}
          <HomeMindInsightCard
            insights={deterministicInsights}
            onAction={(tab) => setActionCenterTab(tab)}
          />

          {/* High-Priority Action Center: Upcoming Bills & Due Tasks */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

              <PendingTasksCard
                tasks={pendingTasks}
                onCompleteTask={handleCompleteTask}
                onAddTask={() => setShowTaskModal(true)}
              />
            </div>
          </div>

          {/* Household Vital Rings */}
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

          {/* Actionable Suggestions Feed */}
          <ActionableAIFeed
            upcomingBills={upcomingBills}
            onOpenExpenseModal={() => {
              setEditingExpense(null);
              setShowExpenseModal(true);
            }}
            onOpenTaskModal={() => setShowTaskModal(true)}
          />

          {/* Income & Earnings Overview Section with Edit Shortcut */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/25 dark:border-emerald-900/40 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />{' '}
                  Income & Earnings
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Track salary, freelance payments, and earnings for {monthName} {year}.
                </p>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
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
                    className="min-w-[210px] sm:min-w-0 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-2xs group hover:border-emerald-500/40 transition-colors flex-shrink-0 sm:flex-shrink"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
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
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider inline-block">
                        {inc.source || 'Salary'}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {new Date(inc.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{format(inc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] sm:text-xs">
                  No income entries logged yet for this month.
                </span>
                <button
                  onClick={() => {
                    setEditingIncome(null);
                    setShowIncomeModal(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Income
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity Panel */}
          <RecentActivityCard items={recentHistory} format={format} />
        </>
      ) : (
        /* ==================== NORMAL MEMBER DASHBOARD (Part 5) ==================== */
        <div className="space-y-4">
          {/* Today At A Glance (Member-safe overview: tasks & groceries) */}
          <TodayOverview
            pendingTasksCount={pendingTasks.length}
            billsDueSoonCount={upcomingBills.length}
            todayTransactionsCount={groceriesList.length}
            onSelectTab={(tab) => setActionCenterTab(tab)}
          />

          {/* Action Center Grid: My Assigned Tasks & Household Bills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Assigned & Household Tasks */}
            <PendingTasksCard
              tasks={pendingTasks}
              onCompleteTask={handleCompleteTask}
              onAddTask={() => setShowTaskModal(true)}
            />

            {/* Household Shared Bills */}
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

          {/* Shared Household Groceries Snapshot */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Shared Household Groceries
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Items and essentials in stock or needed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroceryModal(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {groceriesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {groceriesList.slice(0, 6).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.quantity} {item.unit || ''} • {item.category || 'General'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK'
                          ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      }`}
                    >
                      {item.status === 'LOW_STOCK' ? 'Low' : item.status === 'OUT_OF_STOCK' ? 'Out' : 'In Stock'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Pantry and groceries are up to date.
              </div>
            )}
          </div>

          {/* Safe Household Activity / Announcements */}
          <RecentActivityCard items={recentHistory} format={format} />
        </div>
      )}

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
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        householdName={household?.name || 'Home Residence'}
        inviteCode={household?.inviteCode || ''}
      />
    </div>
  );
};

export default Dashboard;
