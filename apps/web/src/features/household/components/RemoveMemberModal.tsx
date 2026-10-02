import React from 'react';
import { X, UserMinus, AlertTriangle } from 'lucide-react';
import { toast } from '../utils/toast';
import { HouseholdMember } from '../../../types';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: HouseholdMember | null;
  householdName?: string;
  onConfirm: (memberId: string) => Promise<void>;
  isLoading?: boolean;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  householdName = 'this household',
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onConfirm(member.id);
      toast.success(`Removed ${member.name} from ${householdName}`);
      onClose();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-rose-500/10 dark:bg-rose-500/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="remove-modal-title" className="text-lg font-semibold text-foreground">
                Remove Member
              </h2>
              <p className="text-xs text-muted-foreground">{householdName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to remove <strong className="font-semibold">{member.name}</strong> from{' '}
            <strong className="font-semibold">{householdName}</strong>?
          </p>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Account & Data Safety:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Their personal HomeMind.AI account will remain completely intact.</li>
                  <li>They will no longer have access to this household's tasks, groceries, or bills.</li>
                  <li>They can be invited back anytime using the household invite code.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Removing...' : 'Remove Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
