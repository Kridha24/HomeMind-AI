import React from 'react';
import { MoreHorizontal, Edit3, Trash2, CheckCircle, ExternalLink, Calendar, ArrowRight } from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR, getCategoryVisuals } from '../utils/billFormatters';
import { BillStatusBadge } from './BillStatusBadge';
import { deriveBillDisplayStatus } from '../utils/billStatus';

interface BillRowProps {
  bill: Bill;
  onSelect: (bill: Bill) => void;
  onMarkPaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

export const BillRow: React.FC<BillRowProps> = ({
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
      className="group relative flex items-center justify-between gap-3 px-4 py-3.5 bg-panel border border-primary/70 hover:border-amber-500/50 rounded-2xl transition-all cursor-pointer shadow-2xs hover:shadow-xs"
    >
      {/* Subtle left accent bar for overdue bills */}
      {statusDisplay.key === 'OVERDUE' && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-rose-500 rounded-r-full" />
      )}

      {/* Left: Category Icon & Title / Provider */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${visuals.bgClass} ${visuals.textClass} ${visuals.borderClass}`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-primary truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {bill.title}
            </h3>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/60 text-secondary border border-primary/60 flex-shrink-0">
              {bill.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary truncate">
            {bill.provider && (
              <span className="truncate max-w-[160px] font-medium text-secondary">
                {bill.provider}
              </span>
            )}
            {bill.provider && <span className="text-muted">•</span>}
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-muted" />
              <span>{statusDisplay.formattedDueDate}</span>
            </span>
            {bill.notes && (
              <>
                <span className="text-muted">•</span>
                <span className="truncate max-w-[200px] text-muted italic">
                  {bill.notes}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Status Badge */}
      <div className="hidden md:flex items-center justify-center flex-shrink-0">
        <BillStatusBadge bill={bill} />
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm sm:text-base font-extrabold text-primary font-mono tracking-tight">
            {formatINR(bill.amount)}
          </p>
          <span className="text-[10px] font-medium text-secondary block sm:hidden">
            {statusDisplay.label}
          </span>
        </div>

        {/* Primary Action Button */}
        {!isPaid ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkPaid(bill);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark Paid</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(bill);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary/80 text-secondary hover:text-primary text-xs font-semibold border border-primary/60 transition-colors flex items-center gap-1"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(bill);
            }}
            className="p-1.5 text-secondary hover:text-primary hover:bg-secondary/70 rounded-lg transition-colors"
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
            className="p-1.5 text-secondary hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete bill"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
