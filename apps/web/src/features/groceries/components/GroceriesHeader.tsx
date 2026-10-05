import React, { useState } from 'react';
import { ShoppingBag, Plus, ShoppingCart, RefreshCw, Zap } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';

interface GroceriesHeaderProps {
  onAddItem: () => void;
  onQuickAdd: (name: string) => Promise<void>;
  onOpenShoppingMode: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalPending: number;
}

export const GroceriesHeader: React.FC<GroceriesHeaderProps> = ({
  onAddItem,
  onQuickAdd,
  onOpenShoppingMode,
  onRefresh,
  isRefreshing = false,
  totalPending,
}) => {
  const { household } = useAuthStore();
  const [quickAddText, setQuickAddText] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickAddText.trim();
    if (!trimmed || isSubmittingQuick) return;

    try {
      setIsSubmittingQuick(true);
      await onQuickAdd(trimmed);
      setQuickAddText('');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-primary/70 shadow-xs space-y-3.5">
      {/* 1. Header Bar: Title, Subtitle, Household Badge & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon, Title, Subtitle & Household Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-primary tracking-tight">
                Grocery Inventory
              </h1>
              {household?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 max-w-[200px] sm:max-w-none truncate">
                  {household.name}
                </span>
              )}
            </div>
            <p className="text-xs text-secondary truncate sm:overflow-visible">
              Plan, shop, and keep your household pantry organized.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Refresh sync button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh household groceries"
            className="p-2 sm:p-2.5 rounded-xl border border-primary/70 bg-panel text-secondary hover:text-primary hover:bg-secondary/60 active:scale-95 transition-all"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Shopping Mode Button */}
          <button
            type="button"
            onClick={onOpenShoppingMode}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold active:scale-95 transition-all shadow-xs"
            title="Open distraction-free shopping mode"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden xs:inline">Shopping Mode</span>
            <span className="xs:hidden">Shop</span>
            {totalPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono leading-none">
                {totalPending}
              </span>
            )}
          </button>

          {/* Add Item Primary Button */}
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* 2. Integrated Quick Add Row */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="flex items-center gap-2 pt-1 border-t border-primary/40"
      >
        <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold shrink-0 hidden sm:flex">
          <Zap className="w-3.5 h-3.5 fill-amber-500" />
          <span>Quick Add</span>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            disabled={isSubmittingQuick}
            placeholder="Milk, eggs, bread... (separate multiple items with comma)"
            className="w-full pl-3 sm:pl-3 pr-20 py-2 text-xs bg-secondary/40 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!quickAddText.trim() || isSubmittingQuick}
            className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
          >
            {isSubmittingQuick ? (
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span>Add</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

