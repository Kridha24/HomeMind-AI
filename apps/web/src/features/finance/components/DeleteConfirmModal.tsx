import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { TransactionItem } from './TransactionRow';
import { formatINR } from '../utils/financeFormatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onConfirm: (tx: TransactionItem) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !transaction) return null;

  const displayTitle =
    transaction.merchant ||
    transaction.expense?.title ||
    transaction.income?.title ||
    'Transaction';

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-md">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-primary">
            Delete this transaction?
          </h3>
          <p className="text-xs text-secondary mt-1">
            This will remove <strong className="text-primary">{displayTitle}</strong> ({formatINR(transaction.amount)}) from your household financial history.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-primary/20">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-primary/30 text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(transaction)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
