import React, { useState } from 'react';
import { Plus, Download, RefreshCw, Terminal, CreditCard, Wallet, FileText } from 'lucide-react';
import apiClient from '../../../services/apiClient';

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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-5 sm:p-6 border-primary/80 shadow-sm rounded-3xl">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            Expenses & Transactions
          </h1>
        </div>
        <p className="text-xs text-secondary mt-1 max-w-xl">
          Track spending, income and automatically detected financial activity.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {showSmsControls && onScanSms && (
          <button
            type="button"
            disabled={isScanningSms}
            onClick={onScanSms}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-2xl bg-surface-elevated border border-primary/30 text-primary hover:border-blue-500/50 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningSms ? 'animate-spin' : ''}`} />
            <span>{isScanningSms ? 'Scanning...' : 'Scan SMS'}</span>
          </button>
        )}

        {showSmsControls && onOpenDebugger && (
          <button
            type="button"
            onClick={onOpenDebugger}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2.5 rounded-2xl border border-dashed border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-colors"
            title="Open SMS Parser Debugger"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug</span>
          </button>
        )}

        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportPdf}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-2xl bg-surface-elevated border border-primary/30 text-secondary hover:text-primary hover:border-primary/50 active:scale-95 transition-all shadow-sm"
          title="Export Household Financial PDF"
        >
          <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>

        <button
          type="button"
          onClick={onAddIncome}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>+ Add Income</span>
        </button>

        <button
          type="button"
          onClick={onAddExpense}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-blue-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>
    </div>
  );
};
