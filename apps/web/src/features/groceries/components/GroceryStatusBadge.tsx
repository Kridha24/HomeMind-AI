import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, PackageCheck } from 'lucide-react';
import { GroceryUrgency } from '../utils/groceryFormatters';

interface GroceryStatusBadgeProps {
  urgency: GroceryUrgency;
  isPurchased?: boolean;
  className?: string;
}

export const GroceryStatusBadge: React.FC<GroceryStatusBadgeProps> = ({
  urgency,
  isPurchased,
  className = '',
}) => {
  if (isPurchased || urgency === 'PURCHASED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Purchased</span>
      </span>
    );
  }

  if (urgency === 'URGENT') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Urgent Need</span>
      </span>
    );
  }

  if (urgency === 'LOW_STOCK') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Low Stock</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 ${className}`}
    >
      <PackageCheck className="w-3 h-3 flex-shrink-0" />
      <span>In Stock</span>
    </span>
  );
};
