import React, { useState, useEffect } from 'react';
import { Users, Key, Copy, Check, LogIn, RefreshCw, TrendingUp, CreditCard, DollarSign } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';

export const FamilyWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const { format } = useSettingStore();
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('HM-ALPHA88');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  
  const [aggregateData, setAggregateData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalPendingBills: 0
  });

  useEffect(() => {
    fetchMembers();
    fetchAggregateData();
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
    } catch (e) {
      setMembers([]);
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

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            Family Workspace & Permissions
            <Users className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-muted">Invite family members, manage workspace access levels and shared views</p>
        </div>
      </div>

      {/* Aggregate Family Data View */}
      <div className="glass-panel p-6 border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900/50">
        <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Total Family Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80">Total Income</p>
              <p className="text-xl font-bold text-emerald-400">{format(aggregateData.totalIncome)}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-400/80">Total Expenses</p>
              <p className="text-xl font-bold text-rose-400">{format(aggregateData.totalExpenses)}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-orange-400/80">Pending Bills</p>
              <p className="text-xl font-bold text-orange-400">{format(aggregateData.totalPendingBills)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Share Invite Code Box */}
        <div className="glass-panel p-6 space-y-4 border-indigo-500/30">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
             <Key className="w-4 h-4 text-indigo-400" />
             Your Household Invite Code
          </h3>
          <p className="text-xs text-muted">Share this code with your family members so they can join your workspace.</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="bg-panel border border-secondary px-4 py-2.5 rounded-xl font-mono text-lg font-bold text-indigo-300 tracking-wider w-full text-center">
              {inviteCode}
            </div>
            <button 
              onClick={handleCopyCode}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"
              title="Copy Invite Code"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Join Household Box */}
        <div className="glass-panel p-6 space-y-4 border-emerald-500/30">
           <h3 className="text-sm font-bold text-primary flex items-center gap-2">
             <LogIn className="w-4 h-4 text-emerald-400" />
             Join Another Household
           </h3>
           <p className="text-xs text-muted">Received an invite code? Enter it below to join another family's workspace.</p>
           <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HM-XXXXXX"
                  className="bg-panel border border-secondary focus:border-emerald-500 text-primary px-4 py-2.5 rounded-xl w-full text-sm font-mono uppercase outline-none"
                />
                <button 
                  onClick={handleJoinHousehold}
                  disabled={joinLoading || !joinCode.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center gap-2"
                >
                  {joinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Join'}
                </button>
              </div>
              {joinError && <p className="text-xs text-red-400 font-semibold">{joinError}</p>}
           </div>
        </div>
      </div>

      {/* Members List */}
      <div className="glass-panel overflow-hidden mt-6">
        <table className="w-full text-left text-xs">
          <thead className="bg-background/60 text-muted uppercase tracking-wider font-semibold border-b border-primary">
            <tr>
              <th className="p-4">Member Name</th>
              <th className="p-4">Email / Phone</th>
              <th className="p-4">Role Permission</th>
              <th className="p-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-secondary">
            {(members || []).map((m) => (
              <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                <td className="p-4 font-semibold text-primary flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                    {m.name ? m.name.charAt(0) : 'U'}
                  </div>
                  {m.name || 'Household Member'}
                </td>
                <td className="p-4 text-muted font-mono text-[11px]">{m.email || m.phoneNumber || 'Member'}</td>
                <td className="p-4">
                  {isOwner && m.id !== user?.id ? (
                    <select 
                      className="bg-panel border border-secondary text-xs text-primary px-2 py-1 rounded outline-none focus:border-indigo-500"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="CO-OWNER">CO-OWNER</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.role === 'OWNER' || m.role === 'CO-OWNER' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {m.role || 'MEMBER'}
                    </span>
                  )}
                </td>
                <td className="p-4 text-muted">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
