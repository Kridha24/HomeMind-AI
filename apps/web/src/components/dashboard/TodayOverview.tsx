import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  FileText,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface TodayOverviewProps {
  pendingTasksCount?: number;
  billsDueSoonCount?: number;
  todayTransactionsCount?: number;
  userRole?: string;
  onSelectTab?: (tab: 'bills' | 'tasks') => void;
  onOpenTransactions?: () => void;
  // Real data arrays
  tasks?: any[];
  bills?: any[];
  groceries?: any[];
  format?: (amount: number) => string;
}

export const TodayOverview: React.FC<TodayOverviewProps> = ({
  pendingTasksCount,
  billsDueSoonCount,
  userRole = 'MEMBER',
  onSelectTab,
  tasks = [],
  bills = [],
  groceries = [],
  format = (val: number) => `₹${val.toLocaleString()}`,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Tasks telemetry
  const activeTasks = tasks.filter((t: any) => t.status !== 'COMPLETED');
  const taskCount = activeTasks.length > 0 ? activeTasks.length : (pendingTasksCount ?? 0);
  const now = new Date();
  const overdueTasksCount = activeTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now).length;
  const nextTask = activeTasks[0];

  // Bills telemetry
  const unpaidBills = bills.filter((b: any) => b.status !== 'PAID');
  const billCount = unpaidBills.length > 0 ? unpaidBills.length : (billsDueSoonCount ?? 0);
  const totalDueAmount = unpaidBills.reduce((acc: number, b: any) => acc + (b.amount || 0), 0);
  const overdueBillsCount = unpaidBills.filter((b: any) => b.dueDate && new Date(b.dueDate) < now).length;
  
  // Find nearest due date
  const sortedUpcomingBills = [...unpaidBills].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const nearestBill = sortedUpcomingBills[0];
  const nearestDateStr = nearestBill
    ? new Date(nearestBill.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : null;

  // Groceries telemetry
  const urgentGroceryItems = groceries.filter(
    (g: any) => g.status === 'LOW_STOCK' || g.status === 'OUT_OF_STOCK'
  );
  const totalGroceriesCount = groceries.length;

  const handleTaskClick = () => {
    navigate('/tasks');
  };

  const handleBillClick = () => {
    navigate('/bills');
  };

  const handleGroceryClick = () => {
    navigate('/groceries');
  };

  return (
    <section className="space-y-3" aria-label="Today At A Glance">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Today At A Glance
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Real-time status across tasks, bills, and grocery inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Live Household Data</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Enhanced Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* A. Tasks card (Violet) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTaskClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(); }}
          className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Tasks Pending
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>
            {overdueTasksCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400 uppercase">
                {overdueTasksCount} overdue
              </span>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
              {nextTask ? `Next: ${nextTask.title}` : 'All chores completed'}
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* B. Bills card (Amber) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBillClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBillClick(); }}
          className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Bills Due Soon
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {totalDueAmount > 0 ? format(totalDueAmount) : `${billCount} upcoming`}
                </span>
              </div>
            </div>
            {overdueBillsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 uppercase">
                {overdueBillsCount} overdue
              </span>
            ) : nearestDateStr ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Due {nearestDateStr}
              </span>
            ) : null}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
              {nearestBill ? `${nearestBill.title} (${format(nearestBill.amount)})` : 'No upcoming bills'}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Pay <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* C. Shared Groceries card (Emerald) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleGroceryClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGroceryClick(); }}
          className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Shared Groceries
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {totalGroceriesCount} items tracked
                </span>
              </div>
            </div>
            {urgentGroceryItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 uppercase">
                {urgentGroceryItems.length} low stock
              </span>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
              {urgentGroceryItems.length > 0
                ? `Need reorder: ${urgentGroceryItems.map((g: any) => g.name).slice(0, 2).join(', ')}`
                : 'Pantry inventory well-stocked'}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodayOverview;
