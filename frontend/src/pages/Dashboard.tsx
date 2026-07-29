import React, { useState, useEffect } from 'react';
import {
  CreditCard,
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
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';

// Modals
import { AddBillModal } from '../components/common/AddBillModal';
import { AddGroceryModal } from '../components/common/AddGroceryModal';
import { AddApplianceModal } from '../components/common/AddApplianceModal';
import { AddTaskModal } from '../components/common/AddTaskModal';

export const Dashboard: React.FC = () => {
  const { user, household } = useAuthStore();
  const { format, currencySymbol } = useSettingStore();

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

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

  const totalSpent = summary?.monthlyExpenses || 0;
  const totalBillsDue = summary?.unpaidBillsTotal || 0;
  const isNewUser = summary && summary.totalExpensesCount === 0 && summary.totalBillsCount === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Onboarding Welcome Hero for Clean Slate New Accounts */}
      {isNewUser ? (
        <div className="glass-panel p-8 relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 border-blue-500/30 shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to HomeMind AI — Let's Setup Your Home
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Hello, {user?.name || 'Homeowner'}! Your Household OS is Ready.
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your household starts completely empty with zero demo records. Click quick buttons below to add your first expense, utility bill, grocery item, appliance or family member.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => (window.location.href = '/expenses')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-blue-600/25 transition-all"
              >
                <Plus className="w-4 h-4" /> + Add Expense
              </button>
              <button
                onClick={() => setShowBillModal(true)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-amber-600/25 transition-all"
              >
                <Plus className="w-4 h-4" /> + Add Bill
              </button>
              <button
                onClick={() => setShowGroceryModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Plus className="w-4 h-4" /> + Add Grocery
              </button>
              <button
                onClick={() => setShowApplianceModal(true)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-cyan-600/25 transition-all"
              >
                <Plus className="w-4 h-4" /> + Add Appliance
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" /> Command Center Overview
            </h1>
            <p className="text-xs text-slate-400">
              Operating telemetry for {household?.name || 'Home Residence'} ({currencySymbol})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBillModal(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl text-slate-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Bill
            </button>
            <button
              onClick={() => setShowGroceryModal(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl text-slate-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Grocery
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl text-slate-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" /> Task
            </button>
          </div>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-slate-800 space-y-2 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Monthly Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-100 font-mono block">{format(totalSpent)}</span>
          <span className="text-[11px] text-slate-400 block">{summary?.totalExpensesCount || 0} Transactions logged</span>
        </div>

        <div className="glass-panel p-6 border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Unpaid Utility Bills</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-400 font-mono block">{format(totalBillsDue)}</span>
          <span className="text-[11px] text-slate-400 block">{summary?.unpaidBillsCount || 0} Outstanding due bills</span>
        </div>

        <div className="glass-panel p-6 border-slate-800 space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Pantry Items</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-100 font-mono block">{summary?.totalGroceriesCount || 0}</span>
          <span className="text-[11px] text-emerald-400 font-semibold block">{summary?.lowStockCount || 0} Low stock warnings</span>
        </div>

        <div className="glass-panel p-6 border-slate-800 space-y-2 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Registered Appliances</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-100 font-mono block">{summary?.totalAppliancesCount || 0}</span>
          <span className="text-[11px] text-slate-400 block">Warranty telemetry active</span>
        </div>
      </div>

      {/* Quick Universal Add Modals */}
      <AddBillModal isOpen={showBillModal} onClose={() => setShowBillModal(false)} onSuccess={fetchDashboardData} />
      <AddGroceryModal isOpen={showGroceryModal} onClose={() => setShowGroceryModal(false)} onSuccess={fetchDashboardData} />
      <AddApplianceModal isOpen={showApplianceModal} onClose={() => setShowApplianceModal(false)} onSuccess={fetchDashboardData} />
      <AddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={fetchDashboardData} />
    </div>
  );
};
