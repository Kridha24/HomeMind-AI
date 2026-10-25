import React from 'react';
import { ShoppingCart, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { ShoppingMetrics } from '../hooks/useShoppingProgress';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {/* 1. Need to Buy Tile (rose) */}
      <button
        type="button"
        onClick={() => onFilterChange?.('pending')}
        className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex items-center gap-2 sm:gap-3 ${
          activeFilter === 'pending'
            ? 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-500/10 dark:bg-rose-950/30'
            : 'border-primary/60 bg-panel hover:border-rose-500/50 hover:bg-rose-500/[0.04]'
        }`}
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider truncate">
            Need to Buy
          </span>
          <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-sm xs:text-base sm:text-2xl font-black font-mono text-primary">
              {metrics.needToBuyCount}
            </span>
            <span className="text-[9px] sm:text-[10px] text-secondary truncate">
              {metrics.needToBuyCount === 1 ? '1 item' : `${metrics.needToBuyCount} items`}
            </span>
          </div>
        </div>
      </button>

      {/* 2. Purchased Tile (emerald) */}
      <button
        type="button"
        onClick={() => onFilterChange?.('purchased')}
        className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex items-center gap-2 sm:gap-3 ${
          activeFilter === 'purchased'
            ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/30'
            : 'border-primary/60 bg-panel hover:border-emerald-500/50 hover:bg-emerald-500/[0.04]'
        }`}
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
            Purchased
          </span>
          <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-sm xs:text-base sm:text-2xl font-black font-mono text-primary">
              {metrics.purchasedCount}
            </span>
            <span className="text-[9px] sm:text-[10px] text-secondary truncate">
              in pantry
            </span>
          </div>
        </div>
      </button>

      {/* 3. Low Stock Tile (amber) */}
      <button
        type="button"
        onClick={() => onFilterChange?.('urgent')}
        className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex items-center gap-2 sm:gap-3 ${
          activeFilter === 'urgent'
            ? 'border-amber-500 ring-2 ring-amber-500/25 bg-amber-500/10 dark:bg-amber-950/30'
            : 'border-primary/60 bg-panel hover:border-amber-500/50 hover:bg-amber-500/[0.04]'
        }`}
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
            Low Stock
          </span>
          <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-sm xs:text-base sm:text-2xl font-black font-mono text-primary">
              {metrics.lowStockCount + metrics.urgentCount}
            </span>
            <span className="text-[9px] sm:text-[10px] text-secondary truncate">
              {metrics.urgentCount > 0 ? `${metrics.urgentCount} urgent` : 'items low'}
            </span>
          </div>
        </div>
      </button>

      {/* 4. Total Items Tile (blue) */}
      <button
        type="button"
        onClick={() => onFilterChange?.('all')}
        className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex items-center gap-2 sm:gap-3 ${
          activeFilter === 'all'
            ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-500/10 dark:bg-blue-950/30'
            : 'border-primary/60 bg-panel hover:border-blue-500/50 hover:bg-blue-500/[0.04]'
        }`}
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0">
          <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
            Total Items
          </span>
          <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-sm xs:text-base sm:text-2xl font-black font-mono text-primary">
              {metrics.totalItems}
            </span>
            <span className="text-[9px] sm:text-[10px] text-secondary truncate">
              catalog
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

