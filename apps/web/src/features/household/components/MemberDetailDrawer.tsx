import React, { useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Crown,
  Trash2,
  CheckSquare,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HouseholdMember } from '../../../types';
import { MemberRoleBadge } from './MemberRoleBadge';
import { getUserInitials, getRoleConfig } from '../utils/householdFormatters';
import {
  canManageRoles,
  canRemoveMember,
  canTransferOwnership,
} from '../utils/householdPermissions';
import { useSettingStore } from '../../../stores/useSettingStore';

interface MemberDetailDrawerProps {
  member: HouseholdMember | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserRole?: string;
  activeTasksCount: number;
  onOpenRoleChange: (member: HouseholdMember) => void;
  onOpenTransferOwnership: (member: HouseholdMember) => void;
  onOpenRemoveMember: (member: HouseholdMember) => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  member,
  isOpen,
  onClose,
  currentUserId,
  currentUserRole,
  activeTasksCount,
  onOpenRoleChange,
  onOpenTransferOwnership,
  onOpenRemoveMember,
}) => {
  const navigate = useNavigate();
  const { reducedMotion } = useSettingStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const isMe = member.id === currentUserId;
  const initials = getUserInitials(member.name, member.email);
  const roleConfig = getRoleConfig(member.role);

  const allowManageRole = canManageRoles(currentUserRole, member.role) && !isMe;
  const allowRemove = canRemoveMember(currentUserRole, member.role, isMe);
  const allowTransfer = canTransferOwnership(currentUserRole) && !isMe;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen max-w-md bg-panel border-l border-primary/80 shadow-2xl flex flex-col justify-between ${
            reducedMotion ? '' : 'animate-in slide-in-from-right duration-200'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-primary/60 flex items-center justify-between">
            <h3 className="font-extrabold text-base text-primary">Member Profile</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Identity Hero */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-black text-xl flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-primary truncate">{member.name}</h4>
                  {isMe && (
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2 py-0.2 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <MemberRoleBadge role={member.role} />
              </div>
            </div>

            {/* Details List */}
            <div className="divide-y divide-primary/50 border-y border-primary/50 py-1 text-xs">
              {member.email && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="font-semibold text-primary">{member.email}</span>
                </div>
              )}

              {member.phoneNumber && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone Number</span>
                  </span>
                  <span className="font-semibold text-primary">{member.phoneNumber}</span>
                </div>
              )}

              {member.createdAt && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Joined Household</span>
                  </span>
                  <span className="text-secondary font-medium">
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              <div className="py-3 flex items-center justify-between">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-500" />
                  <span>Assigned Responsibilities</span>
                </span>
                <span className="font-bold text-primary">
                  {activeTasksCount} active task{activeTasksCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Permissions Info Box */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-primary/60 space-y-1.5">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Role Permissions: {roleConfig.label}</span>
              </span>
              <p className="text-xs text-secondary leading-relaxed">{roleConfig.description}</p>
            </div>

            {/* Quick Link to Tasks */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/tasks?assignee=${member.id}`);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 border border-primary/80 text-xs font-bold text-primary flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-500" />
                <span>View {isMe ? 'My' : `${member.name}'s`} Chores in Tasks</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted" />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-primary/60 bg-secondary/20 space-y-2.5">
            {allowManageRole && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoleChange(member);
                }}
                className="w-full py-2.5 rounded-xl border border-primary/80 bg-panel hover:bg-secondary/70 text-xs font-bold text-primary flex items-center justify-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Change Member Role</span>
              </button>
            )}

            {allowTransfer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransferOwnership(member);
                }}
                className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-2 transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span>Transfer Household Ownership</span>
              </button>
            )}

            {allowRemove && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRemoveMember(member);
                }}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove From Household</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
