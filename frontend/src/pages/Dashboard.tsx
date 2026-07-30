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
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { COUNTRY_DEFAULTS } from '../utils/currency';

// Modals
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

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live Digital Clock state
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Active Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const countryDefaults = COUNTRY_DEFAULTS[country] || COUNTRY_DEFAULTS['US'];
  const flag = COUNTRY_FLAGS[country] || '🌐';

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await apiClient.get('/dashboard/summary');
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpenses || 0;
  const monthlySavings = summary?.monthlySavings !== undefined ? summary.monthlySavings : (monthlyIncome - monthlyExpenses);
  const overallSavings = summary?.overallSavings !== undefined ? summary.overallSavings : (summary?.summary?.overallSavings || 0);
  const upcomingBillsTotal = summary?.upcomingBillsTotal || 0;
  const recentHistory = summary?.recent5History || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Real-time Location & Clock Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {user?.name || 'Homeowner'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
              {user?.role || 'OWNER'}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Location: {flag} {countryDefaults.countryName}</span>
            <span className="text-slate-600">•</span>
            <span>{household?.name || 'Home Residence'}</span>
          </p>
        </div>

        {/* Real-time Digital Clock */}
        <div className="glass-panel px-4 py-2.5 border-blue-500/30 flex items-center gap-3 bg-slate-900/80">
          <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
          <div className="text-right">
            <span className="font-mono text-base font-extrabold text-slate-100 block tracking-wider leading-none">
              {timeStr || '12:00:00 PM'}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-indigo-400" /> {dateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Main Metric Cards: Income, Expenses, Monthly Savings, Overall Balance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Monthly Income Card */}
        <div className="glass-panel p-6 border-emerald-500/30 bg-gradient-to-tr from-slate-900 via-emerald-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Monthly Income</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">{format(monthlyIncome)}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Monthly Earnings
          </p>
        </div>

        {/* Monthly Expenses Card */}
        <div className="glass-panel p-6 border-blue-500/30 bg-gradient-to-tr from-slate-900 via-blue-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Monthly Expenses</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">{format(monthlyExpenses)}</p>
          <p className="text-[11px] text-slate-400">Total Logged Spend</p>
        </div>

        {/* Monthly Net Savings Card (Income - Expenses) */}
        <div className="glass-panel p-6 border-teal-500/30 bg-gradient-to-tr from-slate-900 via-teal-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Monthly Net Savings</span>
            <PiggyBank className="w-4 h-4 text-teal-400" />
          </div>
          <p className={`text-2xl font-extrabold font-mono ${monthlySavings >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
          </p>
          <p className="text-[11px] text-slate-400">Income - Expenses (This Month)</p>
        </div>

        {/* Overall Lifetime Balance Card */}
        <div className="glass-panel p-6 border-purple-500/30 bg-gradient-to-tr from-slate-900 via-purple-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Overall Net Balance</span>
            <Landmark className="w-4 h-4 text-purple-400" />
          </div>
          <p className={`text-2xl font-extrabold font-mono ${overallSavings >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
            {overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
          </p>
          <p className="text-[11px] text-purple-400 font-medium">Lifetime Income - Expenses</p>
        </div>
      </div>

      {/* Upcoming Expenses Plan Box */}
      <div className="glass-panel p-6 border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Upcoming Expenses & Utility Bills Plan</span>
          <p className="text-xs text-slate-300">Total unpaid utility bills scheduled for settlement this cycle.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-amber-400 font-mono block">{format(upcomingBillsTotal)}</span>
          <span className="text-[11px] text-slate-400">Unpaid Bills Action Required</span>
        </div>
      </div>

      {/* 5 History Table Section */}
      <div className="glass-panel border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" /> Recent 5 Transactions History
          </span>
          <span className="text-xs text-slate-400 font-mono">Latest Ledger Entries</span>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p>No recent transaction history recorded yet.</p>
            <p className="text-[11px]">Log an income entry or expense to see historical telemetry here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Transaction Title</th>
                  <th className="p-4">Category / Source</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">User</th>
                  <th className="p-4 text-right">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.type === 'INCOME' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      ></span>
                      {item.title}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'INCOME'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                        }`}
                      >
                        {item.category || item.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-400">{item.userName}</td>
                    <td
                      className={`p-4 text-right font-bold font-mono text-sm ${
                        item.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
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

      {/* Quick Action Modals Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setShowBillModal(true)}
          className="p-4 glass-panel border-slate-800 hover:border-amber-500/40 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">+ Add Bill</span>
        </button>

        <button
          onClick={() => setShowGroceryModal(true)}
          className="p-4 glass-panel border-slate-800 hover:border-emerald-500/40 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">+ Add Grocery</span>
        </button>

        <button
          onClick={() => setShowApplianceModal(true)}
          className="p-4 glass-panel border-slate-800 hover:border-blue-500/40 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">+ Add Appliance</span>
        </button>

        <button
          onClick={() => setShowTaskModal(true)}
          className="p-4 glass-panel border-slate-800 hover:border-purple-500/40 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">+ Add Task</span>
        </button>
      </div>

      {/* Modals */}
      <AddBillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSuccess={fetchDashboardData}
      />
      <AddGroceryModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        onSuccess={fetchDashboardData}
      />
      <AddApplianceModal
        isOpen={showApplianceModal}
        onClose={() => setShowApplianceModal(false)}
        onSuccess={fetchDashboardData}
      />
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
