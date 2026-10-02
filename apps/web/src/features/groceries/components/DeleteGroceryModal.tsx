import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { GroceryItem } from '../../../types';

interface DeleteGroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: GroceryItem | null;
  loading?: boolean;
}

export const DeleteGroceryModal: React.FC<DeleteGroceryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-rose-500/30 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-grocery-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="delete-grocery-title" className="font-extrabold text-base text-primary">
              Remove Grocery Item?
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              This will remove <strong className="text-primary">{item.name}</strong> from your household grocery list.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-secondary/50 dark:bg-slate-900/60 border border-primary/50 text-xs text-secondary">
          <div className="flex justify-between py-1">
            <span>Category:</span>
            <span className="font-bold text-primary">{item.category}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Quantity:</span>
            <span className="font-bold text-primary font-mono">{item.quantity} {item.unit}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};
