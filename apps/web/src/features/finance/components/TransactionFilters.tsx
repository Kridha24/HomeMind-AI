import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { FilterSelect } from '../../../components/ui';

export interface FilterState {
  period: string; // 'this-month' | 'last-month' | '30d' | '90d' | 'today' | 'all'
  type: string; // 'ALL' | 'DEBIT' | 'CREDIT'
  source: string; // 'ALL' | 'SMS' | 'MANUAL' | 'IMPORTED' | 'OCR'
  category: string; // 'ALL' or specific
  status: string; // 'ALL' | 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED'
  search: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (partial: Partial<FilterState>) => void;
  onReset: () => void;
  availableCategories: string[];
  totalResults?: number;
  className?: string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  onReset,
  availableCategories,
  totalResults,
  className = '',
}) => {
  const PERIOD_OPTIONS = [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'today', label: 'Today' },
    { value: 'all', label: 'All Time' },
  ];

  const TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Types' },
    { value: 'DEBIT', label: 'Expenses (Debit)' },
    { value: 'CREDIT', label: 'Income (Credit)' },
  ];

  const SOURCE_OPTIONS = [
    { value: 'ALL', label: 'All Sources' },
    { value: 'SMS', label: 'Bank SMS / UPI' },
    { value: 'MANUAL', label: 'Manual Entry' },
    { value: 'OCR', label: 'Receipt OCR' },
    { value: 'IMPORTED', label: 'Imported' },
  ];

  const hasActiveFilters =
    filters.period !== 'this-month' ||
    filters.type !== 'ALL' ||
    filters.source !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.status !== 'ALL' ||
    Boolean(filters.search);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Filter Controls Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period Selector */}
        <FilterSelect
          value={filters.period}
          onChange={(e) => onChange({ period: e.target.value })}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              📅 {opt.label}
            </option>
          ))}
        </FilterSelect>

        {/* Type Selector */}
        <FilterSelect
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        {/* Source Selector */}
        <FilterSelect
          value={filters.source}
          onChange={(e) => onChange({ source: e.target.value })}
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        {/* Category Selector */}
        <FilterSelect
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="max-w-[160px]"
        >
          <option value="ALL">All Categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </FilterSelect>

        {/* Status Selector */}
        <FilterSelect
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed Only</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
        </FilterSelect>

        {/* Reset Filters button if any active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-secondary hover:text-primary rounded-2xl border border-dashed border-primary/40 hover:bg-surface-elevated transition-all"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {totalResults !== undefined && (
          <div className="ml-auto text-xs font-mono font-bold text-muted">
            {totalResults} {totalResults === 1 ? 'record' : 'records'}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mr-1">
            Active:
          </span>

          {filters.period !== 'this-month' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 font-semibold text-[11px]">
              <span>Period: {PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label || filters.period}</span>
              <button
                type="button"
                onClick={() => onChange({ period: 'this-month' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.type !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25 font-semibold text-[11px]">
              <span>Type: {filters.type === 'DEBIT' ? 'Expenses' : 'Income'}</span>
              <button
                type="button"
                onClick={() => onChange({ type: 'ALL' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.source !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 font-semibold text-[11px]">
              <span>Source: {filters.source}</span>
              <button
                type="button"
                onClick={() => onChange({ source: 'ALL' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-semibold text-[11px]">
              <span>Category: {filters.category}</span>
              <button
                type="button"
                onClick={() => onChange({ category: 'ALL' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25 font-semibold text-[11px]">
              <span>Status: {filters.status}</span>
              <button
                type="button"
                onClick={() => onChange({ status: 'ALL' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25 font-semibold text-[11px]">
              <span>Search: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => onChange({ search: '' })}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
