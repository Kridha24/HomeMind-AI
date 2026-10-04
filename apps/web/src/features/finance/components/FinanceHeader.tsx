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
    <CompactHeader
      icon={CreditCard}
      accent="expenses"
      title="Expenses & Ledger"
      description="Track household spending, income, and verified ledger activity."
      actions={
        <>
          {showSmsControls && onScanSms && (
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={isScanningSms}
              onClick={onScanSms}
            >
              Scan SMS
            </Button>
          )}

          {showSmsControls && onOpenDebugger && (
            <Button
              variant="ghost"
              size="sm"
              icon={Terminal}
              onClick={onOpenDebugger}
              className="text-amber-500 hover:text-amber-600"
            >
              Debug
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            loading={isExporting}
            onClick={handleExportPdf}
          >
            Export PDF
          </Button>

          <Button
            variant="emerald"
            size="sm"
            icon={TrendingUp}
            onClick={onAddIncome}
          >
            + Income
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={TrendingDown}
            onClick={onAddExpense}
          >
            + Expense
          </Button>
        </>
      }
    />
  );
};

export default FinanceHeader;
