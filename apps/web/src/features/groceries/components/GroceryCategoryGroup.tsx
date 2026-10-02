import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { GroceryItem } from '../../../types';
import { getCategoryColor } from '../utils/groceryFormatters';
import { GroceryItemRow } from './GroceryItemRow';
import { GroceryItemCard } from './GroceryItemCard';

interface GroceryCategoryGroupProps {
  category: string;
  items: GroceryItem[];
  onTogglePurchase: (id: string, purchased: boolean) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  defaultExpanded?: boolean;
}

export const GroceryCategoryGroup: React.FC<GroceryCategoryGroupProps> = ({
  category,
  items,
  onTogglePurchase,
  onEdit,
  onDelete,
  onUpdateQuantity,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const color = getCategoryColor(category);

  const purchasedCount = items.filter((i) => Boolean(i.purchaseDate)).length;
  const pendingCount = items.length - purchasedCount;
  const isComplete = items.length > 0 && pendingCount === 0;

  return (
    <div className="space-y-2">
      {/* Category Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-secondary/40 dark:bg-slate-900/50 hover:bg-secondary/70 border border-primary/50 transition-all text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="text-secondary">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${color.badge} ${color.border} flex items-center gap-1.5`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{category}</span>
            </span>

            <span className="text-xs font-medium text-secondary">
              {items.length} {items.length === 1 ? 'item' : 'items'}
              {pendingCount > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold ml-1.5">
                  ({pendingCount} to buy)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Category progress indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
              isComplete
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-secondary text-secondary border-primary/40'
            }`}
          >
            {purchasedCount} / {items.length} ✓
          </span>
        </div>
      </button>

      {/* Group Items (Collapsible) */}
      {isExpanded && (
        <div className="space-y-2 pl-1 sm:pl-2 animate-in fade-in duration-150">
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {items.map((item) => (
              <GroceryItemCard
                key={item.id}
                item={item}
                onTogglePurchase={onTogglePurchase}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>

          {/* Desktop View: Rows */}
          <div className="hidden md:flex md:flex-col gap-2">
            {items.map((item) => (
              <GroceryItemRow
                key={item.id}
                item={item}
                onTogglePurchase={onTogglePurchase}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
