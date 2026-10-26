import React, { useState } from 'react';
import { Plus, Download, RefreshCw, Terminal, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { CompactHeader } from '../../../components/common/CompactHeader';
import { Button } from '../../../components/common/Button';

interface FinanceHeaderProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  isScanningSms?: boolean;
  onScanSms?: () => void;
  onOpenDebugger?: () => void;
  showSmsControls?: boolean;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  onAddExpense,
  onAddIncome,
  isScanningSms = false,
  onScanSms,
  onOpenDebugger,
  showSmsControls = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.get('/reports/export/pdf', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'HomeMind.AI_Household_Export.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export household financial report:', err);
      alert('Unable to generate export PDF right now. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Icon Header */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                Ghar Ka Kharcha & Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Finance
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl font-medium mt-0.5">
              Ghar ka kharcha, income, aur bachat ka complete hisab-kitab.
            </p>
          </div>
        </div>

        {/* Action Buttons: Clean, Spacious, Touch-Friendly (>=44px), Never touching */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap pt-1 sm:pt-0">
          {showSmsControls && onScanSms && (
            <button
              type="button"
              onClick={onScanSms}
              disabled={isScanningSms}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all min-h-[44px] active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningSms ? 'animate-spin' : ''}`} />
              <span>Scan SMS</span>
            </button>
          )}

          {showSmsControls && onOpenDebugger && (
            <button
              type="button"
              onClick={onOpenDebugger}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl sm:rounded-2xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 text-xs font-bold transition-all min-h-[44px] active:scale-95"
            >
              <Terminal className="w-4 h-4" />
              <span>Debug</span>
            </button>
          )}

          {/* Export PDF with clear spacing */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold transition-all min-h-[44px] shadow-2xs active:scale-95 disabled:opacity-50"
            title="Download PDF statement"
            aria-label="Export financial report PDF"
          >
            <Download className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {/* + Income Button */}
          <button
            type="button"
            onClick={onAddIncome}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 border border-emerald-400/30 transition-all min-h-[44px] active:scale-95"
          >
            <TrendingUp className="w-4 h-4" />
            <span>+ Kamai (Income)</span>
          </button>

          {/* + Expense Button */}
          <button
            type="button"
            onClick={onAddExpense}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 border border-rose-400/30 transition-all min-h-[44px] active:scale-95"
          >
            <TrendingDown className="w-4 h-4" />
            <span>+ Kharcha (Expense)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceHeader;
