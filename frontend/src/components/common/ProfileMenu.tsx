import React, { useState } from 'react';
import { User, LogOut, Shield, Smartphone, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import apiClient from '../../services/apiClient';

export const ProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, household, logout } = useAuthStore();

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
      >
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Alex')}&background=3b82f6&color=fff`}
          alt="Avatar"
          className="w-7 h-7 rounded-full border border-blue-500/30 object-cover"
        />
        <div className="text-left hidden sm:block">
          <span className="text-xs font-semibold text-slate-200 block leading-none">{user?.name || 'Alex Rivera'}</span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5">{user?.role || 'OWNER'}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Details */}
          <div className="p-2 border-b border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-100">{user?.name}</h4>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || user?.phoneNumber}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                {household?.name || 'Household OS'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" /> Log Out Current Device
            </button>
            <button
              onClick={handleLogoutAllDevices}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-red-400" /> Revoke All Active Devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
