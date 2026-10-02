import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  LogOut, 
  KeyRound, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Globe,
  Radio
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import apiClient from '../../../services/apiClient';
import { SettingsSection } from '../primitives/SettingsSection';
import { ConfirmationModal } from '../primitives/ConfirmationModal';

interface SessionData {
  device: string;
  os: string;
  browser: string;
  ip: string;
  isCurrent: boolean;
  lastActive: string;
}

export const SecuritySettings: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parse browser/OS details for current device display
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const browserName = userAgent.includes('Chrome') 
    ? 'Google Chrome' 
    : userAgent.includes('Safari') 
    ? 'Apple Safari' 
    : userAgent.includes('Firefox') 
    ? 'Mozilla Firefox' 
    : 'Modern Browser';
  
  const osName = userAgent.includes('Mac')
    ? 'macOS'
    : userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Android')
    ? 'Android'
    : userAgent.includes('iPhone') || userAgent.includes('iPad')
    ? 'iOS'
    : 'Linux / Unix';

  const currentSession: SessionData = {
    device: isMobile ? 'Mobile Handset' : 'Workstation',
    os: osName,
    browser: browserName,
    ip: 'Active Connection',
    isCurrent: true,
    lastActive: 'Just now'
  };

  const fetchSessionInfo = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.activeSessionsCount !== undefined) {
        setActiveSessionsCount(res.data.activeSessionsCount);
      }
    } catch (err: any) {
      console.warn('Could not refresh session telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  const handleLogoutCurrent = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const handleLogoutAllDevices = async () => {
    setRevoking(true);
    setActionMessage(null);
    try {
      await apiClient.post('/auth/logout-all');
      setActionMessage({
        type: 'success',
        text: 'All other active sessions have been terminated. Refreshing security state...'
      });
      setShowLogoutAllModal(false);
      await fetchSessionInfo();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to revoke other sessions. Please try again.'
      });
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div 
          role="status"
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Authentication Methods */}
      <SettingsSection
        title="Authentication Methods"
        description="Credentials and identity providers verified with this account"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Account Protected
          </span>
        }
      >
        <div className="space-y-3">
          {/* Google Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-base text-white">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Google OAuth</h4>
                  {user?.provider === 'GOOGLE' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user?.provider === 'GOOGLE' 
                    ? `Authenticated via ${user.email}`
                    : 'Google Identity integration ready'}
                </p>
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                user?.provider === 'GOOGLE' || user?.isVerified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            </div>
          </div>

          {/* Phone OTP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Phone Authentication (SMS OTP)</h4>
                  {user?.provider === 'PHONE' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user?.phoneNumber ? `Registered number: ${user.phoneNumber}` : 'No phone number attached'}
                </p>
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                user?.phoneNumber
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {user?.phoneNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                {user?.phoneNumber ? 'Active' : 'Unlinked'}
              </span>
            </div>
          </div>

          {/* Email Verification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Email Verification</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user?.email ? user.email : 'No email provided'}
                </p>
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                user?.isVerified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Active Sessions & Devices */}
      <SettingsSection
        title="Active Sessions & Devices"
        description="Devices currently authenticated with valid refresh tokens"
        action={
          <button
            onClick={fetchSessionInfo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Total unexpired session tokens: <strong className="text-white font-semibold">{activeSessionsCount}</strong>
            </span>
            <span className="text-[11px] text-slate-500">
              Last authenticated: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Recent'}
            </span>
          </div>

          {/* Current Session Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mt-0.5">
                  {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      {currentSession.browser} on {currentSession.os}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                      THIS DEVICE
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Active Now
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      Current Web Client
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Sign Out of This Device
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutAllModal(true)}
              disabled={revoking || activeSessionsCount <= 1}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Sign Out of All Other Devices
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutCurrent}
        title="Sign Out"
        description="Are you sure you want to sign out of this device? You will need to sign in again to access HomeMind."
        confirmText="Sign Out"
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        onConfirm={handleLogoutAllDevices}
        title="Sign Out All Other Devices"
        description="This will revoke all active refresh tokens except your current session. Any phones, tablets, or other computers will be required to log in again."
        confirmText={revoking ? "Revoking..." : "Revoke Other Devices"}
        confirmVariant="danger"
      />
    </div>
  );
};
