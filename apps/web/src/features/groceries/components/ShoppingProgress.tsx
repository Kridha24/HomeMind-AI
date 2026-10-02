import React from 'react';
import { CheckCircle2, ShoppingBasket } from 'lucide-react';

interface ShoppingProgressProps {
  totalItems: number;
  purchasedCount: number;
  progressPercent: number;
  isShoppingComplete: boolean;
  className?: string;
}

export const ShoppingProgress: React.FC<ShoppingProgressProps> = ({
  totalItems,
  purchasedCount,
  progressPercent,
  isShoppingComplete,
  className = '',
}) => {
  if (totalItems === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-xs font-semibold text-secondary">
          <span className="flex items-center gap-1.5">
            <ShoppingBasket className="w-3.5 h-3.5 text-muted" />
            Shopping Progress
          </span>
          <span>No items</span>
        </div>
        <div className="w-full h-2.5 bg-secondary/50 rounded-full overflow-hidden">
          <div className="h-full bg-slate-300 dark:bg-slate-700 w-0 transition-all duration-300" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-primary">
        <span className="flex items-center gap-1.5">
          {isShoppingComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in-75 duration-200" />
          ) : (
            <ShoppingBasket className="w-4 h-4 text-indigo-500" />
          )}
          <span>{isShoppingComplete ? 'All Items Picked Up' : 'Shopping Progress'}</span>
        </span>
        <span className="font-mono text-xs">
          <strong className={isShoppingComplete ? 'text-emerald-500' : 'text-primary'}>
            {progressPercent}%
          </strong>{' '}
          <span className="text-secondary font-normal font-sans">
            ({purchasedCount}/{totalItems} items)
          </span>
        </span>
      </div>

      <div
        className="w-full h-2.5 bg-secondary/60 rounded-full overflow-hidden p-0.5 border border-primary/20"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Shopping completion progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isShoppingComplete
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </div>
  );
};
