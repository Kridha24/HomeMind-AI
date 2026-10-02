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
    <div className="bg-card border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">
            Irreversible actions for this household and your membership
          </p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {/* Leave Household */}
        <div className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Leave Household</p>
            <p className="text-xs text-muted-foreground">
              Revoke your access to this household and return to your personal residence
            </p>
            {!leaveCheck.canLeave && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                {leaveCheck.reason}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowLeaveModal(true)}
            disabled={!leaveCheck.canLeave || isLeaving}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Household</span>
          </button>
        </div>

        {/* Delete Household (Owner Only) */}
        {canDelete && (
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Delete Household
              </p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this household, all shared tasks, inventory, and records
              </p>
            </div>
            <button
              onClick={() => {
                setDeleteConfirmationInput('');
                setShowDeleteModal(true);
              }}
              disabled={isDeleting}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-sm"
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
            className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-semibold text-foreground text-base">Leave Household</h3>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-foreground leading-relaxed">
                Are you sure you want to leave <strong className="font-semibold">{householdName}</strong>?
                You will lose access to all shared tasks, grocery lists, and financial records in this
                household until you are invited back.
              </p>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={isLeaving}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm"
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
            className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-rose-500/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-semibold text-foreground text-base">Delete Household</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-foreground leading-relaxed">
                This action is <strong className="text-rose-600 dark:text-rose-400">permanent</strong> and will delete all shared data for all members.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Type <span className="text-foreground font-bold select-all">{householdName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={householdName}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || deleteConfirmationInput.trim() !== householdName.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm"
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
