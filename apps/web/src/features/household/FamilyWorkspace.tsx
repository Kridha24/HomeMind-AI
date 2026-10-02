import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { socketService } from '../../services/socketService';
import { HouseholdMember } from '../../types';
import { useHousehold } from './hooks/useHousehold';
import { HouseholdHeader } from './components/HouseholdHeader';
import { HouseholdIdentityCard } from './components/HouseholdIdentityCard';
import { HouseholdSummary } from './components/HouseholdSummary';
import { HouseholdQuickActions } from './components/HouseholdQuickActions';
import { MemberGrid } from './components/MemberGrid';
import { MemberDetailDrawer } from './components/MemberDetailDrawer';
import { HouseholdResponsibilities } from './components/HouseholdResponsibilities';
import { HouseholdActivity } from './components/HouseholdActivity';
import { HouseholdDangerZone } from './components/HouseholdDangerZone';
import { HouseholdSwitcher } from './components/HouseholdSwitcher';
import { InviteMemberModal } from './components/InviteMemberModal';
import { ChangeRoleModal } from './components/ChangeRoleModal';
import { TransferOwnershipModal } from './components/TransferOwnershipModal';
import { RemoveMemberModal } from './components/RemoveMemberModal';
import { FamilyWorkspaceSkeleton } from './components/FamilyWorkspaceSkeleton';
import { FamilyWorkspaceErrorState } from './components/FamilyWorkspaceErrorState';
import { FamilyWorkspaceEmptyState } from './components/FamilyWorkspaceEmptyState';
import { FamilyChat } from '../../components/family/FamilyChat';
import { FamilyCallModal } from '../../components/family/FamilyCallModal';

