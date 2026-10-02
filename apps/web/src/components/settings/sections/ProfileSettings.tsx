import React, { useState, useEffect } from 'react';
import { Camera, Mail, Phone, Clock, User as UserIcon, Shield, Check, Sparkles, Building2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useSettingStore } from '../../../stores/useSettingStore';
import apiClient from '../../../services/apiClient';
import { getUserInitials, getUserFullName } from '../../dashboard/utils/dashboardUtils';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsInput } from '../primitives/SettingsInput';
import { SettingsSaveBar } from '../primitives/SettingsSaveBar';
import { SettingsStatusBadge, SettingsBadgeVariant } from '../primitives/SettingsStatusBadge';

export const ProfileSettings: React.FC = () => {
  const { user, household, updateUser } = useAuthStore();
  const { timeZone } = useSettingStore();

  const [name, setName] = useState(user?.name || '');
  const [displayName, setDisplayName] = useState(user?.name?.split(' ')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setDisplayName(user?.name?.split(' ')[0] || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setAvatar(user?.avatar || user?.avatarUrl || '');
  }, [user]);

  // Check if form has unsaved modifications
  const isDirty =
    name !== (user?.name || '') ||
    email !== (user?.email || '') ||
    phoneNumber !== (user?.phoneNumber || '') ||
    avatar !== (user?.avatar || user?.avatarUrl || '');

  const handleReset = () => {
    setName(user?.name || '');
    setDisplayName(user?.name?.split(' ')[0] || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setAvatar(user?.avatar || user?.avatarUrl || '');
    setStatusMsg(null);
  };

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || saving) return;

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
      setSaved(true);
      setStatusMsg({ type: 'success', text: 'Profile changes saved successfully!' });
      setTimeout(() => {
        setSaved(false);
        setStatusMsg(null);
      }, 3000);
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
  const role = user?.role || 'MEMBER';
  const roleBadgeVariant: SettingsBadgeVariant =
    role === 'OWNER' ? 'owner' : role === 'ADMIN' ? 'admin' : 'member';

  const maskedPhone = phoneNumber
    ? phoneNumber.length > 5
      ? `${phoneNumber.slice(0, 3)} •••••• ${phoneNumber.slice(-4)}`
      : phoneNumber
    : 'No phone registered';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          role="alert"
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
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

      {/* 1. Visually Strong Identity Profile Hero Card */}
      <section
        aria-label="Profile Hero Overview"
        className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Avatar Experience: 80-96px with photo/initials and hover overlay */}
          <div className="relative group flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-blue-500/30 object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md tracking-wider">
                {initials}
              </div>
            )}

            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-3xl bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
              title="Upload new profile picture"
            >
              <Camera className="w-5 h-5 drop-shadow" />
              <span className="text-[10px] font-bold mt-1">Change</span>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {/* Identity Information */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {fullName}
              </h2>
              <SettingsStatusBadge label={role} variant={roleBadgeVariant} />
              {household?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-[160px]">{household.name}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{email || 'No email attached'}</span>
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="font-mono">{maskedPhone}</span>
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Information Clean Grouped Form */}
      <form onSubmit={handleSave}>
        <SettingsCard
          id="profile-personal-info"
          title="Personal Information"
          description="Update your display name, contact coordinates, and communication preferences."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsInput
              label="Full Name"
              icon={UserIcon}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!displayName || displayName === name.split(' ')[0]) {
                  setDisplayName(e.target.value.split(' ')[0] || '');
                }
              }}
              required
              placeholder="e.g. Rahul Sharma"
              helpText="Your official household account name"
            />

            <SettingsInput
              label="Display Name"
              icon={UserIcon}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Rahul"
              helpText="Short name displayed in greetings and copilot"
            />

            <SettingsInput
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              helpText="Used for session notifications and receipt reports"
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

            <div className="sm:col-span-2">
              <SettingsInput
                label="Timezone"
                icon={Clock}
                value={timeZone || 'Asia/Kolkata'}
                disabled
                helpText="Synchronized from Preferences & System Locale (UTC+05:30)"
              />
            </div>
          </div>
        </SettingsCard>
      </form>

      {/* 3. Floating / Sticky Save Bar when form changes */}
      <SettingsSaveBar
        isDirty={isDirty}
        saving={saving}
        saved={saved}
        onSave={() => handleSave()}
        onCancel={handleReset}
      />
    </div>
  );
};

export default ProfileSettings;
