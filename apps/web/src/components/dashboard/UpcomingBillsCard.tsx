import React from 'react';
import { FileText, Clock, Edit3, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category?: string;
  status?: 'PAID' | 'UNPAID' | 'OVERDUE';
}

interface UpcomingBillsCardProps {
  bills: Bill[];
  totalDue: number;
  format: (amount: number) => string;
  onPayBill: (billId: string) => Promise<void> | void;
  onEditBill: (bill: Bill) => void;
  onAddBill: () => void;
}

export const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({
  bills,
  totalDue,
  format,
  onPayBill,
  onEditBill,
  onAddBill,
}) => {
  const getDueStatus = (dueDateStr: string, status?: string) => {
    if (status === 'PAID') {
      return {
        label: 'Paid',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    }

    const due = new Date(dueDateStr);
    const now = new Date();
    const isToday =
      due.getDate() === now.getDate() &&
      due.getMonth() === now.getMonth() &&
      due.getFullYear() === now.getFullYear();

    if (isToday) {
      return {
        label: 'Due Today',
        className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-extrabold',
      };
    }

    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays}d`,
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
      };
    }
    return {
      label: due.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    };
  };

  const effectiveTotalDue =
    totalDue > 0
      ? totalDue
      : bills
          .filter((b) => b.status !== 'PAID')
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                Upcoming Bills & Rent
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Room rent, electricity, Wi-Fi & utilities
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-base sm:text-xl font-extrabold text-red-600 dark:text-red-400 font-mono block">
              -{format(effectiveTotalDue)}
            </span>
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Total Due
            </span>
          </div>
        </div>

        {/* Rows */}
        {bills.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
            {bills.slice(0, 4).map((bill) => {
              const dueBadge = getDueStatus(bill.dueDate, bill.status);
              return (
                <div
                  key={bill.id}
                  className="py-2.5 sm:py-3 flex items-center justify-between gap-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {bill.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wider flex-shrink-0">
                        {bill.category || 'Utility'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] border ${dueBadge.className}`}
                      >
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{dueBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-red-600 dark:text-red-400 font-mono">
                      -{format(bill.amount)}
                    </span>
                    <button
                      onClick={() => onPayBill(bill.id)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/25 rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-2xs"
                      title="Mark as Paid"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() => onEditBill(bill)}
                      className="p-1 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-md transition-colors"
                      title="Edit Bill"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-7 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto opacity-80" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No bills due right now! 🎉
            </p>
            <p className="text-[11px] text-slate-400">
              All room rent, utilities, and subscriptions are fully settled.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">
          {bills.length} unpaid bill{bills.length === 1 ? '' : 's'} registered
        </span>
        <button
          onClick={onAddBill}
          className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" /> Add Bill / Rent
        </button>
      </div>
    </div>
  );
};
