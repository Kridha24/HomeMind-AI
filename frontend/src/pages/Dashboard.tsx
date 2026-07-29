import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Receipt,
  ShoppingBag,
  Tv,
  Sparkles,
  TrendingUp,
  Plus,
  Home,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import apiClient from '../services/apiClient';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form Inputs
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [groceryName, setGroceryName] = useState('');
  const [groceryQty, setGroceryQty] = useState('1');
  const [applianceName, setApplianceName] = useState('');
  const [applianceBrand, setApplianceBrand] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get('/dashboard/summary');
      setData(res.data);
    } catch (e) {
      setData({
        isNewUser: true,
        summary: { totalExpense: 0, totalIncome: 0, savings: 0, savingsRate: 0, sustainabilityScore: 100 },
        upcomingBills: [],
        pendingTasks: [],
        expiringGroceries: [],
        lowStockGroceries: [],
        upcomingApplianceServices: [],
        aiRecommendations: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/expenses', { title: expenseTitle, amount: expenseAmount, category: 'General' });
      setActiveModal(null);
      setExpenseTitle('');
      setExpenseAmount('');
      fetchSummary();
    } catch (err) {
      alert('Error creating expense');
    }
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/inventory', { name: groceryName, quantity: groceryQty, unit: 'pcs', category: 'Household Items' });
      setActiveModal(null);
      setGroceryName('');
      setGroceryQty('1');
      fetchSummary();
    } catch (err) {
      alert('Error creating grocery item');
    }
  };

  const handleAddAppliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/appliances', { name: applianceName, brand: applianceBrand, purchaseDate: new Date().toISOString() });
      setActiveModal(null);
      setApplianceName('');
      setApplianceBrand('');
      fetchSummary();
    } catch (err) {
      alert('Error adding appliance');
    }
  };

  const isNewUser = data?.isNewUser || (data?.summary?.totalExpense === 0 && data?.upcomingBills?.length === 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Household Command Center
            <Sparkles className="w-5 h-5 text-blue-400" />
          </h1>
          <p className="text-xs text-slate-400">Live PostgreSQL telemetry & isolated household intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 flex items-center gap-3 border-emerald-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Eco Score</p>
              <p className="text-sm font-bold text-emerald-400">{data?.summary?.sustainabilityScore || 100} / 100</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW USER ONBOARDING BANNER */}
      {isNewUser ? (
        <div className="glass-panel p-8 space-y-6 border-blue-500/40 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 glow-effect">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
              <Home className="w-3.5 h-3.5" /> Welcome to HomeMind AI
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100">Let's setup your intelligent household.</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your household starts completely clean. Add your first expense, grocery item, appliance, or invite family members to begin generating AI predictions and telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <button
              onClick={() => setActiveModal('EXPENSE')}
              className="glass-card p-4 flex items-center gap-3 hover:border-blue-500 text-left transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  + Add Expense <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-slate-400">Log initial household outlays</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('GROCERY')}
              className="glass-card p-4 flex items-center gap-3 hover:border-purple-500 text-left transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  + Add Grocery <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-slate-400">Track initial pantry stock</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('APPLIANCE')}
              className="glass-card p-4 flex items-center gap-3 hover:border-indigo-500 text-left transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  + Add Appliance <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-slate-400">Track equipment maintenance</p>
              </div>
            </button>

            <a
              href="/family"
              className="glass-card p-4 flex items-center gap-3 hover:border-emerald-500 text-left transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  + Invite Family <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-slate-400">Share household workspace</p>
              </div>
            </a>
          </div>
        </div>
      ) : (
        /* STANDARD DASHBOARD KPI GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 space-y-2 border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Monthly Expenses</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Wallet className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-slate-100">${data?.summary?.totalExpense?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="glass-panel p-4 space-y-2 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Net Savings</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">${data?.summary?.savings?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="glass-panel p-4 space-y-2 border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Upcoming Bills</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Receipt className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-amber-400">{data?.upcomingBills?.length || 0} Bills</div>
          </div>
          <div className="glass-panel p-4 space-y-2 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Inventory Alert</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><ShoppingBag className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-purple-300">{(data?.expiringGroceries?.length || 0) + (data?.lowStockGroceries?.length || 0)} Items</div>
          </div>
        </div>
      )}

      {/* QUICK ADD MODALS */}
      {activeModal === 'EXPENSE' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100">Add Household Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Supermarket Groceries"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="45.50"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'GROCERY' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100">Add Grocery Item</h3>
            <form onSubmit={handleAddGrocery} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="Organic Milk 2L"
                  value={groceryName}
                  onChange={(e) => setGroceryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  value={groceryQty}
                  onChange={(e) => setGroceryQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400">Cancel</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold">Save Grocery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'APPLIANCE' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100">Add Appliance</h3>
            <form onSubmit={handleAddAppliance} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="Living Room AC"
                  value={applianceName}
                  onChange={(e) => setApplianceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Brand</label>
                <input
                  type="text"
                  required
                  placeholder="Daikin"
                  value={applianceBrand}
                  onChange={(e) => setApplianceBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold">Save Appliance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
