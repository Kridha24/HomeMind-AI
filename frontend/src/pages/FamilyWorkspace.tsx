import React, { useState, useEffect } from 'react';
import { Users, Key } from 'lucide-react';
import apiClient from '../services/apiClient';

export const FamilyWorkspace: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('HM-ALPHA88');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get('/family/members');
      if (res.data?.household?.members) {
        setMembers(res.data.household.members);
      } else {
        setMembers([
          { id: '1', name: 'Alex Rivera', email: 'demo@homemind.ai', role: 'ADMIN', createdAt: '2026-07-01' },
          { id: '2', name: 'Sarah Rivera', email: 'sarah@homemind.ai', role: 'MEMBER', createdAt: '2026-07-02' },
          { id: '3', name: 'Leo Rivera', email: 'leo@homemind.ai', role: 'CHILD', createdAt: '2026-07-05' }
        ]);
      }
      if (res.data?.household?.inviteCode) setInviteCode(res.data.household.inviteCode);
    } catch (e) {
      setMembers([
        { id: '1', name: 'Alex Rivera', email: 'demo@homemind.ai', role: 'ADMIN', createdAt: '2026-07-01' },
        { id: '2', name: 'Sarah Rivera', email: 'sarah@homemind.ai', role: 'MEMBER', createdAt: '2026-07-02' },
        { id: '3', name: 'Leo Rivera', email: 'leo@homemind.ai', role: 'CHILD', createdAt: '2026-07-05' }
      ]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Family Workspace & Permissions
            <Users className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400">Invite family members, manage workspace access levels and shared views</p>
        </div>

        <div className="glass-panel px-4 py-2 flex items-center gap-3 border-indigo-500/30">
          <Key className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Workspace Invite Code</span>
            <span className="text-xs font-mono font-bold text-indigo-300">{inviteCode}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
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
