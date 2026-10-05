import React from 'react';
import { ShoppingBag, Search, Sparkles, CheckCircle2, Plus, Package } from 'lucide-react';

interface GroceriesEmptyStateProps {
  type: 'no-items' | 'no-search-results' | 'no-urgent' | 'all-purchased' | 'no-purchased';
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
      <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl border border-primary/70 space-y-2.5 animate-in fade-in duration-150">
        <div className="w-10 h-10 mx-auto rounded-xl bg-secondary/50 text-secondary flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-primary">
          No grocery items match your search.
        </h3>
        {searchQuery && (
          <p className="text-xs text-secondary max-w-sm mx-auto">
            No items matching "{searchQuery}". Check spelling or clear filters.
          </p>
        )}
        {onClearFilters && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary/80 text-xs font-semibold text-primary transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'no-purchased') {
    return (
      <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl border border-primary/70 space-y-2.5 animate-in fade-in duration-150">
        <div className="w-10 h-10 mx-auto rounded-xl bg-secondary/50 text-secondary flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-primary">
          No purchased items yet.
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Items marked as purchased will appear here for pantry reference.
        </p>
        {onClearFilters && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary/80 text-xs font-semibold text-primary transition-colors"
            >
              Show All Items
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'no-urgent') {
    return (
      <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] space-y-2.5 animate-in fade-in duration-150">
        <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-primary">
          No urgent or low-stock items.
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          All household pantry stocks are above their minimum thresholds.
        </p>
        {onClearFilters && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/25 transition-colors"
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
      <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] space-y-2.5 animate-in fade-in duration-150">
        <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-primary">
          Everything on your list has been picked up ✓
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          All grocery items are stocked in your pantry.
        </p>
        {onAddItem && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Item</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: Entire list is empty
  return (
    <div className="glass-panel p-8 sm:p-10 text-center rounded-2xl border border-primary/70 space-y-3 animate-in fade-in duration-150">
      <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
        <ShoppingBag className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-primary">
          Your grocery list is clear.
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto mt-0.5">
          Add items your household needs, track pantry stock, and shop together.
        </p>
      </div>
      {onAddItem && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add First Item</span>
          </button>
        </div>
      )}
    </div>
  );
};

