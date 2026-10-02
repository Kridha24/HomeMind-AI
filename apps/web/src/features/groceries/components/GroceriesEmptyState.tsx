import React from 'react';
import { ShoppingBag, Search, Sparkles, CheckCircle2, Plus } from 'lucide-react';

interface GroceriesEmptyStateProps {
  type: 'no-items' | 'no-search-results' | 'no-urgent' | 'all-purchased';
  searchQuery?: string;
  onAddItem?: () => void;
  onClearFilters?: () => void;
}

export const GroceriesEmptyState: React.FC<GroceriesEmptyStateProps> = ({
  type,
  searchQuery,
  onAddItem,
  onClearFilters,
}) => {
  if (type === 'no-search-results') {
    return (
      <div className="glass-panel p-10 text-center rounded-3xl border border-primary/70 space-y-3 animate-in fade-in duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/60 text-secondary flex items-center justify-center">
          <Search className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-primary">
          No groceries match "{searchQuery}"
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          We couldn't find any grocery or pantry items matching your search. Check for typos or clear filters.
        </p>
        {onClearFilters && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 rounded-xl bg-secondary/60 hover:bg-secondary/80 text-xs font-bold text-primary transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'no-urgent') {
    return (
      <div className="glass-panel p-10 text-center rounded-3xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3 animate-in fade-in duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-primary">
          No Urgent Groceries
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          All household pantry items are well above threshold limits and no upcoming expiries detected.
        </p>
        {onClearFilters && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/25 transition-colors"
            >
              Show All Items
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'all-purchased') {
    return (
      <div className="glass-panel p-10 text-center rounded-3xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3 animate-in fade-in duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h3 className="text-base font-extrabold text-primary">
          Shopping Complete!
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Everything on this list has been picked up. Great job keeping the pantry stocked!
        </p>
        {onAddItem && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: Entire list is empty
  return (
    <div className="glass-panel p-12 text-center rounded-3xl border border-primary/70 space-y-4 animate-in fade-in duration-200">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-black text-primary">
          Your grocery list is clear.
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto mt-1">
          Add items your household needs, set thresholds, and track pantry stock in real-time.
        </p>
      </div>
      {onAddItem && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Item</span>
          </button>
        </div>
      )}
    </div>
  );
};
