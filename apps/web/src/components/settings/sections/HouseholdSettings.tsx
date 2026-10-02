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
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import apiClient from '../../../services/apiClient';
import { SettingsSection } from '../primitives/SettingsSection';
import { SettingsRow } from '../primitives/SettingsRow';
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

  // Join modal state
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

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

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      await apiClient.put(`/family/members/${targetUserId}/role`, { role: newRole });
      setStatusMsg({ type: 'success', text: 'Member role updated.' });
      refetchMembers();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to change role:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || 'Role update rejected by server.',
      });
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

  const roleBadgeStyles: Record<string, string> = {
    OWNER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    MEMBER: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    GUEST: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
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

      {/* Household Profile Card */}
      <SettingsSection
        id="household-overview"
        title="Household Details"
        description="Residence details and family invitation credentials."
        badge={canManageHousehold ? 'Admin Managed' : 'Member Access'}
        action={
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Join Household</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Household Name */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Household Name
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
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {household?.name || 'Home Residence'}
                </span>
                {canManageHousehold && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewHouseholdName(household?.name || '');
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-500 transition-colors"
                    title="Rename Household"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Invite Code */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Family Invite Code
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 tracking-wider">
                {household?.inviteCode || 'N/A'}
              </span>
              {household?.inviteCode && (
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Household Members List */}
      <SettingsSection
        id="household-members"
        title="Household Members"
        description={`${members.length} registered member${members.length === 1 ? '' : 's'} in this household.`}
        action={
          <button
            type="button"
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        }
      >
        {loadingMembers ? (
          <div className="space-y-2.5 py-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : members.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {members.map((member) => {
              const isCurrentUser = member.id === user?.id;
              const canEditThisMember = canManageHousehold && !isCurrentUser;

              return (
                <div
                  key={member.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-blue-500/25 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getUserInitials(member)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {member.email || member.phoneNumber || 'Household Member'}
                      </p>
                    </div>
                  </div>

                  {/* Role Selector / Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEditThisMember ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="GUEST">GUEST</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          roleBadgeStyles[member.role] || roleBadgeStyles.MEMBER
                        }`}
                      >
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            No family members currently registered.
          </p>
        )}
      </SettingsSection>

      {/* Join Another Household Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Join Another Household
            </h3>
            <p className="text-xs text-slate-400">
              Enter the 8-character invite code provided by your household administrator.
            </p>
            <form onSubmit={handleJoinHousehold} className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. HM-7AB2F9"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-center text-sm font-bold text-slate-900 dark:text-white uppercase outline-none focus:border-blue-500"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCode.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
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
