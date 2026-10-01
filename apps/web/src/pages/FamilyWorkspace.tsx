import React, { useState, useEffect } from 'react';
import {
  Users,
  Key,
  Copy,
  Check,
  LogIn,
  RefreshCw,
  TrendingUp,
  CreditCard,
  DollarSign,
  Phone,
  Video,
  MessageSquare,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { socketService } from '../services/socketService';
import { FamilyChat } from '../components/family/FamilyChat';
import { FamilyCallModal } from '../components/family/FamilyCallModal';

export const FamilyWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const { format, currencySymbol } = useSettingStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [members, setMembers] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState('HM-ALPHA88');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Calling Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [activeCallTarget, setActiveCallTarget] = useState<any>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingSignalData, setIncomingSignalData] = useState<any>(null);

  const [aggregateData, setAggregateData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalPendingBills: 0,
  });

  useEffect(() => {
    fetchMembers();
    fetchAggregateData();

    // Socket Connection & Realtime Listeners
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_household');

      // Online Members Listener
      socket.on('household_online_members', (userIds: string[]) => {
        setOnlineUserIds(userIds || []);
      });

      // Incoming WebRTC Call Listener
      socket.on(
        'webrtc_incoming_call',
        (data: {
          callerId: string;
          callerName: string;
          callerAvatar?: string;
          callType: 'audio' | 'video';
          signalData: any;
        }) => {
          console.log('[Workspace] Incoming WebRTC call received:', data);
          setActiveCallTarget({
            id: data.callerId,
            name: data.callerName,
            avatar: data.callerAvatar,
          });
          setCallType(data.callType || 'video');
          setIncomingSignalData(data.signalData);
          setIsIncomingCall(true);
          setShowCallModal(true);
        }
      );
    }

    return () => {
      const s = socketService.getSocket();
      s?.off('household_online_members');
      s?.off('webrtc_incoming_call');
    };
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get('/family/members');
      if (res.data?.household?.members) {
        setMembers(res.data.household.members);
      } else if (Array.isArray(res.data?.members)) {
        setMembers(res.data.members);
      }
      if (res.data?.household?.inviteCode) {
        setInviteCode(res.data.household.inviteCode);
      }
      if (res.data?.household?.name) {
        setHouseholdName(res.data.household.name);
      }
    } catch (e) {
      setMembers([]);
    }
  };

  const handleUpdateHouseholdName = async () => {
    if (!householdName.trim()) return;
    setUpdateLoading(true);
    try {
      await apiClient.put('/family/name', { name: householdName });
      alert('Household name updated successfully!');
      useAuthStore.getState().updateHousehold({ name: householdName });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update household name');
    } finally {
      setUpdateLoading(false);
    }
  };

  const fetchAggregateData = async () => {
    try {
      const res = await apiClient.get('/family/aggregate');
      setAggregateData(res.data);
    } catch (e) {
      console.error('Failed to fetch aggregate data', e);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      await apiClient.post('/family/join', { inviteCode: joinCode.trim() });
      await fetchMembers();
      await fetchAggregateData();
      setJoinCode('');
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Failed to join household. Invalid code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await apiClient.put(`/family/members/${memberId}/role`, { role: newRole });
      await fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleStartCall = (member: any, type: 'audio' | 'video') => {
    setActiveCallTarget(member);
    setCallType(type);
    setIsIncomingCall(false);
    setIncomingSignalData(null);
    setShowCallModal(true);
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Family Workspace & Communication Hub
          </h1>
          <p className="text-xs text-secondary">
            End-to-End Encrypted Text, Audio Calls, and Video Calls between household members
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 border border-primary/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat & Calls</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Settings</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live Chat & Calling Hub */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <FamilyChat
            members={members}
            onlineUserIds={onlineUserIds}
            onStartCall={handleStartCall}
          />
        </div>
      )}

      {/* Tab 2: Members, Invite Code & Settings */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Aggregate Family Data View */}
          <div className="glass-panel p-6 border-blue-500/20 bg-gradient-to-br from-blue-950/10 to-indigo-950/20 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Total Household Financial Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {currencySymbol}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                    Total Income
                  </p>
                  <p className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                    +{format(aggregateData.totalIncome)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400">
                    Total Expenses
                  </p>
                  <p className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                    -{format(aggregateData.totalExpenses)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                    Pending Bills
                  </p>
                  <p className="text-xl font-extrabold font-mono text-amber-700 dark:text-amber-400">
                    -{format(aggregateData.totalPendingBills)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Household Custom Name */}
          {isOwner && (
            <div className="glass-panel p-6 border-primary/80 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Household Name
              </h3>
              <p className="text-xs text-secondary">
                Set a custom name for your household (e.g. "The Gupta Residence").
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Enter Household Name"
                  className="bg-secondary/60 border border-primary/80 focus:border-blue-500 text-primary px-4 py-2.5 rounded-2xl w-full text-xs font-medium outline-none"
                />
                <button
                  onClick={handleUpdateHouseholdName}
                  disabled={updateLoading || !householdName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {updateLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Name'}
                </button>
              </div>
            </div>
          )}

          {/* Invite Code & Join Household */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Share Invite Code Box */}
            <div className="glass-panel p-6 space-y-4 border-blue-500/30 shadow-sm">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Your Household Invite Code
              </h3>
              <p className="text-xs text-secondary">
                Share this code with your family members so they can join your workspace.
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-secondary/80 border border-primary/80 px-4 py-2.5 rounded-2xl font-mono text-base font-bold text-blue-600 dark:text-blue-400 tracking-wider w-full text-center">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl shadow-md shadow-blue-600/25 transition-all"
                  title="Copy Invite Code"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Join Household Box */}
            <div className="glass-panel p-6 space-y-4 border-emerald-500/30 shadow-sm">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                <LogIn className="w-4 h-4 text-emerald-500" />
                Join Another Household
              </h3>
              <p className="text-xs text-secondary">
                Received an invite code? Enter it below to join another family's workspace.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HM-XXXXXX"
                    className="bg-secondary/60 border border-primary/80 focus:border-emerald-500 text-primary px-4 py-2.5 rounded-2xl w-full text-xs font-mono uppercase font-bold outline-none"
                  />
                  <button
                    onClick={handleJoinHousehold}
                    disabled={joinLoading || !joinCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2"
                  >
                    {joinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Join'}
                  </button>
                </div>
                {joinError && <p className="text-xs text-red-500 font-semibold">{joinError}</p>}
              </div>
            </div>
          </div>

          {/* Members Table with Direct Chat / Audio / Video Call Actions */}
          <div className="glass-panel border-primary/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex items-center justify-between bg-secondary/30">
              <span>Family Members List</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
                {members.length} Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-secondary uppercase tracking-wider font-bold border-b border-primary/80">
                  <tr>
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Role Permission</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Communicate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-secondary font-medium">
                  {(members || []).map((m) => {
                    const isOnline = onlineUserIds.includes(m.id);
                    const isMe = m.id === user?.id;

                    return (
                      <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="p-4 font-bold text-primary flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                            {m.name ? m.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="block">{m.name || 'Household Member'} {isMe && '(You)'}</span>
                            <span className="text-[10px] text-muted font-normal">{m.email || 'Member'}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          {isOwner && !isMe ? (
                            <select
                              className="bg-secondary border border-primary/80 text-xs text-primary px-2.5 py-1.5 rounded-xl outline-none focus:border-blue-500 font-medium"
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="CO-OWNER">CO-OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                m.role === 'OWNER' || m.role === 'CO-OWNER'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                              }`}
                            >
                              {m.role || 'MEMBER'}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                              isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {isOnline ? 'Active Online' : 'Offline'}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {!isMe ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Direct Chat */}
                              <button
                                onClick={() => setActiveTab('chat')}
                                className="p-2 rounded-xl bg-secondary hover:bg-blue-500/15 hover:text-blue-600 border border-primary/80 transition-all text-secondary"
                                title="Open Chat"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              {/* Audio Call */}
                              <button
                                onClick={() => handleStartCall(m, 'audio')}
                                className="p-2 rounded-xl bg-secondary hover:bg-emerald-500/15 hover:text-emerald-600 border border-primary/80 transition-all text-secondary"
                                title="Start Audio Call (E2EE)"
                              >
                                <Phone className="w-4 h-4" />
                              </button>

                              {/* Video Call */}
                              <button
                                onClick={() => handleStartCall(m, 'video')}
                                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/25 transition-all"
                                title="Start Video Call (E2EE HD)"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted italic">Self</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WebRTC P2P End-to-End Encrypted Call Modal */}
      <FamilyCallModal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setActiveCallTarget(null);
          setIsIncomingCall(false);
          setIncomingSignalData(null);
        }}
        targetUser={activeCallTarget}
        callType={callType}
        isIncoming={isIncomingCall}
        incomingSignal={incomingSignalData}
      />
    </div>
  );
};

export default FamilyWorkspace;
