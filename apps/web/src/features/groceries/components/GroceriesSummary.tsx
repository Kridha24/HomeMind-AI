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
          className={`glass-panel p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] ${
            activeFilter === 'pending'
              ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-primary/80 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-secondary uppercase tracking-wider">
              Need to Buy
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
            {metrics.needToBuyCount}
          </p>
          <p className="text-[11px] text-secondary mt-1">
            {metrics.needToBuyCount === 1 ? '1 item pending' : `${metrics.needToBuyCount} items pending`}
          </p>
        </button>

        {/* Purchased Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('purchased')}
          className={`glass-panel p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] ${
            activeFilter === 'purchased'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-primary/80 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-secondary uppercase tracking-wider">
              Purchased
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.purchasedCount}
          </p>
          <p className="text-[11px] text-secondary mt-1">
            {metrics.purchasedCount === 1 ? '1 item completed' : `${metrics.purchasedCount} items in pantry`}
          </p>
        </button>

        {/* Urgent / Low Stock Card */}
        <button
          type="button"
          onClick={() => onFilterChange?.('urgent')}
          className={`glass-panel p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] ${
            activeFilter === 'urgent'
              ? 'border-rose-500 shadow-md ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20'
              : metrics.urgentCount > 0
              ? 'border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-500'
              : 'border-primary/80 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-secondary uppercase tracking-wider">
              Urgent & Low Stock
            </span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                metrics.urgentCount > 0
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              metrics.urgentCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : metrics.lowStockCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-primary'
            }`}
          >
            {metrics.urgentCount + metrics.lowStockCount}
          </p>
          <p className="text-[11px] text-secondary mt-1">
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
          className={`glass-panel p-4 sm:p-5 text-left rounded-2xl border transition-all active:scale-[0.98] ${
            activeFilter === 'all'
              ? 'border-primary shadow-md ring-2 ring-primary/20'
              : 'border-primary/80 hover:border-primary/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-secondary uppercase tracking-wider">
              Total Household Items
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
            {metrics.totalItems}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-muted mt-1 truncate">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Price tracking not in schema</span>
          </div>
        </button>
      </div>

      {/* Progress Strip */}
      <div className="glass-panel p-4 rounded-2xl border border-primary/80">
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
