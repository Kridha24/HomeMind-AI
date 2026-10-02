import React, { useState, useEffect } from 'react';
import { Camera, Check, Save, User as UserIcon, Mail, Phone, Clock, Shield } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useSettingStore } from '../../../stores/useSettingStore';
import apiClient from '../../../services/apiClient';
import { getUserInitials, getUserFullName } from '../../dashboard/utils/dashboardUtils';
import { SettingsSection } from '../primitives/SettingsSection';
import { SettingsInput } from '../primitives/SettingsInput';
import { SettingsRow } from '../primitives/SettingsRow';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { timeZone, saveSettings } = useSettingStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setAvatar(user?.avatar || user?.avatarUrl || '');
  }, [user]);

  // Dirty state check
  const isDirty =
    name !== (user?.name || '') ||
    email !== (user?.email || '') ||
    phoneNumber !== (user?.phoneNumber || '') ||
    avatar !== (user?.avatar || user?.avatarUrl || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Avatar image must be under 3MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await apiClient.put('/auth/profile', {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar,
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setStatusMsg({ type: 'success', text: 'Profile changes saved successfully!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error || "Couldn't save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = getUserInitials(user);
  const fullName = getUserFullName(user);
  const role = user?.role || 'OWNER';

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <SettingsSection
        id="profile-overview"
        title="Personal Profile"
        description="Manage your identity, profile picture, and contact information."
        badge={role}
        action={
          isDirty && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )
        }
      >
        {/* Status notification toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Avatar Upload / Fallback initials */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <div className="relative group">
            {avatar ? (
              <img
                src={avatar}
                alt={fullName}
                className="w-16 h-16 rounded-full border-2 border-blue-500/30 object-cover shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                {initials}
              </div>
            )}

            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Upload new photo"
            >
              <Camera className="w-5 h-5 drop-shadow" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {fullName}
            </h3>
            <p className="text-xs text-slate-400">
              Role: <span className="font-bold text-blue-600 dark:text-blue-400">{role}</span>
            </p>
            <div className="pt-1">
              <label
                htmlFor="avatar-upload"
                className="inline-block text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Change Photo
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="ml-3 text-[11px] font-bold text-rose-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          <SettingsInput
            label="Full Name"
            icon={UserIcon}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />

          <SettingsInput
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />

          <SettingsInput
            label="Phone Number"
            type="tel"
            icon={Phone}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91 98765 43210"
            helpText="Used for SMS OTP authentication and family communications"
          />

          <SettingsInput
            label="Timezone"
            icon={Clock}
            value={timeZone}
            disabled
            helpText="Synced from Regional Preferences"
          />
        </div>
      </SettingsSection>
    </form>
  );
};
