import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Task } from '../../../types';

interface DeleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1 pr-6">
            <h3 className="font-extrabold text-base text-primary">
              Delete Household Task?
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-primary font-semibold">"{task.title}"</strong>? This will remove it from the active household workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-primary/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:bg-secondary/60 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(task.id)}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/25 active:scale-95 transition-all disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
