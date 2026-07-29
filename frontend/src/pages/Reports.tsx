import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useSettingStore } from '../stores/useSettingStore';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const { currencySymbol } = useSettingStore();

  const handleGeneratePDF = () => {
    window.location.href = '/api/v1/reports/monthly/pdf';
    setReports((prev) => [
      {
        id: Date.now().toString(),
        title: `Monthly Financial Audit Report (${currencySymbol})`,
        type: 'MONTHLY_FINANCIAL',
        createdAt: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Executive PDF Reports Exporter
          </h1>
          <p className="text-xs text-slate-400">Generate compiled monthly audit reports with PDFKit</p>
        </div>

        <button
          onClick={handleGeneratePDF}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Generate PDF Report</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No reports generated"
          description="Export comprehensive household PDF reports containing monthly expense ledgers, utility bill audits, and appliance telemetry."
          actionLabel="+ Generate PDF Report"
          onAction={handleGeneratePDF}
        />
      ) : (
        <div className="glass-panel border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-100 flex items-center justify-between">
            <span>Exported Household Reports</span>
            <span className="text-xs text-emerald-400 font-mono">{reports.length} Reports</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {reports.map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{report.title}</h4>
                    <span className="text-[10px] text-slate-500">Generated on {report.createdAt}</span>
                  </div>
                </div>
                <button
                  onClick={handleGeneratePDF}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
