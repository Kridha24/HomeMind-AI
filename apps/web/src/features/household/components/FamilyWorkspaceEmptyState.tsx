import React from 'react';
import { Users, UserPlus } from 'lucide-react';

interface FamilyWorkspaceEmptyStateProps {
  onInviteMember: () => void;
  canInvite?: boolean;
}

export const FamilyWorkspaceEmptyState: React.FC<FamilyWorkspaceEmptyStateProps> = ({
  onInviteMember,
  canInvite = true,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center bg-card border border-border rounded-2xl shadow-sm space-y-4 max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
        <Users className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">
          You're the only member of this household
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          Invite someone to start sharing tasks, groceries, bills, and household responsibilities in real-time.
        </p>
      </div>

      {canInvite && (
        <div className="pt-2">
          <button
            onClick={onInviteMember}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      )}
    </div>
  );
};
