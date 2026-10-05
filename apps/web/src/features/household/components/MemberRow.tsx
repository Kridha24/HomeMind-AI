import React, { useState } from 'react';
import {
  MoreVertical,
  CheckSquare,
  Shield,
  Trash2,
  Crown,
  Edit2,
  User,
  ArrowRight,
} from 'lucide-react';
import { HouseholdMember } from '../../../types';
import { MemberRoleBadge } from './MemberRoleBadge';
import { getUserInitials } from '../utils/householdFormatters';
import { canManageRoles, canRemoveMember, canTransferOwnership } from '../utils/householdPermissions';

interface MemberRowProps {
  member: HouseholdMember;
  currentUserId?: string;
  currentUserRole?: string;
  activeTasksCount: number;
  onSelectMember: (member: HouseholdMember) => void;
  onOpenRoleChange: (member: HouseholdMember) => void;
  onOpenTransferOwnership: (member: HouseholdMember) => void;
  onOpenRemoveMember: (member: HouseholdMember) => void;
  onViewMemberTasks: (member: HouseholdMember) => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  currentUserId,
  currentUserRole,
  activeTasksCount,
  onSelectMember,
  onOpenRoleChange,
  onOpenTransferOwnership,
  onOpenRemoveMember,
  onViewMemberTasks,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMe = member.id === currentUserId;
  const initials = getUserInitials(member.name, member.email);

  const isOwner = member.role === 'OWNER';
  const allowManageRole = canManageRoles(currentUserRole, member.role) && !isMe;
  const allowRemove = canRemoveMember(currentUserRole, member.role, isMe);
  const allowTransfer = canTransferOwnership(currentUserRole) && !isMe;

  return (
    <div
      onClick={() => onSelectMember(member)}
      className="group relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl bg-secondary/25 hover:bg-secondary/55 border border-primary/50 hover:border-violet-500/40 transition-all cursor-pointer shadow-2xs"
    >
      {/* Left: Avatar, Name, Email, You Badge */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-xl font-extrabold flex items-center justify-center text-xs shrink-0 border ${
            isOwner
              ? 'bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400'
              : 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-primary truncate block">
              {member.name}
            </span>
            {isMe && (
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/25 px-1.5 py-0.2 rounded-full">
                You
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted truncate block">
            {member.email || member.phoneNumber || 'Household Member'}
          </span>
        </div>
      </div>

      {/* Center: Role Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <MemberRoleBadge role={member.role} />
      </div>

      {/* Right: Active Tasks Count & Action Menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Active Tasks Chip */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewMemberTasks(member);
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-panel border border-primary/70 text-secondary hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-500/40 text-xs font-semibold transition-colors"
          title="View assigned tasks"
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
          <span>
            {activeTasksCount} active task{activeTasksCount === 1 ? '' : 's'}
          </span>
        </button>

        {/* Action Menu button */}
        {(allowManageRole || allowRemove || allowTransfer) && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-secondary transition-colors"
              title="Member actions"
              aria-label="Member actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-panel border border-primary/80 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onSelectMember(member);
                    }}
                    className="w-full text-left px-3.5 py-2 text-primary hover:bg-secondary/80 font-medium flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onViewMemberTasks(member);
                    }}
                    className="w-full text-left px-3.5 py-2 text-primary hover:bg-secondary/80 font-medium flex items-center gap-2"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>View Tasks</span>
                  </button>

                  {allowManageRole && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenRoleChange(member);
                      }}
                      className="w-full text-left px-3.5 py-2 text-primary hover:bg-secondary/80 font-medium flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      <span>Change Role</span>
                    </button>
                  )}

                  {allowTransfer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenTransferOwnership(member);
                      }}
                      className="w-full text-left px-3.5 py-2 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium flex items-center gap-2"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Transfer Ownership</span>
                    </button>
                  )}

                  {allowRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenRemoveMember(member);
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium flex items-center gap-2 border-t border-primary/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Member</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
