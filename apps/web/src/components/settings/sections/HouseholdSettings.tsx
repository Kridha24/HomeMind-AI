import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Users,
  Copy,
  Check,
  Edit2,
  Shield,
  UserPlus,
  RefreshCw,
  LogOut,
  MoreVertical,
  UserX,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import apiClient from '../../../services/apiClient';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsStatusBadge, SettingsBadgeVariant } from '../primitives/SettingsStatusBadge';
import { ConfirmationModal } from '../primitives/ConfirmationModal';
import { getUserInitials } from '../../dashboard/utils/dashboardUtils';

interface Member {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  avatar?: string;
  createdAt?: string;
}

export const HouseholdSettings: React.FC = () => {
  const { user, household, updateHousehold } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState(household?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active action menu member ID
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);

  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ member: Member; newRole: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canManageHousehold = user?.role === 'OWNER' || user?.role === 'ADMIN';

  // Fetch household members
  const {
    data: membersData,
    isLoading: loadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['householdMembers', household?.id],
    queryFn: async () => {
      const res = await apiClient.get('/family/members');
      return res.data?.household?.members || [];
    },
    enabled: !!household?.id,
  });

  const members: Member[] = Array.isArray(membersData) ? membersData : [];

  const handleCopyInvite = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveHouseholdName = async () => {
    if (!newHouseholdName.trim() || newHouseholdName === household?.name) {
      setIsEditingName(false);
      return;
    }

    setNameSaving(true);
    setStatusMsg(null);
    try {
      await apiClient.put('/family/name', { name: newHouseholdName.trim() });
      updateHousehold({ name: newHouseholdName.trim() });
      setStatusMsg({ type: 'success', text: 'Household renamed successfully!' });
      setIsEditingName(false);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to rename household:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to update household name.',
      });
    } finally {
      setNameSaving(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/family/members/${roleChangeTarget.member.id}/role`, {
        role: roleChangeTarget.newRole,
      });
      setStatusMsg({ type: 'success', text: `Role updated for ${roleChangeTarget.member.name}.` });
      refetchMembers();
      setRoleChangeTarget(null);
      setActiveMenuMemberId(null);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to change role:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Role update rejected by server.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/family/members/${memberToRemove.id}`);
      setStatusMsg({ type: 'success', text: `${memberToRemove.name} removed from household.` });
      refetchMembers();
      setMemberToRemove(null);
      setActiveMenuMemberId(null);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to remove member.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setStatusMsg(null);
    try {
      const res = await apiClient.post('/family/join', { inviteCode: joinCode.trim() });
      if (res.data?.household) {
        updateHousehold(res.data.household);
        setShowJoinModal(false);
        setJoinCode('');
        setStatusMsg({ type: 'success', text: 'Successfully joined new household!' });
        refetchMembers();
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Failed to join household:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Invalid invite code or join failed.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getRoleVariant = (role: string): SettingsBadgeVariant => {
    switch (role) {
      case 'OWNER':
        return 'owner'; // violet
      case 'ADMIN':
        return 'admin'; // blue
      case 'MEMBER':
        return 'member'; // emerald
      default:
        return 'guest'; // neutral
    }
  };

  const ownerMember = members.find((m) => m.role === 'OWNER');
  const ownerDisplayName = ownerMember?.name || (user?.role === 'OWNER' ? user?.name : 'Household Owner');

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          role="alert"
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-xs opacity-60">
            ✕
          </button>
        </div>
      )}

      {/* 1. Premium Household Overview Hero */}
      <SettingsCard
        id="household-overview"
        title="Household Workspace"
        description="Residence profile, shared finance telemetry, and membership invitation credentials."
        badge={canManageHousehold ? 'Admin Controlled' : 'Member Access'}
        action={
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Join Another</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Residence Identity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Household
            </span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveHouseholdName}
                  disabled={nameSaving}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-2 py-1 text-xs text-slate-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                    {household?.name || 'Home Residence'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    Owner: {ownerDisplayName}
                  </span>
                </div>
                {canManageHousehold && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewHouseholdName(household?.name || '');
                      setIsEditingName(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Rename Household"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members Metric */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Family Members
            </span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {members.length > 0 ? members.length : 1}
              </span>
              <span className="text-xs text-slate-400 font-medium">members enrolled</span>
            </div>
          </div>

          {/* Invite Code */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Family Invite Code
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider truncate">
                {household?.inviteCode || 'HM-GEN001'}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                disabled={!household?.inviteCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-xs hover:bg-blue-500 transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* 2. Household Members List & Role Controls */}
      <SettingsCard
        id="household-members"
        title="Household Members"
        description="Individuals with synchronized access to family groceries, bills, chores, and telemetry."
        badge={`${members.length} Active`}
        action={
          canManageHousehold && (
            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          )
        }
      >
        {loadingMembers ? (
          /* Skeletons */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
                <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => {
              const initials = getUserInitials(member);
              const isCurrentUser = member.id === user?.id;
              const isMenuOpen = activeMenuMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3.5 gap-3 group relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-slate-400 font-semibold">(You)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {member.email || member.phoneNumber || 'Active Household Member'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Role Badge: OWNER: violet, ADMIN: blue, MEMBER: emerald */}
                    <SettingsStatusBadge
                      label={member.role}
                      variant={getRoleVariant(member.role)}
                    />

                    {/* Member Action Menu */}
                    {canManageHousehold && !isCurrentUser && member.role !== 'OWNER' && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuMemberId(isMenuOpen ? null : member.id)
                          }
                          aria-label={`Manage ${member.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            onMouseLeave={() => setActiveMenuMemberId(null)}
                            className="absolute right-0 mt-1 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
                                setRoleChangeTarget({ member, newRole });
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              Make {member.role === 'ADMIN' ? 'Member' : 'Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMemberToRemove(member)}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                              Remove Member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No additional household members
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Share your family invite code to let family members join this household.
            </p>
          </div>
        )}
      </SettingsCard>

      {/* Confirmation Modals for Destructive/Sensitive Member Actions */}
      <ConfirmationModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Remove Member from Household?"
        description={`Are you sure you want to remove ${memberToRemove?.name} from ${household?.name || 'this household'}? They will immediately lose access to shared finances, groceries, and tasks.`}
        confirmText="Remove Member"
        confirmVariant="danger"
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onConfirm={handleConfirmRoleChange}
        title={`Change Role to ${roleChangeTarget?.newRole}?`}
        description={`Update permission tier for ${roleChangeTarget?.member.name} to ${roleChangeTarget?.newRole}.`}
        confirmText="Confirm Role Change"
        confirmVariant="primary"
        loading={actionLoading}
      />

      {/* Join Household Modal */}
      {showJoinModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Join a Household
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the 6-character family invite code provided by the household owner.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinHousehold} className="space-y-4 pt-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. HM-78291"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tracking-wider"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isJoining}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCode.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {isJoining ? 'Joining...' : 'Join Household'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseholdSettings;
