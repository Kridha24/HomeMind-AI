import React from 'react';
import { ShoppingCart, CheckCircle2, AlertTriangle, Package, Info } from 'lucide-react';
import { ShoppingMetrics } from '../hooks/useShoppingProgress';
import { ShoppingProgress } from './ShoppingProgress';

interface GroceriesSummaryProps {
  metrics: ShoppingMetrics;
  onFilterChange?: (status: 'all' | 'pending' | 'purchased' | 'urgent') => void;
  activeFilter?: string;
}

export const GroceriesSummary: React.FC<GroceriesSummaryProps> = ({
  metrics,
  onFilterChange,
  activeFilter = 'all',
}) => {
  return (
    <div className="space-y-4">
      {/* 4 Highlights Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Need to Buy Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('pending')}
          className={`relative overflow-hidden p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] shadow-xs hover:shadow-md ${
            activeFilter === 'pending'
              ? 'border-rose-500 ring-2 ring-rose-500/25 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-white dark:from-rose-500/25 dark:via-rose-950/40 dark:to-slate-900'
              : 'border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 hover:border-rose-500/60'
          }`}
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-rose-500 to-pink-400 absolute top-0 left-0 right-0 opacity-90" />
          <div className="flex items-center justify-between mb-2 pt-0.5">
            <span className="text-[11px] sm:text-xs font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Need to Buy
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300 font-mono">
            {metrics.needToBuyCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {metrics.needToBuyCount === 1 ? '1 item pending' : `${metrics.needToBuyCount} items pending`}
          </p>
        </button>

        {/* Purchased Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('purchased')}
          className={`relative overflow-hidden p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] shadow-xs hover:shadow-md ${
            activeFilter === 'purchased'
              ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-white dark:from-emerald-500/25 dark:via-emerald-950/40 dark:to-slate-900'
              : 'border-emerald-500/30 dark:border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-white dark:from-emerald-500/[0.14] dark:via-emerald-950/20 dark:to-slate-900 hover:border-emerald-500/60'
          }`}
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 to-teal-400 absolute top-0 left-0 right-0 opacity-90" />
          <div className="flex items-center justify-between mb-2 pt-0.5">
            <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Purchased
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.purchasedCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {metrics.purchasedCount === 1 ? '1 item completed' : `${metrics.purchasedCount} items in pantry`}
          </p>
        </button>

        {/* Urgent / Low Stock Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('urgent')}
          className={`relative overflow-hidden p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] shadow-xs hover:shadow-md ${
            activeFilter === 'urgent'
              ? 'border-amber-500 ring-2 ring-amber-500/25 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-white dark:from-amber-500/25 dark:via-amber-950/40 dark:to-slate-900'
              : 'border-amber-500/30 dark:border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.02] to-white dark:from-amber-500/[0.14] dark:via-amber-950/20 dark:to-slate-900 hover:border-amber-500/60'
          }`}
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-amber-500 to-orange-400 absolute top-0 left-0 right-0 opacity-90" />
          <div className="flex items-center justify-between mb-2 pt-0.5">
            <span className="text-[11px] sm:text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Urgent & Low Stock
            </span>
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-2xs ${
                metrics.urgentCount > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black font-mono ${
              metrics.urgentCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : metrics.lowStockCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {metrics.urgentCount + metrics.lowStockCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {metrics.urgentCount > 0
              ? `${metrics.urgentCount} urgent run required`
              : metrics.lowStockCount > 0
              ? `${metrics.lowStockCount} items at low threshold`
              : 'All stocks healthy'}
          </p>
        </button>

        {/* Total Stock / Price Notice Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('all')}
          className={`relative overflow-hidden p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] shadow-xs hover:shadow-md ${
            activeFilter === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/25 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-white dark:from-blue-500/25 dark:via-blue-950/40 dark:to-slate-900'
              : 'border-blue-500/30 dark:border-blue-500/35 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.02] to-white dark:from-blue-500/[0.14] dark:via-blue-950/20 dark:to-slate-900 hover:border-blue-500/60'
          }`}
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 to-indigo-400 absolute top-0 left-0 right-0 opacity-90" />
          <div className="flex items-center justify-between mb-2 pt-0.5">
            <span className="text-[11px] sm:text-xs font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Total Household Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 font-mono">
            {metrics.totalItems}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Active grocery catalog</span>
          </div>
        </button>
      </div>

      {/* Progress Strip */}
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <ShoppingProgress
          totalItems={metrics.totalItems}
          purchasedCount={metrics.purchasedCount}
          progressPercent={metrics.progressPercent}
          isShoppingComplete={metrics.isShoppingComplete}
        />
      </div>
    </div>
  );
};
