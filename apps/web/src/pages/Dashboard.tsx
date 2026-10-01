import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  FileText,
  ShoppingBag,
  Tv,
  Pill,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  History,
  PiggyBank,
  Landmark,
  Hourglass,
  Command,
  ArrowUpRight,
  BadgeDollarSign,
  Edit3,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { useI18n } from '../utils/i18n';
import { COUNTRY_DEFAULTS } from '../utils/currency';

// New Startup UI Components
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

  const { data: summary, isLoading: loading, error, refetch } = useQuery({
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

  // Live Digital Clock state
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

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

  useEffect(() => {
    const updateClock = () => {
      const currentTime = new Date();
      setTimeStr(
        currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        currentTime.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpenses || 0;
  const overallExpenses = summary?.overallExpenses || 0;
  const monthlySavings =
    summary?.monthlySavings !== undefined ? summary.monthlySavings : monthlyIncome - monthlyExpenses;
  const overallSavings =
    summary?.overallSavings !== undefined ? summary.overallSavings : summary?.summary?.overallSavings || 0;
  const upcomingBillsTotal = summary?.upcomingBillsTotal || 0;
  const upcomingBills = summary?.upcomingBills || [];
  const pendingTasks = summary?.pendingTasks || [];
  const recentHistory = summary?.recent5History || [];
  const incomesList = Array.isArray(incomeData) ? incomeData : [];

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
    try {
      await apiClient.put(`/tasks/${taskId}/status`, { status: 'COMPLETED' });
      handleRefreshAll();
    } catch (e) {
      console.error('Failed to complete task', e);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-200 pb-8 sm:pb-12">
      {/* Mobile Compact Header */}
      <div className="sm:hidden glass-panel p-3.5 border-primary flex flex-col gap-2 rounded-2xl bg-panel/95 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-extrabold text-primary truncate">
              {t('dash.welcome', 'Welcome')}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider flex-shrink-0">
              {user?.role || 'OWNER'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <Hourglass className="w-2.5 h-2.5 animate-spin" />
              <span>{daysRemaining === 0 ? 'Last day' : `${daysRemaining}d left`}</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-secondary/80 border border-primary/60 text-[11px] font-mono font-bold text-primary flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-blue-500" />
              <span>{timeStr?.slice(0, 5) || '12:00'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-secondary pt-1 border-t border-primary/40">
          <span className="flex items-center gap-1 truncate font-medium">
            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{household?.name || t('dash.household', 'Home Residence')}</span>
          </span>
          <span className="flex-shrink-0 font-medium">{flag} {countryDefaults.countryName}</span>
        </div>
      </div>

      {/* Desktop / Tablet Welcome Header */}
      <div className="hidden sm:flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('dash.welcome', 'Welcome back')}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {user?.role || 'OWNER'}
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="font-medium text-slate-600 dark:text-slate-300">{household?.name || t('dash.household', 'Home Residence')}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{flag} {countryDefaults.countryName}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-400">Here's what's happening in your household today.</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
            <Hourglass className="w-3 h-3" />
            <span>{daysRemaining === 0 ? 'Last day of ' + monthName : `${daysRemaining}d left in ${monthName}`}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <div className="text-right">
              <span className="font-mono text-[13px] font-bold text-slate-800 dark:text-slate-100 block leading-none tracking-wide">
                {timeStr?.slice(0, 5) || '00:00'}
              </span>
              <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-indigo-400" /> {dateStr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
          <button
            onClick={() => { setEditingIncome(null); setShowIncomeModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-px text-white rounded-xl text-[11px] sm:text-[12px] font-bold shadow-sm shadow-emerald-500/20 active:scale-95 transition-all duration-150 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>{t('dash.addIncome', 'Income')}</span>
          </button>

          <button
            onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 hover:-translate-y-px text-white rounded-xl text-[11px] sm:text-[12px] font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all duration-150 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>{t('dash.addExpense', 'Expense')}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => { setEditingBill(null); setShowBillModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-px border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold active:scale-95 transition-all duration-150"
            >
              <Plus className="w-3 h-3 text-amber-500" />
              <span>{t('dash.addBill', 'Bill')}</span>
            </button>

            <button
              onClick={() => setShowGroceryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-px border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold active:scale-95 transition-all duration-150"
            >
              <Plus className="w-3 h-3 text-emerald-500" />
              <span>{t('dash.addGrocery', 'Grocery')}</span>
            </button>

            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-px border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold active:scale-95 transition-all duration-150"
            >
              <Plus className="w-3 h-3 text-purple-500" />
              <span>{t('dash.addTask', 'Task')}</span>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-mono flex-shrink-0">
          <Command className="w-3 h-3 text-blue-500" />
          <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[10px] shadow-sm">K</kbd>
          <span className="text-[10px]">{t('dash.quickMenu', 'Quick Menu')}</span>
        </div>
      </div>

      {/* Main Metric Cards (Compact 2-col on mobile, 5-col on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`glass-panel p-3 sm:p-5 animate-pulse space-y-2 sm:space-y-4 ${i === 5 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-3 bg-primary/10 rounded-full"></div>
                  <div className="w-4 h-4 bg-primary/10 rounded-full"></div>
                </div>
                <div className="w-20 h-5 bg-primary/10 rounded-full"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Monthly Income Card */}
            <div className="group p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    {t('dash.income', 'Income')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden sm:block">{dateRangeStr}</span>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono truncate leading-none">
                +{format(monthlyIncome)}
              </p>
              <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3 h-3" /> Earned this month
              </div>
            </div>

            {/* Monthly Expenses Card */}
            <div className="group p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                    {t('dash.spent', 'Spent')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden sm:block">{dateRangeStr}</span>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400 flex-shrink-0">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-red-600 dark:text-red-400 font-mono truncate leading-none">
                -{format(monthlyExpenses)}
              </p>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                This month's total
              </div>
            </div>

            {/* All-Time Spend */}
            <div className="group p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block truncate">
                  {t('dash.allTimeSpend', 'All-Time Spend')}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400 flex-shrink-0">
                  <BadgeDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono truncate leading-none">
                -{format(overallExpenses)}
              </p>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                All expenses logged
              </div>
            </div>

            {/* Saved this month */}
            <div className="group p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block truncate">
                  {t('dash.saved', 'Saved')}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                  <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className={`text-lg sm:text-2xl font-extrabold font-mono truncate leading-none ${monthlySavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                {monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
              </p>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                Remaining balance
              </div>
            </div>

            {/* Total Balance */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1 group p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block truncate">
                  {t('dash.totalBalance', 'Total Balance')}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                  <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className={`text-lg sm:text-2xl font-extrabold font-mono truncate leading-none ${overallSavings >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-red-600 dark:text-red-400'}`}>
                {overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
              </p>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                Net household assets
              </div>
            </div>
          </>
        )}
      </div>

      {/* High-Priority Action Center: Upcoming Bills & Due Tasks */}
      <div className="space-y-3">
        {/* Mobile View Toggle */}
        <div className="lg:hidden flex p-1 bg-secondary/80 rounded-2xl border border-primary/60">
          <button
            type="button"
            onClick={() => setActionCenterTab('bills')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              actionCenterTab === 'bills'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-secondary hover:text-primary'
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
                : 'text-secondary hover:text-primary'
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
          {/* 1. Upcoming Bills & Rent */}
          <div className={`${actionCenterTab === 'bills' ? 'flex' : 'hidden lg:flex'} glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-amber-500/30 bg-amber-50/40 dark:bg-gradient-to-br dark:from-slate-900 dark:via-amber-950/15 dark:to-slate-900 space-y-3 sm:space-y-4 shadow-xs flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-primary/60">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-primary flex items-center gap-1.5">
                      {t('dash.upcomingBills', 'Upcoming Bills & Rent')}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-muted">Room rent, electricity, Wi-Fi & due amounts</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base sm:text-xl font-extrabold text-red-600 dark:text-red-400 font-mono block">
                    -{format(upcomingBillsTotal)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                    Total Due
                  </span>
                </div>
              </div>

              {upcomingBills.length > 0 ? (
                <div className="divide-y divide-primary/60 pt-0.5 sm:pt-1">
                  {upcomingBills.slice(0, 4).map((bill: any) => (
                    <div
                      key={bill.id}
                      className="py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 group hover:bg-secondary/20 px-1 sm:px-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs font-bold text-primary truncate">{bill.title}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 uppercase tracking-wider flex-shrink-0">
                            {bill.category || 'Rent/Utility'}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 flex-shrink-0" />
                          <span>Due: {new Date(bill.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-extrabold text-red-600 dark:text-red-400 font-mono">
                          -{format(bill.amount)}
                        </span>
                        <button
                          onClick={() => handleMarkBillPaid(bill.id)}
                          className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg sm:rounded-xl text-[10px] font-bold transition-all shadow-2xs"
                          title="Mark as Paid"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="p-1 text-muted hover:text-blue-500 rounded-md transition-colors"
                          title="Edit Bill"
                        >
                          <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 sm:py-8 text-center text-xs text-secondary space-y-1">
                  <p className="font-semibold text-primary">No upcoming bills due right now! 🎉</p>
                  <p className="text-muted text-[10px] sm:text-[11px]">All room rent, mess and utility expenses are clear.</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-primary/60 flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] text-muted font-medium">
                {upcomingBills.length} unpaid bill{upcomingBills.length === 1 ? '' : 's'} registered
              </span>
              <button
                onClick={() => {
                  setEditingBill(null);
                  setShowBillModal(true);
                }}
                className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Add Bill / Rent
              </button>
            </div>
          </div>

          {/* 2. Pending Household Tasks */}
          <div className={`${actionCenterTab === 'tasks' ? 'flex' : 'hidden lg:flex'} glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-purple-500/30 bg-purple-50/40 dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950/15 dark:to-slate-900 space-y-3 sm:space-y-4 shadow-xs flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-primary/60">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-primary flex items-center gap-1.5">
                      {t('dash.pendingTasks', 'Pending Household Tasks')}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-muted">Daily chores, maintenance, grocery runs & schedules</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base sm:text-xl font-extrabold text-purple-700 dark:text-purple-300 font-mono block">
                    {pendingTasks.length}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                    Pending Tasks
                  </span>
                </div>
              </div>

              {pendingTasks.length > 0 ? (
                <div className="divide-y divide-primary/60 pt-0.5 sm:pt-1">
                  {pendingTasks.slice(0, 4).map((task: any) => (
                    <div
                      key={task.id}
                      className="py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 group hover:bg-secondary/20 px-1 sm:px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-muted hover:text-emerald-500 transition-colors p-0.5 rounded-full flex-shrink-0"
                          title="Mark Complete"
                        >
                          <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs font-bold text-primary block truncate">{task.title}</span>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                                task.priority === 'URGENT'
                                  ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                  : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                              }`}
                            >
                              {task.priority || 'NORMAL'}
                            </span>
                            {task.dueDate && (
                              <span className="text-[9px] sm:text-[10px] text-muted font-mono truncate">
                                Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-500/30 rounded-lg sm:rounded-xl text-[10px] font-bold transition-all shadow-2xs flex-shrink-0"
                      >
                        Done
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 sm:py-8 text-center text-xs text-secondary space-y-1">
                  <p className="font-semibold text-primary">All chores & tasks are completed! ✨</p>
                  <p className="text-muted text-[10px] sm:text-[11px]">No urgent routines or pending household chores.</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-primary/60 flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] text-muted font-medium">
                {pendingTasks.length} task{pendingTasks.length === 1 ? '' : 's'} to complete
              </span>
              <button
                onClick={() => setShowTaskModal(true)}
                className="text-[11px] sm:text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Add New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Home Health Score Rings */}
      <HouseholdVitalRings
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlySavings={monthlySavings}
        taskStats={{ total: 10, completed: 8 }}
        pantryStats={{ total: 24, fresh: 21, expiringSoon: 3 }}
      />

      {/* Simple Smart Suggestions */}
      <ActionableAIFeed
        upcomingBills={upcomingBills}
        onOpenExpenseModal={() => {
          setEditingExpense(null);
          setShowExpenseModal(true);
        }}
        onOpenTaskModal={() => setShowTaskModal(true)}
      />

      {/* Household Income & Earnings Overview Section with Edit Shortcut */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-emerald-500/30 bg-emerald-50/40 dark:bg-gradient-to-r dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900 space-y-3 sm:space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" /> Income & Earnings
            </span>
            <p className="text-[11px] sm:text-xs text-secondary hidden sm:block">
              Track salary, freelance payments, dividends, and earnings for {monthName} {year}.
            </p>
          </div>
          <div className="text-right">
            <span className="text-base sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono block">
              +{format(monthlyIncome)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Monthly Total
            </span>
          </div>
        </div>

        {incomesList.length > 0 ? (
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-3">
            {incomesList.slice(0, 3).map((inc: any) => (
              <div
                key={inc.id}
                className="min-w-[210px] sm:min-w-0 p-3 rounded-xl sm:rounded-2xl bg-panel border border-primary/80 flex items-center justify-between shadow-xs group hover:border-emerald-500/50 transition-colors flex-shrink-0 sm:flex-shrink"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary block truncate max-w-[110px]">{inc.title}</span>
                    <button
                      onClick={() => handleEditIncome(inc)}
                      className="p-1 text-muted hover:text-blue-500 rounded-md transition-colors"
                      title="Edit Income"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider inline-block">
                    {inc.source || 'Salary'}
                  </span>
                  <p className="text-[9px] sm:text-[10px] text-muted font-mono">
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
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-panel border border-primary/80 text-center text-xs text-secondary flex items-center justify-between shadow-xs">
            <span className="text-[11px] sm:text-xs">No income entries logged yet for this month.</span>
            <button
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeModal(true);
              }}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Add Income
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl border-primary overflow-hidden shadow-xs">
        <div className="p-3 sm:p-4 border-b border-primary/80 font-bold text-xs sm:text-sm text-primary flex items-center justify-between bg-secondary/30">
          <span className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" /> {t('dash.recentTransactions', 'Recent Transactions')}
          </span>
          <span className="text-[10px] sm:text-xs text-secondary font-mono font-medium">{t('dash.latestEntries', 'Latest Entries')}</span>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-xs text-muted space-y-1">
            <p className="font-semibold text-primary">{t('dash.noTransactions', 'No transactions recorded yet.')}</p>
            <p className="text-[10px] sm:text-[11px]">Add an expense or income entry to see history here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Native App Transaction Cards (No horizontal scroll required!) */}
            <div className="sm:hidden divide-y divide-primary/50">
              {recentHistory.map((item: any) => (
                <div key={item.id} className="py-2.5 px-3 flex items-center justify-between gap-2.5 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'INCOME'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {item.type === 'INCOME' ? <Wallet className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <span className="truncate max-w-[80px]">{item.category || item.type}</span>
                        <span>•</span>
                        <span>{new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold font-mono block ${
                        item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                      }`}
                    >
                      {item.type === 'INCOME' ? `+${format(item.amount)}` : `-${format(item.amount)}`}
                    </span>
                    <span className="text-[9px] text-muted block">{item.userName?.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Data Table */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-secondary uppercase tracking-wider font-bold border-b border-primary/80">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Member</th>
                  <th className="p-4 text-right">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-secondary font-medium">
                {recentHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-4 font-bold text-primary flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      ></span>
                      {item.title}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                        }`}
                      >
                        {item.category || item.type}
                      </span>
                    </td>
                    <td className="p-4 text-muted font-mono text-[11px]">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-secondary">{item.userName}</td>
                    <td
                      className={`p-4 text-right font-bold font-mono text-sm ${
                        item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                      }`}
                    >
                      {item.type === 'INCOME' ? `+${format(item.amount)}` : `-${format(item.amount)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
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
    </div>
  );
};

export default Dashboard;
