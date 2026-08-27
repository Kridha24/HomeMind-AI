import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileText, Sparkles, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';
import { EmptyState } from '../components/common/EmptyState';
import { useSettingStore } from '../stores/useSettingStore';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const { currencySymbol } = useSettingStore();

  const handleGeneratePDF = async () => {
    setDownloading(true);
    setError('');

    try {
      const res = await apiClient.get('/reports/monthly/pdf', {
        responseType: 'blob',
      });

      // Create downloadable blob URL
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `HomeMind_Monthly_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Record in recent reports history
      setReports((prev) => [
        {
          id: Date.now().toString(),
          title: `Monthly Financial & Telemetry Report (${currencySymbol})`,
          type: 'MONTHLY_FINANCIAL',
          createdAt: new Date().toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('PDF download error:', err);
      setError('Failed to generate PDF report. Please ensure your session is active.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" /> Executive PDF Reports Exporter
          </h1>
          <p className="text-xs text-secondary">
            Generate compiled monthly audit reports containing expenses, utility bills, and low-stock pantry warnings.
          </p>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={downloading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-60"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate PDF Report</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No reports generated in this session"
          description="Export comprehensive household PDF reports containing monthly expense ledgers, utility bill audits, and appliance telemetry."
          actionLabel="+ Generate PDF Report"
          onAction={handleGeneratePDF}
        />
      ) : (
        <div className="glass-panel border-primary/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex items-center justify-between bg-secondary/30">
            <span>Exported Household Reports</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {reports.length} Generated
            </span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-primary">{report.title}</h4>
                    <span className="text-[10px] text-muted">Generated on {report.createdAt}</span>
                  </div>
                </div>
                <button
                  onClick={handleGeneratePDF}
                  disabled={downloading}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Re-download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
