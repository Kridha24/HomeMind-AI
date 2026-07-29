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

  // Calculate completion percentage
  let fieldsFilled = 0;
  let totalFields = 6;
  if (user?.name) fieldsFilled++;
  if (user?.email) fieldsFilled++;
  if (user?.phoneNumber) fieldsFilled++;
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
              alt="Profile Avatar"
              className="w-24 h-24 rounded-3xl border-2 border-blue-500/40 object-cover shadow-2xl"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border-2 border-slate-900 shadow">
              PRO
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-100">{user?.name || 'Alex Rivera'}</h1>
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {user?.role || 'OWNER'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.email || user?.phoneNumber || 'Enterprise User'}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-purple-400" /> {household?.name || 'Home Residence'}
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Profile Completion Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 w-full md:w-64 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Profile Completion</span>
            <span className="text-blue-400 font-mono font-bold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500">Your profile is fully configured for smart household AI analytics.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Details */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" /> Personal Profile Information
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> {editing ? 'Cancel Edit' : 'Edit Details'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Full Name</span>
              <p className="text-sm font-bold text-slate-200">{user?.name || 'Alex Rivera'}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Authentication Provider</span>
              <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> {user?.provider || 'GOOGLE'} OAuth
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Registered Email</span>
              <p className="text-sm font-bold text-slate-200 truncate">{user?.email || 'N/A'}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Mobile Phone Number</span>
              <p className="text-sm font-bold text-slate-200">{user?.phoneNumber || 'N/A'}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Household Assignment</span>
              <p className="text-sm font-bold text-slate-200">{household?.name || 'Home Residence'}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Member Since</span>
              <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" /> July 2026
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Actions */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4 border-slate-800">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-purple-400" /> Active Regional Preferences
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Currency
                </span>
                <span className="font-bold font-mono text-emerald-400">
                  {SUPPORTED_CURRENCIES[currency]?.name || 'US Dollar ($)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> Country & Region
                </span>
                <span className="font-bold text-slate-200">{country}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Time Zone
                </span>
                <span className="font-bold font-mono text-slate-300">{timeZone}</span>
              </div>
            </div>
          </div>

          {/* Account Danger Actions */}
          <div className="glass-panel p-6 space-y-3 border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4 text-slate-400" /> Log Out Active Session
            </button>
            <button
              onClick={() => alert('Account deletion requested. All household records will be purged safely.')}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4 text-red-400" /> Purge & Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
