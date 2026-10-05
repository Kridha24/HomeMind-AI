import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
    <div className="space-y-1.5">
      {/* 7. Category Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-3 sm:px-3.5 rounded-xl bg-secondary/30 dark:bg-slate-900/50 hover:bg-secondary/50 border border-primary/50 transition-all text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-secondary shrink-0">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${color.badge} ${color.border}`}
          >
            {category}
          </span>

          <span className="text-xs text-secondary font-medium truncate">
            {items.length} {items.length === 1 ? 'item' : 'items'}
            <span className="mx-1.5">•</span>
            {purchasedCount} purchased
          </span>
        </div>

        {/* Category progress indicator */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isComplete ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              ✓ Completed
            </span>
          ) : (
            <span className="text-[11px] font-mono font-medium text-secondary">
              {purchasedCount} / {items.length}
            </span>
          )}
        </div>
      </button>

      {/* Group Items (Collapsible) */}
      {isExpanded && (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-2 md:hidden">
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
          <div className="hidden md:flex md:flex-col gap-1.5">
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

