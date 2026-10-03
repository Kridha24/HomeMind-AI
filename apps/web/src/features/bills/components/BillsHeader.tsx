import React from 'react';
import { Plus, Download, Calendar, List, Layers, ShieldCheck, Receipt } from 'lucide-react';

interface BillsHeaderProps {
  viewMode: 'list' | 'timeline' | 'calendar';
  onViewModeChange: (mode: 'list' | 'timeline' | 'calendar') => void;
  onAddBill: () => void;
  onExport: () => void;
  totalBills: number;
}

export const BillsHeader: React.FC<BillsHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onAddBill,
  onExport,
  totalBills,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 glass-panel px-4 py-3 sm:px-5 sm:py-3.5 border-primary/80 shadow-xs rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
          <Receipt className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
              Bills & Utilities
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Audited</span>
            </span>
          </div>
          <p className="text-xs text-secondary">
            Stay ahead of household bills, rent, and recurring payments.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Switcher */}
        <div
          className="inline-flex items-center p-1 bg-secondary/50 dark:bg-slate-900/60 rounded-xl border border-primary/60"
          role="tablist"
          aria-label="View Switcher"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">List</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'timeline'}
            onClick={() => onViewModeChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Timeline</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Calendar</span>
          </button>
        </div>

        {/* Export Button */}
        {totalBills > 0 && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/40 transition-colors"
            title="Export Bills to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Add Bill Button */}
        <button
          type="button"
          onClick={onAddBill}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-amber-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
        </button>
      </div>
    </header>
  );
};
