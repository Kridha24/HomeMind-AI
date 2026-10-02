import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Bill } from '../../../types';
import { deriveBillDisplayStatus } from '../utils/billStatus';

interface BillStatusBadgeProps {
  bill: Bill;
  showRelativeLabel?: boolean;
}

export const BillStatusBadge: React.FC<BillStatusBadgeProps> = ({ bill, showRelativeLabel = true }) => {
  const display = deriveBillDisplayStatus(bill);

  const renderIcon = () => {
    switch (display.key) {
      case 'PAID':
        return <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />;
      case 'DUE_TODAY':
        return <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400 animate-pulse" />;
      case 'DUE_SOON':
        return <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
      default:
        return <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${display.badgeClass}`}
      role="status"
      aria-label={`Status: ${display.label}`}
    >
      {renderIcon()}
      <span>{showRelativeLabel ? display.label : bill.status}</span>
    </span>
  );
};
