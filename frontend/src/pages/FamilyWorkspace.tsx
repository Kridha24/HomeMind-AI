import React, { useState, useEffect } from 'react';
import { Users, Key, Copy, Check, LogIn, RefreshCw } from 'lucide-react';
import apiClient from '../services/apiClient';

export const FamilyWorkspace: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('HM-ALPHA88');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get('/family/members');
      if (res.data?.household?.members) {
        setMembers(res.data.household.members);
      } else if (Array.isArray(res.data?.members)) {
        setMembers(res.data.members);
      } else {
        setMembers([]);
      }
      if (res.data?.household?.inviteCode) {
        setInviteCode(res.data.household.inviteCode);
      }
    } catch (e) {
      setMembers([]);
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
      // Fetch members again to reflect new household
      await fetchMembers();
      setJoinCode('');
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Failed to join household. Invalid code.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Family Workspace & Permissions
            <Users className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400">Invite family members, manage workspace access levels and shared views</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Share Invite Code Box */}
        <div className="glass-panel p-6 space-y-4 border-indigo-500/30">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
             <Key className="w-4 h-4 text-indigo-400" />
             Your Household Invite Code
          </h3>
          <p className="text-xs text-slate-400">Share this code with your family members so they can join your workspace.</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl font-mono text-lg font-bold text-indigo-300 tracking-wider w-full text-center">
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
           <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
             <LogIn className="w-4 h-4 text-emerald-400" />
             Join Another Household
           </h3>
           <p className="text-xs text-slate-400">Received an invite code? Enter it below to join another family's workspace.</p>
           <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HM-XXXXXX"
                  className="bg-slate-900 border border-slate-700 focus:border-emerald-500 text-slate-100 px-4 py-2.5 rounded-xl w-full text-sm font-mono uppercase outline-none"
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
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Member Name</th>
              <th className="p-4">Email / Phone</th>
              <th className="p-4">Role Permission</th>
              <th className="p-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {(members || []).map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-semibold text-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                    {m.name ? m.name.charAt(0) : 'U'}
                  </div>
                  {m.name || 'Household Member'}
                </td>
                <td className="p-4 text-slate-400 font-mono text-[11px]">{m.email || m.phoneNumber || 'Member'}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {m.role || 'MEMBER'}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
