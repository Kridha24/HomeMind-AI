import React, { useState } from 'react';
import { AlertOctagon, LogOut, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from '../utils/toast';
import { canDeleteHousehold, canLeaveHousehold } from '../utils/householdPermissions';

interface HouseholdDangerZoneProps {
  currentUserRole?: string;
  householdName?: string;
  householdId?: string;
  ownersCount: number;
  membersCount: number;
  onLeaveHousehold: () => Promise<void>;
  onDeleteHousehold: (id: string) => Promise<void>;
  isLeaving?: boolean;
  isDeleting?: boolean;
}

export const HouseholdDangerZone: React.FC<HouseholdDangerZoneProps> = ({
  currentUserRole,
  householdName = 'Household',
  householdId = '',
  ownersCount,
  membersCount,
  onLeaveHousehold,
  onDeleteHousehold,
  isLeaving = false,
  isDeleting = false,
}) => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  const otherOwners = currentUserRole === 'OWNER' ? ownersCount - 1 : ownersCount;
  const otherMembers = membersCount - 1;
  const leaveCheck = canLeaveHousehold(currentUserRole, otherOwners, otherMembers);
  const canDelete = canDeleteHousehold(currentUserRole);

  const handleConfirmLeave = async () => {
    try {
      await onLeaveHousehold();
      setShowLeaveModal(false);
      toast.success(`Left ${householdName}`);
    } catch {
      toast.error('Failed to leave household');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationInput.trim() !== householdName.trim()) {
      toast.error('Household name does not match');
      return;
    }

    try {
      await onDeleteHousehold(householdId);
      setShowDeleteModal(false);
      toast.success(`Deleted ${householdName}`);
    } catch {
      toast.error('Failed to delete household');
    }
  };

  return (
    <div className="rounded-3xl border border-rose-500/25 bg-rose-950/10 dark:bg-rose-950/20 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-rose-500/20">
        <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">
            Irreversible actions for this household and your membership.
          </p>
        </div>
      </div>

      <div className="divide-y divide-rose-500/15">
        {/* Leave Household */}
        <div className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-foreground">Leave Household</p>
            <p className="text-[11px] text-muted-foreground">
              Revoke your access to this household and return to your personal residence
            </p>
            {!leaveCheck.canLeave && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                {leaveCheck.reason}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            disabled={!leaveCheck.canLeave || isLeaving}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Household</span>
          </button>
        </div>

        {/* Delete Household (Owner Only) */}
        {canDelete && (
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Delete Household
              </p>
              <p className="text-[11px] text-muted-foreground">
                Permanently delete this household, all shared tasks, inventory, and records
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationInput('');
                setShowDeleteModal(true);
              }}
              disabled={isDeleting}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Household</span>
            </button>
          </div>
        )}
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-panel border border-primary/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-primary/60 bg-secondary/30">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-primary text-base">Leave Household</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-primary leading-relaxed">
                Are you sure you want to leave <strong className="font-bold">{householdName}</strong>?
                You will lose access to all shared tasks, grocery lists, and financial records in this
                household until you are invited back.
              </p>

              <div className="pt-2 border-t border-primary/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-primary/80 hover:bg-secondary text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={isLeaving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs"
                >
                  {isLeaving ? 'Leaving...' : 'Confirm Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-panel border border-primary/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-rose-500/30 bg-rose-500/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-primary text-base">Delete Household</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-primary leading-relaxed">
                This action is <strong className="text-rose-600 dark:text-rose-400">permanent</strong> and will delete all shared data for all members.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Type <span className="text-primary font-bold select-all">{householdName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={householdName}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-primary/80 bg-secondary/50 text-primary focus:border-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-primary/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-primary/80 hover:bg-secondary text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || deleteConfirmationInput.trim() !== householdName.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
