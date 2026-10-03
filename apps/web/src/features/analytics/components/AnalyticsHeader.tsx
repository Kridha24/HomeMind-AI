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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
      <div>
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span>Household Intelligence & Analytics</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Deterministic financial telemetry, spending category breakdown, and operational health metrics.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="px-3.5 py-1.5 rounded-xl bg-secondary/80 border border-primary text-secondary text-xs font-bold font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{formatCount(transactionCount, 'Transaction', 'Transactions')} Analyzed</span>
        </span>
      </div>
    </div>
  );
};
