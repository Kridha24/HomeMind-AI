import React, { useState } from 'react';
import { X, Crown, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from '../utils/toast';
import { HouseholdMember } from '../../../types';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: HouseholdMember | null;
  currentOwnerName?: string;
  householdName?: string;
  onConfirm: (targetMemberId: string) => Promise<void>;
  isLoading?: boolean;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  onClose,
  targetMember,
  currentOwnerName = 'You',
  householdName = 'this household',
  onConfirm,
  isLoading = false,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen || !targetMember) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      toast.error('Please confirm the acknowledgment before proceeding');
      return;
    }

    try {
      await onConfirm(targetMember.id);
      toast.success(`Transferred household ownership to ${targetMember.name}`);
      onClose();
    } catch {
      toast.error('Failed to transfer household ownership');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-amber-500/10 dark:bg-amber-500/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="transfer-modal-title" className="text-lg font-semibold text-foreground">
                Transfer Ownership
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transfer visual */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3">
            <div className="space-y-0.5 text-center flex-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Current Owner
              </p>
              <p className="text-xs font-semibold text-foreground truncate">{currentOwnerName}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
            <div className="space-y-0.5 text-center flex-1">
              <p className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">
                New Owner
              </p>
              <p className="text-xs font-semibold text-foreground truncate">{targetMember.name}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="leading-relaxed">
                By transferring ownership, <strong className="text-foreground">{targetMember.name}</strong> will receive primary administrative authority over members, billing, and household settings. You will be converted to an <strong className="text-foreground">ADMIN</strong>.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-xs text-foreground leading-normal">
              I understand this action transfers full household ownership and cannot be undone without the new owner's consent.
            </span>
          </label>

          <div className="pt-2 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !acknowledged}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
