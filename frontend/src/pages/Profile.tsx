import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Calendar,
  Globe,
  DollarSign,
  Clock,
  Sliders,
  LogOut,
  Trash2,
  Edit3,
  CheckCircle2,
  Building,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import apiClient from '../services/apiClient';

export const Profile: React.FC = () => {
  const { user, household, logout } = useAuthStore();
  const { currency, country, timeZone, language, unitSystem, theme } = useSettingStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '28');

  // Calculate completion percentage
  let fieldsFilled = 0;
  let totalFields = 7;
  if (user?.name) fieldsFilled++;
  if (user?.email) fieldsFilled++;
  if (user?.phoneNumber) fieldsFilled++;
  if (user?.age) fieldsFilled++;
  if (user?.avatar) fieldsFilled++;
  if (household?.name) fieldsFilled++;
  if (user?.provider) fieldsFilled++;
  const completionPercentage = Math.round((fieldsFilled / totalFields) * 100);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (e) {
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.put('/auth/profile', { name, age: age ? parseInt(age, 10) : undefined });
      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      alert('Failed to save profile changes');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-slate-800">
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`
              }
              alt={user?.name || 'Profile'}
              className="w-24 h-24 rounded-full border-4 border-blue-500/30 object-cover shadow-2xl"
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{user?.name || 'User'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                {user?.role || 'OWNER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{household?.name || 'Home Residence'}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[11px] text-blue-400">{household?.inviteCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            {editing ? 'Save Profile' : 'Edit Profile'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Account Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-6 border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" /> Personal Account Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" /> Full Name
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-semibold"
                  />
                ) : (
                  <p className="font-semibold text-slate-200">{user?.name || 'Not provided'}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Age
                </span>
                {editing ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-semibold"
                  />
                ) : (
                  <p className="font-semibold text-slate-200">{user?.age ? `${user.age} Years Old` : '28 Years'}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                </span>
                <p className="font-semibold text-slate-200">{user?.email || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number
                </span>
                <p className="font-semibold text-slate-200">{user?.phoneNumber || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Auth Provider
                </span>
                <p className="font-semibold text-slate-200">{user?.provider || 'GOOGLE'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-400" /> Last Login
                </span>
                <p className="font-semibold text-slate-200">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Now'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Household Settings Summary Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4 border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Household Region Settings
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Country Region
                </span>
                <span className="font-bold text-slate-200">{country}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Active Currency
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  {SUPPORTED_CURRENCIES[currency]?.symbol || '$'} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Zone
                </span>
                <span className="font-bold text-slate-200 truncate max-w-[140px]">{timeZone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
