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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-panel border border-primary/80 hover:border-secondary transition-colors"
      >
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
          alt="Avatar"
          className="w-7 h-7 rounded-full border border-blue-500/30 object-cover"
        />
        <div className="text-left hidden sm:block">
          <span className="text-xs font-semibold text-primary block leading-none">{user?.name || 'Homeowner'}</span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5">{user?.role || 'OWNER'}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-panel border border-primary rounded-2xl shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Details */}
          <div className="p-2 border-b border-primary/80 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-primary">{user?.name || 'Homeowner'}</h4>
              <p className="text-[11px] text-muted truncate">{user?.email || 'Authenticated User'}</p>
            </div>

            {/* Optional Phone Info (if provided) */}
            {user?.phoneNumber && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-primary">
                <span className="text-[11px] text-secondary font-mono font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> {user.phoneNumber}
                </span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full">
                  Mobile
                </span>
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
              className="w-full text-left px-3 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-secondary rounded-xl flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-muted" /> Log Out Current Device
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

