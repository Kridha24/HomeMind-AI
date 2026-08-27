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

  // Active Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

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
  const recentHistory = summary?.recent5History || [];
  const incomesList = Array.isArray(incomeData) ? incomeData : [];

  const handleRefreshAll = () => {
    refetch();
    refetchIncomes();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Real-time Location & Clock Header */}
      <div className="glass-panel p-6 border-primary flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              {t('dash.welcome', 'Welcome')}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {user?.role || 'OWNER'}
            </span>
          </div>
          <p className="text-xs text-secondary flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-primary">{household?.name || t('dash.household', 'Home Residence')}</span>
            <span className="text-muted">•</span>
            <span>
              {flag} {countryDefaults.countryName}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Days Left in Month Badge */}
          <div className="glass-panel px-3.5 py-2 border-emerald-500/30 flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 text-xs font-semibold shadow-sm">
            <Hourglass className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>
              {daysRemaining === 0
                ? 'Last Day of ' + monthName
                : `${daysRemaining} ${t('dash.daysLeft', 'Days Left in')} ${monthName}`}
            </span>
          </div>

          {/* Real-time Digital Clock */}
          <div className="glass-panel px-4 py-2.5 border-blue-500/30 flex items-center gap-3 bg-panel/90 shadow-sm">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="text-right">
              <span className="font-mono text-base font-extrabold text-primary block tracking-wider leading-none">
                {timeStr || '12:00:00 PM'}
              </span>
              <span className="text-[10px] font-semibold text-secondary flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-indigo-500" /> {dateStr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar + Command Palette Shortcut */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-panel/90 border border-primary/80 backdrop-blur-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* + Add Income Action Button */}
          <button
            onClick={() => setShowIncomeModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('dash.addIncome', 'Add Income')}</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('dash.addExpense', 'Add Expense')}</span>
          </button>

          <button
            onClick={() => setShowBillModal(true)}
            className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 border border-primary/60 text-primary rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('dash.addBill', 'Add Bill')}</span>
          </button>

          <button
            onClick={() => setShowGroceryModal(true)}
            className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 border border-primary/60 text-primary rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('dash.addGrocery', 'Add Grocery')}</span>
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 border border-primary/60 text-primary rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-purple-500" />
            <span>{t('dash.addTask', 'Add Task')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-primary/60 text-[11px] text-secondary font-mono">
          <Command className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-panel font-bold text-primary border border-primary/80 shadow-xs">
            ⌘K
          </kbd>
          <span>{t('dash.quickMenu', 'for Quick Menu')}</span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-panel p-5 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-3 bg-primary/10 rounded-full"></div>
                  <div className="w-4 h-4 bg-primary/10 rounded-full"></div>
                </div>
                <div className="w-24 h-6 bg-primary/10 rounded-full"></div>
                <div className="w-20 h-2 bg-primary/10 rounded-full mt-2"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Monthly Income Card */}
            <div className="glass-panel p-5 border-emerald-500/30 bg-emerald-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    {t('dash.income', 'Income')} ({monthShort})
                  </span>
                  <span className="text-[10px] text-muted font-mono block">{dateRangeStr}</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-primary font-mono pt-1">
                +{format(monthlyIncome)}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-primary/60 text-[10px]">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3" /> Total Earned
                </span>
              </div>
            </div>

            {/* Monthly Expenses Card with (-) sign */}
            <div className="glass-panel p-5 border-red-500/30 bg-red-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                    {t('dash.spent', 'Spent')} ({monthShort})
                  </span>
                  <span className="text-[10px] text-muted font-mono block">{dateRangeStr}</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400 font-mono pt-1">
                -{format(monthlyExpenses)}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-primary/60 text-[10px]">
                <span className="text-red-700 dark:text-red-400 font-semibold">Total Spent This Month</span>
              </div>
            </div>

            {/* Lifetime Overall Expenses Card with (-) sign */}
            <div className="glass-panel p-5 border-rose-500/30 bg-rose-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-900 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  {t('dash.allTimeSpend', 'All-time Spend')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono pt-1">
                -{format(overallExpenses)}
              </p>
              <div className="pt-1 border-t border-primary/60 text-[10px] text-muted font-medium">
                Total Expenses Logged
              </div>
            </div>

            {/* Monthly Net Savings Card (Income - Expenses) */}
            <div className="glass-panel p-5 border-teal-500/30 bg-teal-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  {t('dash.saved', 'Saved')} ({monthShort})
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <p
                className={`text-xl font-extrabold font-mono pt-1 ${
                  monthlySavings >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
              </p>
              <div className="pt-1 border-t border-primary/60 text-[10px] text-muted font-medium">
                Income Left Over
              </div>
            </div>

            {/* Overall Lifetime Balance Card */}
            <div className="glass-panel p-5 border-purple-500/30 bg-purple-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  {t('dash.totalBalance', 'Total Balance')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <p
                className={`text-xl font-extrabold font-mono pt-1 ${
                  overallSavings >= 0 ? 'text-purple-800 dark:text-purple-300' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
              </p>
              <div className="pt-1 border-t border-primary/60 text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
                Net Household Assets
              </div>
            </div>
          </>
        )}
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
        onOpenExpenseModal={() => setShowExpenseModal(true)}
        onOpenTaskModal={() => setShowTaskModal(true)}
      />

      {/* Household Income & Earnings Overview Section */}
      <div className="glass-panel p-6 border-emerald-500/30 bg-emerald-50/40 dark:bg-gradient-to-r dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Household Income & Earnings
            </span>
            <p className="text-xs text-secondary">
              Track salary, freelance payments, dividends, and earnings for {monthName} {year}.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono block">
              +{format(monthlyIncome)}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Total Monthly Income
            </span>
          </div>
        </div>

        {incomesList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {incomesList.slice(0, 3).map((inc: any) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-2xl bg-panel border border-primary/80 flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary block">{inc.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider inline-block">
                    {inc.source || 'Salary'}
                  </span>
                  <p className="text-[10px] text-muted font-mono">
                    {new Date(inc.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{format(inc.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-panel border border-primary/80 text-center text-xs text-secondary flex items-center justify-between shadow-sm">
            <span>No income entries logged yet for this month.</span>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Income
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Bills & Rent Section */}
      <div className="glass-panel p-6 border-amber-500/30 bg-amber-50/40 dark:bg-gradient-to-r dark:from-slate-900 dark:via-amber-950/10 dark:to-slate-900 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {t('dash.upcomingBills', 'Upcoming Bills & Rent')}
            </span>
            <p className="text-xs text-secondary">
              {t('dash.upcomingBillsDesc', 'Track room rent, mess fees, Wi-Fi, and electricity bills due this month.')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 font-mono block">
              -{format(upcomingBillsTotal)}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
              {t('dash.totalBillsDue', 'Total Bills Due')}
            </span>
          </div>
        </div>

        {upcomingBills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {upcomingBills.map((bill: any) => (
              <div
                key={bill.id}
                className="p-3.5 rounded-2xl bg-panel border border-primary/80 flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary block">{bill.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 uppercase tracking-wider inline-block">
                    {bill.category || 'Rent/Utility'}
                  </span>
                  <p className="text-[10px] text-muted font-mono">
                    Due: {new Date(bill.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-red-600 dark:text-red-400 font-mono">
                  -{format(bill.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-panel border border-primary/80 text-center text-xs text-secondary flex items-center justify-between shadow-sm">
            <span>No upcoming bills logged yet for this month.</span>
            <button
              onClick={() => setShowBillModal(true)}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              + Add Bill / Rent
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-panel border-primary overflow-hidden shadow-sm">
        <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex items-center justify-between bg-secondary/30">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {t('dash.recentTransactions', 'Recent Transactions')}
          </span>
          <span className="text-xs text-secondary font-mono font-medium">{t('dash.latestEntries', 'Latest Entries')}</span>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted space-y-1">
            <p className="font-semibold text-primary">{t('dash.noTransactions', 'No transactions recorded yet.')}</p>
            <p className="text-[11px]">Add an expense or income entry to see history here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>

      {/* Modals */}
      <AddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={handleRefreshAll}
      />
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleRefreshAll}
      />
      <AddBillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
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
