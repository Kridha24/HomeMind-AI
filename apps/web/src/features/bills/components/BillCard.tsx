import React from 'react';
import { Clock, Calendar, CheckCircle, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR, getCategoryVisuals } from '../utils/billFormatters';
import { BillStatusBadge } from './BillStatusBadge';
import { deriveBillDisplayStatus } from '../utils/billStatus';

interface BillCardProps {
  bill: Bill;
  onSelect: (bill: Bill) => void;
  onMarkPaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

export const BillCard: React.FC<BillCardProps> = ({
  bill,
  onSelect,
  onMarkPaid,
  onEdit,
  onDelete,
}) => {
  const visuals = getCategoryVisuals(bill.category);
  const IconComponent = visuals.icon;
  const statusDisplay = deriveBillDisplayStatus(bill);
  const isPaid = bill.status === 'PAID';

  return (
    <div
      onClick={() => onSelect(bill)}
      className="group relative bg-panel border border-primary/70 hover:border-amber-500/50 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3.5"
    >
      {/* Subtle left accent bar for overdue bills */}
      {statusDisplay.key === 'OVERDUE' && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-rose-500 rounded-r-full" />
      )}

      {/* Top: Icon + Title + Status */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${visuals.bgClass} ${visuals.textClass} ${visuals.borderClass}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              {bill.category}
            </span>
            <h3 className="text-sm font-bold text-primary truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {bill.title}
            </h3>
            {bill.provider && (
              <p className="text-xs text-secondary truncate">{bill.provider}</p>
            )}
          </div>
        </div>

        <BillStatusBadge bill={bill} />
      </div>

      {/* Middle: Amount & Due Date Strip */}
      <div className="flex items-baseline justify-between border-t border-b border-primary/50 py-2.5">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-secondary block">
            {isPaid ? 'Amount Settled' : 'Amount Due'}
          </span>
          <span className="text-lg font-extrabold text-primary font-mono tracking-tight">
            {formatINR(bill.amount)}
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <span className="text-[10px] font-semibold text-secondary block">
            {isPaid ? 'Settlement Date' : 'Due Date'}
          </span>
          <span className="text-xs font-bold text-primary flex items-center justify-end gap-1">
            <Calendar className="w-3 h-3 text-secondary" />
            <span>{statusDisplay.formattedDueDate}</span>
          </span>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(bill);
            }}
            className="p-2 text-secondary hover:text-primary hover:bg-secondary/70 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Edit bill"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bill);
            }}
            className="p-2 text-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Delete bill"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {!isPaid ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkPaid(bill);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1.5 min-h-[40px]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Paid</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(bill);
            }}
            className="px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 text-secondary hover:text-primary text-xs font-semibold border border-primary/60 transition-colors flex items-center gap-1 min-h-[40px]"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
