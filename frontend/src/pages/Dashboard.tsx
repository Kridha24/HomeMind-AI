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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

  const { data: summary, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    }
  });

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
      setTimeStr(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);



  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpenses || 0;
  const overallExpenses = summary?.overallExpenses || 0;
  const monthlySavings = summary?.monthlySavings !== undefined ? summary.monthlySavings : (monthlyIncome - monthlyExpenses);
  const overallSavings = summary?.overallSavings !== undefined ? summary.overallSavings : (summary?.summary?.overallSavings || 0);
  const upcomingBillsTotal = summary?.upcomingBillsTotal || 0;
  const upcomingBills = summary?.upcomingBills || [];
  const recentHistory = summary?.recent5History || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Real-time Location & Clock Header */}
      <div className="glass-panel p-6 border-primary flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              Welcome, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
              {user?.role || 'OWNER'}
            </span>
          </div>
          <p className="text-xs text-muted flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{household?.name || 'Home Residence'}</span>
            <span className="text-slate-600">•</span>
            <span>{flag} {countryDefaults.countryName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Days Left in Month Badge */}
          <div className="glass-panel px-3.5 py-2 border-emerald-500/30 flex items-center gap-2 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
            <Hourglass className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>
              {daysRemaining === 0 ? 'Last Day of ' + monthName : `${daysRemaining} Days Left in ${monthName}`}
            </span>
          </div>

          {/* Real-time Digital Clock */}
          <div className="glass-panel px-4 py-2.5 border-blue-500/30 flex items-center gap-3 bg-panel/80">
            <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
            <div className="text-right">
              <span className="font-mono text-base font-extrabold text-primary block tracking-wider leading-none">
                {timeStr || '12:00:00 PM'}
              </span>
              <span className="text-[10px] font-semibold text-muted flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-indigo-400" /> {dateStr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metric Cards: Income, Monthly Expenses (-), Lifetime Expenses (-), Monthly Savings, Overall Balance */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <div className="glass-panel p-5 border-emerald-500/30 bg-gradient-to-tr from-slate-900 via-emerald-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Income ({monthShort})
              </span>
              <span className="text-[10px] text-muted font-mono block">{dateRangeStr}</span>
            </div>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-primary font-mono pt-1">+{format(monthlyIncome)}</p>
          <div className="flex items-center justify-between pt-1 border-t border-primary/80 text-[10px]">
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Monthly Earnings
            </span>
          </div>
        </div>

        {/* Monthly Expenses Card with (-) sign */}
        <div className="glass-panel p-5 border-red-500/30 bg-gradient-to-tr from-slate-900 via-red-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                Expenses ({monthShort})
              </span>
              <span className="text-[10px] text-muted font-mono block">{dateRangeStr}</span>
            </div>
            <CreditCard className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl font-extrabold text-red-400 font-mono pt-1">-{format(monthlyExpenses)}</p>
          <div className="flex items-center justify-between pt-1 border-t border-primary/80 text-[10px]">
            <span className="text-red-400">Total Month Spend</span>
          </div>
        </div>

        {/* Lifetime Overall Expenses Card with (-) sign */}
        <div className="glass-panel p-5 border-rose-500/30 bg-gradient-to-tr from-slate-900 via-rose-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Lifetime Expenses</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-extrabold text-rose-400 font-mono pt-1">-{format(overallExpenses)}</p>
          <div className="pt-1 border-t border-primary/80 text-[10px] text-muted">
            Total Historical Spend
          </div>
        </div>

        {/* Monthly Net Savings Card (Income - Expenses) */}
        <div className="glass-panel p-5 border-teal-500/30 bg-gradient-to-tr from-slate-900 via-teal-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Net Savings ({monthShort})</span>
            <PiggyBank className="w-4 h-4 text-teal-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono pt-1 ${monthlySavings >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
          </p>
          <div className="pt-1 border-t border-primary/80 text-[10px] text-muted">
            Income - Expenses
          </div>
        </div>

        {/* Overall Lifetime Balance Card */}
        <div className="glass-panel p-5 border-purple-500/30 bg-gradient-to-tr from-slate-900 via-purple-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Overall Balance</span>
            <Landmark className="w-4 h-4 text-purple-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono pt-1 ${overallSavings >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
            {overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
          </p>
          <div className="pt-1 border-t border-primary/80 text-[10px] text-purple-400 font-medium">
            Lifetime Net Assets
          </div>
        </div>
          </>
        )}
      </div>

      {/* Upcoming Rents & Mess Expenses Planner Section */}
      <div className="glass-panel p-6 border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Upcoming Rents, Mess Fees & Utility Payments Plan
            </span>
            <p className="text-xs text-secondary">Save and track room rent, mess fees, WiFi, and electricity bills due for settlement during {monthName} {year}.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-amber-400 font-mono block">-{format(upcomingBillsTotal)}</span>
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Total Scheduled Payments</span>
          </div>
        </div>

        {upcomingBills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {upcomingBills.map((bill: any) => (
              <div key={bill.id} className="p-3.5 rounded-2xl bg-background/80 border border-primary flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary block">{bill.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider inline-block">
                    {bill.category || 'Rent/Utility'}
                  </span>
                  <p className="text-[10px] text-muted font-mono">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-extrabold text-red-400 font-mono">-{format(bill.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-background/60 border border-primary text-center text-xs text-muted flex items-center justify-between">
            <span>No upcoming rent or mess bill entries logged yet for this cycle.</span>
            <button
              onClick={() => setShowBillModal(true)}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors"
            >
              + Add Room Rent / Mess Bill
            </button>
          </div>
        )}
      </div>

      {/* 5 History Table Section */}
      <div className="glass-panel border-primary overflow-hidden">
        <div className="p-4 border-b border-primary font-bold text-sm text-primary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" /> Recent 5 Transactions History
          </span>
          <span className="text-xs text-muted font-mono">Latest Ledger Entries</span>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted space-y-1">
            <p>No recent transaction history recorded yet.</p>
            <p className="text-[11px]">Log an income entry or expense to see historical telemetry here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/60 text-muted uppercase tracking-wider font-semibold border-b border-primary">
                <tr>
                  <th className="p-4">Transaction Title</th>
                  <th className="p-4">Category / Source</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">User</th>
                  <th className="p-4 text-right">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-secondary">
                {recentHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-panel/40 transition-colors">
                    <td className="p-4 font-semibold text-primary flex items-center gap-2.5">
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
                    <td className="p-4 text-muted font-mono text-[11px]">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-muted">{item.userName}</td>
                    <td
                      className={`p-4 text-right font-bold font-mono text-sm ${
                        item.type === 'INCOME' ? 'text-emerald-400' : 'text-primary'
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
      <AddBillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSuccess={() => refetch()}
      />
      <AddGroceryModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        onSuccess={() => refetch()}
      />
      <AddApplianceModal
        isOpen={showApplianceModal}
        onClose={() => setShowApplianceModal(false)}
        onSuccess={() => refetch()}
      />
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
