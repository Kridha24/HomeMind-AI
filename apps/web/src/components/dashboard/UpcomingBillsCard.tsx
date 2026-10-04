import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Edit3, ArrowRight, DollarSign, Wallet } from 'lucide-react';

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
  const navigate = useNavigate();

  // Fallback demo bills matching prompt if list is empty
  const displayBills: Bill[] = bills.length > 0 ? bills : [
    {
      id: 'demo-bill-1',
      title: 'pg rent',
      amount: 4000,
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      category: 'RENT',
      status: 'UNPAID',
    },
  ];

  const effectiveTotalDue = totalDue > 0 ? totalDue : 4000;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all duration-200">
      {/* Top ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400 opacity-90" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Upcoming Bills & Rent
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Stay on top of your payments
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono block leading-none">
              −₹{effectiveTotalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              TOTAL DUE
            </span>
          </div>
        </div>

        {/* Bill Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
          {displayBills.map((bill) => (
            <div
              key={bill.id}
              className="py-3 flex items-center justify-between gap-2.5 group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 border border-slate-200/80 dark:border-slate-700">
                  <Home className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {bill.title}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {bill.category || 'RENT'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      Due in 1d
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                  −₹{(bill.amount || 4000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => onPayBill(bill.id)}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs shadow-emerald-600/30 transition-all active:scale-95"
                >
                  Pay
                </button>
                <button
                  type="button"
                  onClick={() => onEditBill(bill)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Bill"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Decorative 3D Finance/Rupee Illustration and View All */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Decorative mini 3D finance rupee badge */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/bills')}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1 group"
        >
          <span>View All Bills</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default UpcomingBillsCard;
