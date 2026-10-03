import React from 'react';
import { Receipt, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatPercentage } from '../utils/analyticsFormatters';

interface BillsAnalyticsProps {
  bills: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    settlementRate: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  };
}

export const BillsAnalytics: React.FC<BillsAnalyticsProps> = ({ bills }) => {
  const navigate = useNavigate();

  const total = bills.total || 0;
  const settlementRate = bills.settlementRate || 0;
  const overdue = bills.overdue || 0;
  const unpaid = bills.unpaid || 0;
  const paid = bills.paid || 0;

  // Donut sizing
  const size = 110;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (settlementRate / 100) * circumference;

  return (
    <div className="glass-panel p-5 border-primary space-y-4">
      <div className="flex items-center justify-between border-b border-primary pb-3">
        <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
          <Receipt className="w-4 h-4 text-amber-500" />
          <span>Bills & Liabilities</span>
        </h3>
        <button
          onClick={() => navigate('/bills')}
          className="text-xs text-blue-500 hover:text-blue-400 font-bold hover:underline"
        >
          View All ({total})
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={settlementRate === 100 ? '#10b981' : '#f59e0b'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-primary font-mono">
              {formatPercentage(settlementRate)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted font-bold">
              Settled
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
          <div
            onClick={() => navigate('/bills?status=PAID')}
            className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid</span>
            </div>
            <div className="mt-1 font-mono font-black text-primary text-sm">
              {paid}
            </div>
            <div className="text-[10px] text-muted font-mono">
              {formatINR(bills.paidAmount || 0)}
            </div>
          </div>

          <div
            onClick={() => navigate('/bills?status=PENDING')}
            className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Unpaid</span>
            </div>
            <div className="mt-1 font-mono font-black text-primary text-sm">
              {unpaid}
            </div>
            <div className="text-[10px] text-muted font-mono">
              {formatINR(bills.unpaidAmount || 0)}
            </div>
          </div>

          {overdue > 0 && (
            <div
              onClick={() => navigate('/bills?status=OVERDUE')}
              className="col-span-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Overdue Action Required</span>
              </div>
              <span className="font-mono font-bold text-rose-400">
                {overdue} {overdue === 1 ? 'bill' : 'bills'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