export const FamilyWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    household,
    members,
    activity,
    availableHouseholds,
    tasks,
    groceries,
    bills,
    loadingMembers,
    loadingActivity,
    isMembersError,
    refetchMembers,
    refetchActivity,
    refetchAvailableHouseholds,
    renameMutation,
    roleMutation,
    transferOwnershipMutation,
    regenerateCodeMutation,
    removeMemberMutation,
    leaveHouseholdMutation,
    deleteHouseholdMutation,
    joinHouseholdMutation,
    switchHouseholdMutation,
  } = useHousehold();

  // Active View Tab: 'workspace' (Control Center) or 'communication' (Chat & WebRTC Calls)
  const [activeView, setActiveView] = useState<'workspace' | 'communication'>('workspace');

  const [searchParams, setSearchParams] = useSearchParams();

  // Modal & Drawer States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<HouseholdMember | null>(null);
  const [roleMember, setRoleMember] = useState<HouseholdMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<HouseholdMember | null>(null);
  const [removalMember, setRemovalMember] = useState<HouseholdMember | null>(null);

  // Online members for FamilyChat
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // WebRTC Calling State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [activeCallTarget, setActiveCallTarget] = useState<any>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingSignalData, setIncomingSignalData] = useState<any>(null);

  // Auto-open modals based on URL query param (e.g. ?action=invite)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'invite') {
      setIsInviteOpen(true);
      setSearchParams({}, { replace: true });
    } else if (action === 'switch') {
      setIsSwitcherOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [incomingCallId, setIncomingCallId] = useState<string | undefined>(undefined);

  // WebRTC Incoming Call Socket Listener & Online Members
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('join_household');

    const handleOnlineMembers = (userIds: string[]) => {
      setOnlineUserIds(userIds || []);
    };

    const handleIncomingCall = (data: {
      callId?: string;
      callerId: string;
      callerName: string;
      callerAvatar?: string;
      callType: 'audio' | 'video';
      signalData: any;
    }) => {
      setActiveCallTarget({
        id: data.callerId,
        name: data.callerName,
        avatar: data.callerAvatar,
      });
      setCallType(data.callType || 'video');
      setIncomingSignalData(data.signalData);
      setIncomingCallId(data.callId);
      setIsIncomingCall(true);
      setShowCallModal(true);
    };

    socket.on('household_online_members', handleOnlineMembers);
    socket.on('webrtc_incoming_call', handleIncomingCall);

    return () => {
      socket.off('household_online_members', handleOnlineMembers);
      socket.off('webrtc_incoming_call', handleIncomingCall);
    };
  }, []);

  const handleStartCall = (target: any, type: 'audio' | 'video') => {
    setActiveCallTarget(target);
    setCallType(type);
    setIsIncomingCall(false);
    setIncomingSignalData(null);
    setIncomingCallId(undefined);
    setShowCallModal(true);
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchMembers(),
      refetchActivity(),
      refetchAvailableHouseholds(),
    ]);
  };

  // Find Owner Member
  const ownerMember = members.find((m) => m.role === 'OWNER');
  const ownersCount = members.filter((m) => m.role === 'OWNER').length;

  // Active task counts per member for quick badge visualization
  const memberTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    members.forEach((m) => {
      counts[m.id] = activeTasks.filter(
        (t) =>
          t.assigneeId === m.id ||
          t.assignee?.id === m.id ||
          (t.assignee?.name && t.assignee.name.toLowerCase() === m.name.toLowerCase())
      ).length;
    });
    return counts;
  }, [members, tasks]);

  if (loadingMembers && !household) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FamilyWorkspaceSkeleton />
      </div>
    );
  }

  if (isMembersError && !household) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FamilyWorkspaceErrorState onRetry={refetchMembers} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Page Header with Switcher & View Toggle */}
      <HouseholdHeader
        household={household}
        memberCount={members.length}
        onInvite={() => setIsInviteOpen(true)}
        onOpenSwitcher={() => setIsSwitcherOpen(true)}
        onRefresh={handleRefreshAll}
        isRefreshing={loadingMembers || loadingActivity}
        activeView={activeView}
        onToggleView={setActiveView}
      />

      {/* 2. Workspace View vs Communication View */}
      {activeView === 'communication' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Family Communication & Calling
              </h2>
              <p className="text-xs text-muted-foreground">
                Direct messaging and real-time audio/video calls with household members
              </p>
            </div>
            <div className="flex items-center gap-2">
              {members
                .filter((m) => m.id !== user?.id)
                .slice(0, 3)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleStartCall(m, 'video')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-foreground transition-colors"
                  >
                    Call {m.name.split(' ')[0]}
                  </button>
                ))}
            </div>
          </div>
          <FamilyChat
            members={members}
            onlineUserIds={onlineUserIds}
            onStartCall={(m, type) => handleStartCall(m, type)}
          />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* 3. Household Identity Hero Card */}
          <HouseholdIdentityCard
            household={household}
            members={members}
            currentUserRole={user?.role}
            onRename={async (newName: string) => {
              await renameMutation.mutateAsync(newName);
            }}
            onRegenerateCode={async () => {
              await regenerateCodeMutation.mutateAsync();
            }}
            isRegenerating={regenerateCodeMutation.isPending}
          />

          {/* 4. Quick Actions */}
          <HouseholdQuickActions
            currentUserRole={user?.role}
            onOpenInviteModal={() => setIsInviteOpen(true)}
          />

          {/* 5. Cross-Module Household Summary Snapshot */}
          <HouseholdSummary
            memberCount={members.length}
            pendingTasksCount={tasks.filter((t) => t.status !== 'COMPLETED').length}
            neededGroceriesCount={groceries.length}
            unpaidBillsCount={bills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE').length}
          />

          {/* 6. Members Grid / Row Section */}
          {members.length <= 1 ? (
            <div className="space-y-4">
              <FamilyWorkspaceEmptyState
                onInviteMember={() => setIsInviteOpen(true)}
                canInvite={user?.role === 'OWNER' || user?.role === 'ADMIN'}
              />
              <MemberGrid
                members={members}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                memberTaskCounts={memberTaskCounts}
                onSelectMember={(m) => setDetailMember(m)}
                onOpenRoleChange={(m) => setRoleMember(m)}
                onOpenTransferOwnership={(m) => setTransferTarget(m)}
                onOpenRemoveMember={(m) => setRemovalMember(m)}
                onViewMemberTasks={(m) => navigate(`/tasks?assignee=${encodeURIComponent(m.id)}`)}
                onInvite={() => setIsInviteOpen(true)}
              />
            </div>
          ) : (
            <MemberGrid
              members={members}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              memberTaskCounts={memberTaskCounts}
              onSelectMember={(m) => setDetailMember(m)}
              onOpenRoleChange={(m) => setRoleMember(m)}
              onOpenTransferOwnership={(m) => setTransferTarget(m)}
              onOpenRemoveMember={(m) => setRemovalMember(m)}
              onViewMemberTasks={(m) => navigate(`/tasks?assignee=${encodeURIComponent(m.id)}`)}
              onInvite={() => setIsInviteOpen(true)}
            />
          )}

          {/* 7. Shared Responsibilities & Recent Household Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <HouseholdResponsibilities members={members} tasks={tasks} />
            <HouseholdActivity activities={activity} isLoading={loadingActivity} />
          </div>

          {/* 8. Danger Zone: Leave Household or Delete Household */}
          <HouseholdDangerZone
            currentUserRole={user?.role}
            householdName={household?.name || 'Household'}
            householdId={household?.id || ''}
            ownersCount={ownersCount}
            membersCount={members.length}
            onLeaveHousehold={async () => {
              await leaveHouseholdMutation.mutateAsync();
            }}
            onDeleteHousehold={async (id: string) => {
              await deleteHouseholdMutation.mutateAsync(id);
            }}
            isLeaving={leaveHouseholdMutation.isPending}
            isDeleting={deleteHouseholdMutation.isPending}
          />
        </div>
      )}

      {/* MODALS & DRAWERS */}

      {/* Member Detail Slide-over Drawer */}
      <MemberDetailDrawer
        isOpen={Boolean(detailMember)}
        onClose={() => setDetailMember(null)}
        member={detailMember}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        activeTasksCount={detailMember ? memberTaskCounts[detailMember.id] || 0 : 0}
        onOpenRoleChange={(m) => setRoleMember(m)}
        onOpenTransferOwnership={(m) => setTransferTarget(m)}
        onOpenRemoveMember={(m) => setRemovalMember(m)}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        inviteCode={household?.inviteCode}
        householdName={household?.name}
        currentUserRole={user?.role}
        onRegenerateCode={async () => {
          await regenerateCodeMutation.mutateAsync();
        }}
        isRegenerating={regenerateCodeMutation.isPending}
      />

      {/* Household Switcher Modal */}
      <HouseholdSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentHouseholdId={household?.id || ''}
        households={availableHouseholds}
        onSwitch={async (targetId: string) => {
          await switchHouseholdMutation.mutateAsync(targetId);
        }}
        onJoin={async (code: string) => {
          await joinHouseholdMutation.mutateAsync(code);
        }}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={Boolean(roleMember)}
        onClose={() => setRoleMember(null)}
        member={roleMember}
        onConfirm={async (memberId: string, newRole: string) => {
          await roleMutation.mutateAsync({ memberId, newRole });
        }}
        isLoading={roleMutation.isPending}
      />

      {/* Transfer Ownership Modal */}
      <TransferOwnershipModal
        isOpen={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        targetMember={transferTarget}
        currentOwnerName={ownerMember?.name || user?.name || 'You'}
        householdName={household?.name}
        onConfirm={async (newOwnerId: string) => {
          await transferOwnershipMutation.mutateAsync(newOwnerId);
        }}
        isLoading={transferOwnershipMutation.isPending}
      />

      {/* Remove Member Modal */}
      <RemoveMemberModal
        isOpen={Boolean(removalMember)}
        onClose={() => setRemovalMember(null)}
        member={removalMember}
        householdName={household?.name}
        onConfirm={async (memberId: string) => {
          await removeMemberMutation.mutateAsync(memberId);
        }}
        isLoading={removeMemberMutation.isPending}
      />

      {/* WebRTC Audio / Video Call Modal */}
      {showCallModal && (
        <FamilyCallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          targetUser={activeCallTarget}
          callType={callType}
          isIncoming={isIncomingCall}
          incomingSignal={incomingSignalData}
          callId={incomingCallId}
        />
      )}
    </div>
  );
};
