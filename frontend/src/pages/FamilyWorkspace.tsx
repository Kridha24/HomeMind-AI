import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Key } from 'lucide-react';
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
      setMembers(res.data.household.members);
      if (res.data.household.inviteCode) setInviteCode(res.data.household.inviteCode);
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
              <th className="p-4">Email</th>
              <th className="p-4">Role Permission</th>
              <th className="p-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-semibold text-slate-100 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=3b82f6&color=fff`}
                    alt="avatar"
                    className="w-7 h-7 rounded-full border border-blue-500/30"
                  />
                  {m.name}
                </td>
                <td className="p-4 text-slate-400">{m.email}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    m.role === 'ADMIN'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : m.role === 'MEMBER'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {m.role}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{m.createdAt?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
