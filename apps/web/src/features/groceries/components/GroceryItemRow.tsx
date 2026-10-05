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

interface GroceryItemRowProps {
  item: GroceryItem;
  onTogglePurchase: (id: string, purchased: boolean) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
}

export const GroceryItemRow: React.FC<GroceryItemRowProps> = ({
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
      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-150 ${
        isPurchased
          ? 'bg-secondary/15 border-primary/40 opacity-75 dark:opacity-70 hover:opacity-90'
          : 'bg-panel border-primary/70 hover:border-indigo-500/40 hover:shadow-xs'
      }`}
    >
      {/* LEFT: Checkbox + Name + Category chip + Secondary metadata */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        {/* Accessible Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isPurchased}
          aria-label={`Mark ${item.name} as ${isPurchased ? 'pending' : 'purchased'}`}
          onClick={handleCheckboxClick}
          className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all flex-shrink-0 cursor-pointer ${
            isPurchased
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
              : 'border-slate-400 dark:border-slate-600 hover:border-emerald-500 bg-transparent'
          }`}
        >
          {isPurchased && <Check className="w-3.5 h-3.5 stroke-[3] animate-in zoom-in-50 duration-150" />}
        </button>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-bold tracking-tight truncate ${
                isPurchased
                  ? 'line-through text-secondary/80'
                  : 'text-primary'
              }`}
            >
              {item.name}
            </h4>

            {/* Category Chip */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${categoryColor.badge} ${categoryColor.border}`}
            >
              {item.category}
            </span>

            {/* Status / Urgency */}
            {isPurchased ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Purchased
              </span>
            ) : urgency === 'URGENT' || urgency === 'LOW_STOCK' ? (
              <GroceryStatusBadge urgency={urgency} isPurchased={false} />
            ) : null}

            {/* Expiry Warning */}
            {expiryInfo && !isPurchased && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  expiryInfo.isUrgent
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold'
                    : 'text-secondary'
                }`}
              >
                {expiryInfo.text}
              </span>
            )}
          </div>

          {/* Secondary metadata: purchased time or creator */}
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary">
            {isPurchased ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Purchased • {formatPurchaseTime(item.purchaseDate) || 'Recently'}
              </span>
            ) : item.createdBy ? (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-muted" />
                <span>Added by {item.createdBy}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* CENTER / RIGHT: Status, Quantity controls, Edit, Delete */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Quantity quick buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-secondary/40 dark:bg-slate-900/60 p-0.5 sm:p-1 rounded-xl border border-primary/50">
          <button
            type="button"
            onClick={handleDecrement}
            title="Decrease quantity"
            disabled={item.quantity <= 0}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-secondary/70 disabled:opacity-30 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="px-1.5 sm:px-2 text-xs font-mono font-bold text-primary min-w-[45px] sm:min-w-[50px] text-center">
            {formatQuantityWithUnit(item.quantity, item.unit)}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            title="Increase quantity"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-secondary/70 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="Edit item"
            className="p-1.5 sm:p-2 rounded-lg text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            title="Delete item"
            className="p-1.5 sm:p-2 rounded-lg text-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

