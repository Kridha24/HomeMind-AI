import React, { useState } from 'react';
import { User, LogOut, Shield, Smartphone, ChevronDown, Phone, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { VerifyPhoneModal } from './VerifyPhoneModal';
import apiClient from '../../services/apiClient';

export const ProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
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
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
          alt="Avatar"
          className="w-7 h-7 rounded-full border border-blue-500/30 object-cover"
        />
        <div className="text-left hidden sm:block">
          <span className="text-xs font-semibold text-slate-200 block leading-none">{user?.name || 'Homeowner'}</span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5">{user?.role || 'OWNER'}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Details */}
          <div className="p-2 border-b border-slate-800/80 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-100">{user?.name || 'Homeowner'}</h4>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Authenticated User'}</p>
            </div>

            {/* Mobile Verification Status Badge */}
            {user?.phoneNumber ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-300 font-mono font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> {user.phoneNumber}
                </span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> Mobile Not Verified
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowVerifyModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition-colors shadow"
                >
                  Verify It
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                {household?.name || 'Household OS'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Account Active
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

      {/* Verify Phone Modal */}
      <VerifyPhoneModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  );
};

