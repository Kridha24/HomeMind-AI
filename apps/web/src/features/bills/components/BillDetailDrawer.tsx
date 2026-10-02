import React from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit3,
  Tag,
  Building,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR, getCategoryVisuals } from '../utils/billFormatters';
import { deriveBillDisplayStatus } from '../utils/billStatus';
import { BillStatusBadge } from './BillStatusBadge';

interface BillDetailDrawerProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onMarkPaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

export const BillDetailDrawer: React.FC<BillDetailDrawerProps> = ({
  isOpen,
  bill,
  onClose,
  onMarkPaid,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !bill) return null;

  const visuals = getCategoryVisuals(bill.category);
  const IconComponent = visuals.icon;
  const statusDisplay = deriveBillDisplayStatus(bill);
  const isPaid = bill.status === 'PAID';

  const due = new Date(bill.dueDate);
  const fullDueDateStr = due.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const createdStr = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const paidDateStr = bill.paidAt
    ? new Date(bill.paidAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-drawer-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-panel border-l border-primary/80 h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-primary/60 space-y-4">
          <div className="flex items-center justify-between">
            <BillStatusBadge bill={bill} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-start gap-3.5 pt-1">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${visuals.bgClass} ${visuals.textClass} ${visuals.borderClass}`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 id="bill-drawer-title" className="text-lg font-extrabold text-primary truncate">
                {bill.title}
              </h2>
              {bill.provider ? (
                <p className="text-xs text-secondary truncate mt-0.5">{bill.provider}</p>
              ) : (
                <p className="text-xs text-secondary mt-0.5">{bill.category}</p>
              )}
            </div>
          </div>

          {/* Amount Hero */}
          <div className="p-4 bg-secondary/30 rounded-2xl border border-primary/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                {isPaid ? 'Amount Settled' : 'Total Due'}
              </span>
              <span className="text-2xl font-extrabold text-primary font-mono tracking-tight">
                {formatINR(bill.amount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                Schedule
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{statusDisplay.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Body Details */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Due Date & Settlement Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Timeline & Schedule
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-primary/40">
                <span className="text-secondary flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted" /> Due Date
                </span>
                <span className="font-bold text-primary">{fullDueDateStr}</span>
              </div>

              {isPaid && (
                <div className="flex items-center justify-between py-2 border-b border-primary/40">
                  <span className="text-secondary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Settled On
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {paidDateStr || 'Recorded'}
                  </span>
                </div>
              )}

              {createdStr && (
                <div className="flex items-center justify-between py-2 border-b border-primary/40">
                  <span className="text-secondary">Created On</span>
                  <span className="font-medium text-secondary">{createdStr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Classification
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-primary/40">
                <span className="text-secondary flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted" /> Category
                </span>
                <span className="font-semibold text-primary px-2.5 py-0.5 rounded-full bg-secondary/50 border border-primary/60">
                  {bill.category}
                </span>
              </div>

              {bill.provider && (
                <div className="flex items-center justify-between py-2 border-b border-primary/40">
                  <span className="text-secondary flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-muted" /> Provider / Merchant
                  </span>
                  <span className="font-bold text-primary">{bill.provider}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Instructions */}
          {bill.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Notes & Reminders
              </h3>
              <div className="p-3 bg-secondary/30 rounded-xl border border-primary/60 text-xs text-primary leading-relaxed whitespace-pre-wrap">
                {bill.notes}
              </div>
            </div>
          )}

          {/* Payment History / Audit Notice */}
          <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-xs space-y-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Financial Integrity & Audit
            </span>
            <p className="text-[11px] text-secondary leading-normal">
              {isPaid
                ? 'This payment is reconciled with your Finance Workspace transactions. Deleting or modifying does not erase bank audit history.'
                : 'When marked paid, HomeMind will atomically record the corresponding expense in your Finance workspace.'}
            </p>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-5 sm:p-6 border-t border-primary/60 bg-secondary/20 flex flex-col gap-2.5">
          {!isPaid ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onMarkPaid(bill);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment / Mark Paid</span>
            </button>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(bill);
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-primary/80 text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(bill);
              }}
              className="py-2 px-3 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
