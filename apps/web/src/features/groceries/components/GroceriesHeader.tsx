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
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-primary/80 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Household context */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  Groceries
                </h1>
                {household?.name && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {household.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Plan, share and complete household shopping.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Refresh sync button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh household groceries"
            className="p-2.5 rounded-xl border border-primary/70 bg-panel text-secondary hover:text-primary hover:bg-secondary/60 active:scale-95 transition-all"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Shopping Mode Button (Prominent) */}
          <button
            type="button"
            onClick={onOpenShoppingMode}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold active:scale-95 transition-all shadow-xs"
            title="Open distraction-free shopping mode"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Shopping Mode</span>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAddSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-secondary pointer-events-none">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <input
          type="text"
          value={quickAddText}
          onChange={(e) => setQuickAddText(e.target.value)}
          disabled={isSubmittingQuick}
          placeholder="Quick add: type item name and press Enter (e.g. Milk, Eggs, Dish Soap)..."
          className="w-full pl-9 pr-24 py-2.5 text-xs bg-secondary/50 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!quickAddText.trim() || isSubmittingQuick}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
        >
          {isSubmittingQuick ? (
            <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
