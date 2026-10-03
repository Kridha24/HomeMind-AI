import React from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { formatCount } from '../utils/analyticsFormatters';

interface AnalyticsHeaderProps {
  transactionCount: number;
  periodLabel: string;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  transactionCount,
  periodLabel,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl glass-panel border border-primary/80 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
            Analytics & Trends
          </h1>
          <p className="text-xs text-secondary">
            Financial telemetry, spending category breakdown, and operational health metrics.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="px-3 py-1 rounded-xl bg-secondary/80 border border-primary text-secondary text-xs font-bold font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{formatCount(transactionCount, 'Transaction', 'Transactions')} Analyzed</span>
        </span>
      </div>
    </div>
  );
};
