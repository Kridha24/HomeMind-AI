import React from 'react';
import { FileSpreadsheet, Download, CheckCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Household Performance Reports & Exports
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
        </h1>
        <p className="text-xs text-slate-400">Generate and export automated PDF/CSV reports across expenses, inventory, medicine log, and family activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-5 space-y-4 border-blue-500/30">
          <h3 className="font-bold text-sm text-slate-100">Monthly Executive Financial Report</h3>
          <p className="text-xs text-slate-400">Complete breakdown of income, outlays, utility bills, savings rates, and budget variance.</p>
          <a
            href="/api/v1/reports/monthly/pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 block text-center"
          >
            <Download className="w-4 h-4 inline" /> Download Monthly PDF
          </a>
        </div>

        <div className="glass-panel p-5 space-y-4 border-purple-500/30">
          <h3 className="font-bold text-sm text-slate-100">Pantry & Inventory Audit Report</h3>
          <p className="text-xs text-slate-400">Detailed snapshot of grocery stock, consumption rates, zero-food-waste metrics, and shopping lists.</p>
          <button
            onClick={() => alert('Downloading Inventory Audit CSV...')}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
          >
            <Download className="w-4 h-4" /> Download Inventory CSV
          </button>
        </div>

        <div className="glass-panel p-5 space-y-4 border-emerald-500/30">
          <h3 className="font-bold text-sm text-slate-100">Appliance & Maintenance History Log</h3>
          <p className="text-xs text-slate-400">Chronological service receipts, technician notes, warranty timelines, and cost tallies.</p>
          <button
            onClick={() => alert('Downloading Appliance Maintenance PDF...')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
          >
            <Download className="w-4 h-4" /> Download Maintenance PDF
          </button>
        </div>
      </div>
    </div>
  );
};
