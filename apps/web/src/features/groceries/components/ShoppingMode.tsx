import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, ShoppingCart, CheckCircle2, Sparkles, Filter } from 'lucide-react';
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

  const isCompleted = totalCount > 0 && pendingItems.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Sticky Header with Progress Bar */}
      <header className="p-4 sm:p-5 bg-panel border-b border-primary/80 shadow-md flex-shrink-0 space-y-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/70 bg-secondary/40 text-primary hover:bg-secondary/70 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Shopping</span>
          </button>

          <div className="text-center">
            <h2 className="text-sm sm:text-base font-black text-primary tracking-tight flex items-center gap-1.5 justify-center">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              <span>SHOPPING MODE</span>
            </h2>
            <p className="text-[11px] text-secondary font-medium font-mono">
              {pickedUpCount} of {totalCount} items in basket ({percentComplete}%)
            </p>
          </div>

          <div className="w-24 text-right">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {pendingItems.length} left
            </span>
          </div>
        </div>

        {/* Big visual progress bar */}
        <div className="max-w-3xl mx-auto w-full h-2.5 bg-secondary/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {/* Category filter pills if multiple categories */}
        {pendingCategories.length > 1 && (
          <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-secondary/50 text-secondary hover:text-primary'
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
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-secondary/50 text-secondary hover:text-primary'
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
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">
        {/* Shopping Completed Screen */}
        {isCompleted ? (
          <div className="py-16 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xl border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black text-primary">
              Shopping Complete!
            </h3>
            <p className="text-sm text-secondary max-w-sm mx-auto">
              Everything on your household list has been picked up. Great job!
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onExit}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                Return to Groceries
              </button>
            </div>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="py-12 text-center text-secondary text-sm">
            No pending items in this category.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
              Tap any item to put in basket:
            </p>

            {filteredPending.map((item) => {
              const catColor = getCategoryColor(item.category);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTogglePurchase(item.id, true)}
                  className="w-full text-left p-4 sm:p-5 rounded-2xl bg-panel hover:bg-secondary/40 border border-primary/80 hover:border-emerald-500 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Big Checkbox Icon + Item Details */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center flex-shrink-0 bg-secondary/30">
                      {/* Empty box waiting for tap */}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-extrabold text-primary truncate tracking-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catColor.badge} ${catColor.border}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Badge */}
                  <div className="flex-shrink-0 text-right">
                    <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-mono font-extrabold text-sm sm:text-base">
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
          <div className="mt-8 pt-6 border-t border-primary/50 space-y-2.5">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
              In Basket ({purchasedItems.length} items):
            </h4>
            <div className="space-y-2 opacity-60">
              {purchasedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTogglePurchase(item.id, false)}
                  title="Tap to unmark / put back on list"
                  className="w-full text-left p-3 rounded-xl bg-secondary/20 border border-primary/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="line-through font-semibold text-secondary truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-secondary">
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
