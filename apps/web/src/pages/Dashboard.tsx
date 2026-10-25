import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Briefcase,
  Laptop,
  Gift,
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
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { HomeMindInsightCard } from '../components/dashboard/HomeMindInsightCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../components/dashboard/DashboardErrorState';
import { computeDeterministicInsights } from '../components/dashboard/utils/dashboardUtils';

// Startup UI Components
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
import { useHousehold } from '../features/household/hooks/useHousehold';
import { MobileDashboard } from '../components/dashboard/MobileDashboard';
import { MemberDetailDrawer } from '../features/household/components/MemberDetailDrawer';
import { useRealtimeNotifications } from '../contexts/RealtimeNotificationContext';
import { HouseholdMember } from '../types';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [welcomeAlert, setWelcomeAlert] = useState<boolean>(() => {
    return Boolean((location.state as any)?.justLoggedIn);
  });

  React.useEffect(() => {
    if (welcomeAlert) {
      try {
        window.history.replaceState({}, document.title);
      } catch (e) {}

      const timer = setTimeout(() => {
        setWelcomeAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [welcomeAlert]);

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

  // Real Household Members Integration
  const { members: rawMembers, loadingMembers } = useHousehold();
  const { totalUnread } = useRealtimeNotifications();

  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);

  const handleMemberClick = (member: HouseholdMember) => {
    setSelectedMember(member);
    setShowMemberDetail(true);
  };

  const membersList: HouseholdMember[] = useMemo(() => {
    if (rawMembers && rawMembers.length > 0) return rawMembers;
    if (user) {
      return [
        {
          id: user.id,
          name: user.name || 'Owner',
          email: user.email,
          role: user.role || 'OWNER',
          avatar: user.avatar,
          avatarUrl: user.avatarUrl,
        } as HouseholdMember,
      ];
    }
    return [];
  }, [rawMembers, user]);

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


  // Real data-driven household insight (Part A.6 - Real Household Insight)
  const realHouseholdInsight = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Food & Dining / Weekly spending
    const weekExpenses = recentHistory.filter(
      (item: any) => item.type === 'EXPENSE' && new Date(item.date) >= sevenDaysAgo
    );
    const foodExpenses = weekExpenses
      .filter(
        (item: any) =>
          (item.category || '').toLowerCase().includes('food') ||
          (item.category || '').toLowerCase().includes('dining')
      )
      .reduce((acc: number, item: any) => acc + (item.amount || 0), 0);

    if (foodExpenses > 0) {
      return {
        tag: 'Food & Dining',
        text: `You spent ${format(foodExpenses)} on Food & Dining this week.`,
      };
    }

    // 2. Bills due in next 5 days
    const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const urgentBills = upcomingBills.filter(
      (b: any) => b.status !== 'PAID' && new Date(b.dueDate) <= fiveDaysAhead
    );
    if (urgentBills.length > 0) {
      return {
        tag: 'Upcoming Bills',
        text: `${urgentBills.length} ${urgentBills.length === 1 ? 'bill is' : 'bills are'} due in the next 5 days.`,
      };
    }

    // 3. Groceries needing purchase
    const urgentGroceries = groceriesList.filter(
      (g: any) => g.status === 'LOW_STOCK' || g.status === 'OUT_OF_STOCK'
    );
    if (urgentGroceries.length > 0) {
      return {
        tag: 'Pantry Restock',
        text: `${urgentGroceries.length} grocery ${urgentGroceries.length === 1 ? 'item still needs' : 'items still need'} to be purchased.`,
      };
    }

    // 4. Monthly savings
    if (monthlySavings > 0) {
      return {
        tag: 'Savings Milestone',
        text: `Your household has saved ${format(monthlySavings)} so far this month.`,
      };
    }

    return null;
  }, [recentHistory, upcomingBills, groceriesList, monthlySavings, format]);

  const getIncomeSourceIcon = (source?: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('salary') || s.includes('job') || s.includes('work')) {
      return <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (s.includes('freelance') || s.includes('client') || s.includes('project')) {
      return <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
    if (s.includes('family') || s.includes('gift') || s.includes('parent') || s.includes('allowance')) {
      return <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    return <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  };

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


  // Prevent flash of owner financials during initial load (Part 46)
  if (loading) {
    return <DashboardSkeleton showFinancials={isOwnerOrCoOwner} />;
  }

  if (error && !summary) {
    return <DashboardErrorState onRetry={handleRefreshAll} />;
  }

  return (
    <>
      {/* ── MOBILE DASHBOARD (<768px): Strictly matches REFERENCE 2 ── */}
      <div className="block md:hidden">
        <MobileDashboard
          members={membersList}
          onInviteClick={() => setShowInviteModal(true)}
          onMemberClick={handleMemberClick}
          onToggleSidebar={() => {
            window.dispatchEvent(new CustomEvent('toggle_mobile_sidebar'));
          }}
          onOpenNotifications={() => {
            window.dispatchEvent(new CustomEvent('open_notifications'));
          }}
          unreadCount={totalUnread}
          pendingTasks={pendingTasks}
          upcomingBills={upcomingBills}
          recentHistory={recentHistory}
          groceriesList={groceriesList}
          format={format}
        />
      </div>

      {/* ── DESKTOP & TABLET DASHBOARD (>=768px): 100% PRESERVED LAYOUT ── */}
      <div className="hidden md:block space-y-3 sm:space-y-4 animate-in fade-in duration-200 pb-12">
        {/* 0. Compact Horizontal Household Header with Family Avatars */}
        <HouseholdHeader
          memberCount={summary?.activeMembersCount || summary?.membersCount || membersList.length || 2}
          onInviteClick={() => setShowInviteModal(true)}
          members={membersList}
          onMemberClick={handleMemberClick}
          loadingMembers={loadingMembers}
        />

      {/* One-time Welcome Home Banner after signature entrance */}
      {welcomeAlert && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-400/40 backdrop-blur-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Welcome home 👋</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  Online
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-indigo-200">
                Your household operating system is ready and synchronized.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setWelcomeAlert(false);
              try { window.history.replaceState({}, document.title); } catch (e) {}
            }}
            className="text-xs font-semibold text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

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
            userRole={user?.role}
            onSelectTab={(tab) => setActionCenterTab(tab)}
            tasks={pendingTasks}
            bills={upcomingBills}
            groceries={groceriesList}
            format={format}
          />

          {/* Optional Mini Household Insight Card (Part A.6 - Real Data Only) */}
          {realHouseholdInsight && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-800/40 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Household Insight
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/20">
                      {realHouseholdInsight.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {realHouseholdInsight.text}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 flex-shrink-0 group"
              >
                <span>Analytics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Deterministic Smart Insights Card */}
          <HomeMindInsightCard
            insights={deterministicInsights}
            onAction={(tab) => setActionCenterTab(tab)}
          />


          {/* Actionable Suggestions Feed */}
          <ActionableAIFeed
            upcomingBills={upcomingBills}
            groceries={groceriesList}
            pendingTasks={pendingTasks}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            monthlySavings={monthlySavings}
            onOpenExpenseModal={() => {
              setEditingExpense(null);
              setShowExpenseModal(true);
            }}
            onOpenTaskModal={() => setShowTaskModal(true)}
          />

          {/* Income & Earnings Overview Section with Edit Shortcut (Part A.4) */}
          <div className="rounded-2xl sm:rounded-3xl bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-500/25 dark:border-emerald-800/40 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />{' '}
                  Income & Earnings
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Verified salary, freelance income, and allowances for {monthName} {year}.
                </p>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  +{format(monthlyIncome)}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Monthly Total
                </span>
              </div>
            </div>

            {incomesList.length > 0 ? (
              <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-3">
                {incomesList.slice(0, 6).map((inc: any) => (
                  <div
                    key={inc.id}
                    onClick={() => handleEditIncome(inc)}
                    className="min-w-[210px] sm:min-w-0 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-500/20 dark:border-emerald-700/40 flex items-center justify-between shadow-2xs group hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer flex-shrink-0 sm:flex-shrink"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {getIncomeSourceIcon(inc.source || inc.title)}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[110px] group-hover:text-emerald-600 transition-colors">
                            {inc.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditIncome(inc);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-500 rounded-md transition-colors"
                            title="Edit Income"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px]">
                          <span className="px-1.5 py-0.2 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider inline-block">
                            {inc.source || 'Salary'}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {new Date(inc.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono flex-shrink-0">
                      +{format(inc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] sm:text-xs font-medium">
                  No income entries logged yet for {monthName} {year}.
                </span>
                <button
                  onClick={() => {
                    setEditingIncome(null);
                    setShowIncomeModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
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
            userRole={user?.role}
            onSelectTab={(tab) => setActionCenterTab(tab)}
            tasks={pendingTasks}
            bills={upcomingBills}
            groceries={groceriesList}
            format={format}
          />


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
      </div>

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

      {/* Member Detail Drawer */}
      <MemberDetailDrawer
        member={selectedMember}
        isOpen={showMemberDetail}
        onClose={() => setShowMemberDetail(false)}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        activeTasksCount={pendingTasks.filter((t: any) => t.assignedTo === selectedMember?.id).length}
        onOpenRoleChange={() => {}}
        onOpenTransferOwnership={() => {}}
        onOpenRemoveMember={() => {}}
      />
    </>
  );
};

export default Dashboard;
