import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Smartphone, ChevronDown, Phone, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { VerifyPhoneModal } from './VerifyPhoneModal';
import apiClient from '../../services/apiClient';
import { getUserFullName, getUserInitials } from '../dashboard/utils/dashboardUtils';

export const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { user, household, logout } = useAuthStore();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

  const handleLogoutAllDevices = async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } catch (e) {
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const role = user?.role || 'OWNER';
  const avatarUrl = user?.avatar || user?.avatarUrl;

  const roleBadgeStyles: Record<string, string> = {
    OWNER: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
    ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    MEMBER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    GUEST: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Profile Menu"
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-violet-500/30 hover:shadow-xs active:scale-[0.98] transition-all duration-150"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-7 h-7 rounded-full border border-violet-500/40 object-cover flex-shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center text-[11px] font-extrabold shadow-2xs flex-shrink-0 ring-1 ring-white/20">
            {initials}
          </div>
        )}

        <div className="text-left hidden sm:block min-w-0 max-w-[130px]">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate leading-none">
            {fullName}
          </span>
          <span className="text-[10px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-wider block mt-0.5">
            {role}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Details */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-10 h-10 rounded-full border border-blue-500/30 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {fullName}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'Authenticated User'}
                </p>
              </div>
            </div>

            {/* Optional Phone Info */}
            {user?.phoneNumber && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" /> {user.phoneNumber}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  Mobile
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                {household?.name || 'HomeMind OS'}
              </span>
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                  roleBadgeStyles[role] || roleBadgeStyles.OWNER
                }`}
              >
                {role}
              </span>
            </div>
          </div>

          {/* Navigation & Action Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                navigate('/settings?tab=profile');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>My Account & Profile</span>
            </button>
            <button
              onClick={() => {
                navigate('/settings?tab=household');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Household Settings</span>
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>App Settings</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={handleLogoutAllDevices}
              className="w-full text-left px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-500" />
              <span>Revoke All Active Devices</span>
            </button>
          </div>
        </div>
      )}

      {/* Verify Phone Modal */}
      <VerifyPhoneModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  );
};

export default ProfileMenu;
