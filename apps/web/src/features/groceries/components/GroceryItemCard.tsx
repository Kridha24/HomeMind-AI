import React from 'react';
import { Check, Edit2, Trash2, Plus, Minus, User } from 'lucide-react';
import { GroceryItem } from '../../../types';
import {
  getGroceryUrgency,
  formatQuantityWithUnit,
  formatPurchaseTime,
  formatExpiryStatus,
  getCategoryColor,
} from '../utils/groceryFormatters';
import { GroceryStatusBadge } from './GroceryStatusBadge';

interface GroceryItemCardProps {
  item: GroceryItem;
  onTogglePurchase: (id: string, purchased: boolean) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  onTogglePurchase,
  onEdit,
  onDelete,
  onUpdateQuantity,
}) => {
  const isPurchased = Boolean(item.purchaseDate);
  const urgency = getGroceryUrgency(item);
  const categoryColor = getCategoryColor(item.category);
  const expiryInfo = formatExpiryStatus(item.expiryDate);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePurchase(item.id, !isPurchased);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextQty = Math.max(0, Number((item.quantity - 1).toFixed(1)));
    onUpdateQuantity(item.id, nextQty);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextQty = Number((item.quantity + 1).toFixed(1));
    onUpdateQuantity(item.id, nextQty);
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isPurchased
          ? 'bg-secondary/20 border-primary/40 opacity-80'
          : 'bg-panel border-primary/70 shadow-xs'
      }`}
    >
      {/* Top Header Row: Checkbox + Title + Category Badge */}
      <div className="flex items-start gap-3">
        {/* Large 44x44px touch target Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isPurchased}
          aria-label={`Mark ${item.name} as ${isPurchased ? 'pending' : 'purchased'}`}
          onClick={handleCheckboxClick}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 -mt-1 active:scale-90 transition-transform"
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
              isPurchased
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-400 dark:border-slate-600 bg-transparent'
            }`}
          >
            {isPurchased && <Check className="w-4 h-4 stroke-[3] animate-in zoom-in-50 duration-150" />}
          </div>
        </button>

        {/* Title & Badges */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-sm font-bold tracking-tight truncate ${
                isPurchased ? 'line-through text-secondary' : 'text-primary'
              }`}
            >
              {item.name}
            </h4>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${categoryColor.badge} ${categoryColor.border}`}
            >
              {item.category}
            </span>
          </div>

          {/* Urgency and Expiry */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <GroceryStatusBadge urgency={urgency} isPurchased={isPurchased} />
            {expiryInfo && !isPurchased && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  expiryInfo.isUrgent
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20'
                    : 'text-secondary'
                }`}
              >
                {expiryInfo.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Metadata & Controls Bar */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-primary/50 text-xs">
        {/* Quantity Stepper with >= 44px touch targets */}
        <div className="flex items-center gap-1 bg-secondary/50 dark:bg-slate-900/60 p-1 rounded-xl border border-primary/50">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={item.quantity <= 0}
            aria-label="Decrease quantity"
            className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-secondary hover:text-primary active:bg-secondary/70 disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono font-bold text-primary min-w-[55px] text-center text-xs">
            {formatQuantityWithUnit(item.quantity, item.unit)}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            aria-label="Increase quantity"
            className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-secondary hover:text-primary active:bg-secondary/70"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons with 44px touch target */}
        <div className="flex items-center gap-1">
          {isPurchased && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mr-1 hidden sm:inline">
              {formatPurchaseTime(item.purchaseDate)}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            aria-label="Edit item"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-secondary hover:text-indigo-600 active:bg-secondary/60"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            aria-label="Delete item"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-secondary hover:text-rose-600 active:bg-secondary/60"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
