import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { AnalyticsPeriod } from '../types';

interface AnalyticsPeriodFilterProps {
  selectedPeriod: AnalyticsPeriod;
  onSelectPeriod: (period: AnalyticsPeriod) => void;
  startDate?: string;
  endDate?: string;
  onDateChange?: (start?: string, end?: string) => void;
}

const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'month', label: 'This Month' },
  { id: '3m', label: 'Last 3 Months' },
  { id: '6m', label: 'Last 6 Months' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

export const AnalyticsPeriodFilter: React.FC<AnalyticsPeriodFilterProps> = ({
  selectedPeriod,
  onSelectPeriod,
  startDate,
  endDate,
  onDateChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/40 border border-primary/60 text-muted text-xs font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Period</span>
        </div>

        {PERIOD_OPTIONS.map((opt) => {
          const isSelected = selectedPeriod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectPeriod(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isSelected
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 border border-violet-500/40'
                  : 'bg-secondary/60 hover:bg-secondary border border-primary/60 text-secondary hover:text-primary hover:-translate-y-px'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {selectedPeriod === 'custom' && onDateChange && (
        <div className="glass-panel p-3.5 border-primary flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <span className="font-semibold text-muted">From:</span>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="px-2.5 py-1 rounded-lg bg-background border border-primary text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted">To:</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-background border border-primary text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
