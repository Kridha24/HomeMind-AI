import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { GroceryItem } from '../../../types';
import { formatQuantityWithUnit, getCategoryColor } from '../utils/groceryFormatters';

interface ShoppingModeProps {
  items: GroceryItem[];
  onTogglePurchase: (id: string, purchased: boolean) => Promise<any>;
  onExit: () => void;
}

export const ShoppingMode: React.FC<ShoppingModeProps> = ({
  items,
  onTogglePurchase,
  onExit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Pending items that need to be purchased
  const pendingItems = useMemo(() => {
    return items.filter((i) => !i.purchaseDate);
  }, [items]);

  // Purchased items during this session
  const purchasedItems = useMemo(() => {
    return items.filter((i) => Boolean(i.purchaseDate));
  }, [items]);

  const totalCount = items.length;
  const pickedUpCount = purchasedItems.length;
  const percentComplete = totalCount > 0 ? Math.round((pickedUpCount / totalCount) * 100) : 0;
  const isCompleted = totalCount > 0 && pendingItems.length === 0;

  // Filtered by selected category
  const filteredPending = useMemo(() => {
    if (selectedCategory === 'ALL') return pendingItems;
    return pendingItems.filter((i) => i.category === selectedCategory);
  }, [pendingItems, selectedCategory]);

  // Unique categories of pending items
  const pendingCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of pendingItems) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).sort();
  }, [pendingItems]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 4 & 11. Compact Sticky Header with Shopping Progress */}
      <header className="p-3 sm:p-4 bg-panel border-b border-primary/80 shadow-md flex-shrink-0 space-y-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/70 bg-secondary/40 text-primary hover:bg-secondary/70 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>

          <div className="text-center">
            {isCompleted ? (
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Shopping complete</span>
              </span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-black text-primary font-mono">
                  {pickedUpCount} / {totalCount} picked up
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  • {percentComplete}%
                </span>
              </div>
            )}
          </div>

          <div className="w-20 text-right">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {pendingItems.length} left
            </span>
          </div>
        </div>

        {/* Subtle compact progress bar */}
        <div className="max-w-3xl mx-auto w-full h-1.5 bg-secondary/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {/* Category filter pills if multiple categories */}
        {pendingCategories.length > 1 && (
          <div className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-secondary/40 text-secondary hover:text-primary'
              }`}
            >
              All ({pendingItems.length})
            </button>
            {pendingCategories.map((cat) => {
              const count = pendingItems.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-secondary/40 text-secondary hover:text-primary'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 max-w-3xl mx-auto w-full">
        {/* Shopping Completed Screen */}
        {isCompleted ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xl border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-primary">
              ✓ Shopping complete
            </h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Everything on your household grocery list has been picked up.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onExit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              >
                Return to Groceries
              </button>
            </div>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="py-10 text-center text-secondary text-xs">
            No pending items in this category.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider px-0.5">
              Tap any item to put in basket:
            </p>

            {filteredPending.map((item) => {
              const catColor = getCategoryColor(item.category);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTogglePurchase(item.id, true)}
                  className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-panel hover:bg-secondary/40 border border-primary/70 hover:border-emerald-500 shadow-2xs active:scale-[0.98] transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  {/* Left: Checkbox Target + Item Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center shrink-0 bg-secondary/20">
                      {/* Empty box awaiting tap */}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-extrabold text-primary truncate tracking-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${catColor.badge} ${catColor.border}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Badge */}
                  <div className="shrink-0 text-right">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-xs sm:text-sm">
                      {formatQuantityWithUnit(item.quantity, item.unit)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Recently checked items in this shopping trip */}
        {purchasedItems.length > 0 && !isCompleted && (
          <div className="mt-6 pt-4 border-t border-primary/40 space-y-2">
            <h4 className="text-[11px] font-bold text-secondary uppercase tracking-wider px-0.5">
              In Basket ({purchasedItems.length} items):
            </h4>
            <div className="space-y-1.5 opacity-65">
              {purchasedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTogglePurchase(item.id, false)}
                  title="Tap to unmark / put back on list"
                  className="w-full text-left p-2.5 rounded-lg bg-secondary/20 border border-primary/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="line-through font-semibold text-secondary truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-secondary text-[11px]">
                    {formatQuantityWithUnit(item.quantity, item.unit)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

