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
  LogOut,
  Edit3,
  CheckCircle2,
  Building,
  Upload,
  Camera,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { SUPPORTED_CURRENCIES, COUNTRY_DEFAULTS } from '../utils/currency';
import apiClient from '../services/apiClient';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

export const Profile: React.FC = () => {
  const { user, household, logout, updateUser } = useAuthStore();
  const { currency, country, timeZone, updateSettings } = useSettingStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '28');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [selectedCountry, setSelectedCountry] = useState(country || 'US');
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'USD');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload to Base64 Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
    setSaving(true);
    setMsg(null);

    try {
      const res = await apiClient.put('/auth/profile', {
        name,
        age: age ? parseInt(age, 10) : undefined,
        email,
        phoneNumber,
        avatar,
        country: selectedCountry,
        currency: selectedCurrency,
      });

      if (res.data.user) {
        updateUser(res.data.user);
      }

      updateSettings({
        country: selectedCountry,
        currency: selectedCurrency,
        currencySymbol: SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$',
      });

      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save profile changes' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold text-center border ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <img
              src={
                avatar ||
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff`
              }
              alt={name || 'Profile'}
              className="w-24 h-24 rounded-full border-4 border-blue-500/30 object-cover shadow-2xl"
            />
            {editing && (
              <label className="absolute inset-0 bg-slate-950/70 rounded-full flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[9px] font-bold text-slate-200 uppercase">Change</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </span>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-slate-100">{user?.name || name || 'User'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                {user?.role || 'OWNER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-2">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{household?.name || 'Home Residence'}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[11px] text-blue-400">{household?.inviteCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Avatar Presets & Upload Picker */}
      {editing && (
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" /> Choose Profile Photo or Avatar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block">Select Preset Avatar</span>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === preset ? 'border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20' : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx}`} className="w-full h-14 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL or Direct Upload */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Direct Computer Photo Upload</span>
                <label className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 border-dashed rounded-xl p-3 text-xs text-slate-300 cursor-pointer hover:border-blue-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Upload Image File from Device</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Or Paste Image URL</span>
                <input
                  type="text"
                  placeholder="https://example.com/my-photo.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="font-semibold text-slate-200">{user?.age ? `${user.age} Years Old` : 'Not specified'}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                </span>
                {editing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="font-semibold text-slate-200">{user?.email || 'N/A'}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="font-semibold text-slate-200">{user?.phoneNumber || 'N/A'}</p>
                )}
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
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Country Region
                </span>
                {editing ? (
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      const defs = COUNTRY_DEFAULTS[e.target.value];
                      if (defs) setSelectedCurrency(defs.currency);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-semibold"
                  >
                    {Object.entries(COUNTRY_DEFAULTS).map(([code, defs]) => (
                      <option key={code} value={code}>
                        {defs.countryName} ({code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-bold text-slate-200">{country}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Active Currency
                </span>
                {editing ? (
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-semibold"
                  >
                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-bold text-emerald-400 font-mono">
                    {SUPPORTED_CURRENCIES[currency]?.symbol || '$'} {currency}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Zone
                </span>
                <span className="font-bold text-slate-200 truncate max-w-[140px]">{timeZone}</span>
              </div>
            </div>
          </div>

          {/* Appearance Theme Switcher Card */}
          <div className="glass-panel p-6 space-y-4 border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Appearance & UI Theme
            </h2>
            <p className="text-[11px] text-slate-400">Select your preferred application display aesthetic</p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  useSettingStore.getState().theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">🌙</span>
                <span className="text-[10px] font-bold">Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  useSettingStore.getState().theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">☀️</span>
                <span className="text-[10px] font-bold">Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'glass' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  useSettingStore.getState().theme === 'glass'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">🪐</span>
                <span className="text-[10px] font-bold">Glass Cyber</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
