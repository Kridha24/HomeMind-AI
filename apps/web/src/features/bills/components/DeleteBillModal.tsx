import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR } from '../utils/billFormatters';
import apiClient from '../../../services/apiClient';

interface DeleteBillModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteBillModal: React.FC<DeleteBillModalProps> = ({
  isOpen,
  bill,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !bill) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await apiClient.delete(`/bills/${bill.id}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete bill:', err);
      setError(err.response?.data?.error || 'Failed to delete bill record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-bill-title"
    >
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="delete-bill-title" className="font-extrabold text-base text-primary">
              Delete Bill Record?
            </h3>
            <p className="text-xs text-secondary">
              {bill.title} ({formatINR(bill.amount)})
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs text-secondary">
          <p>
            Are you sure you want to remove <span className="font-bold text-primary">{bill.title}</span> from your upcoming household bills?
          </p>

          <div className="p-3 bg-secondary/30 rounded-2xl border border-primary/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <span className="font-bold text-primary">Financial Audit Trail Protected:</span> Any prior recorded payments or linked bank debit records in your Finance workspace will remain safely recorded.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 border border-primary/80 transition-colors"
          >
            Keep Bill
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bill</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
