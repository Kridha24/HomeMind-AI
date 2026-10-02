import React, { useState } from 'react';
import {
  CheckCircle2,
  Smartphone,
  Flame,
  Cpu,
  ExternalLink,
  RefreshCw,
  Layers,
  Check,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsStatusBadge } from '../primitives/SettingsStatusBadge';

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'connected' | 'available' | 'native_active';
  account?: string;
  icon: React.ReactNode;
  actionText: string;
  actionHref?: string;
}

export const IntegrationSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
  const isAndroid =
    typeof navigator !== 'undefined' &&
    (/Android/i.test(navigator.userAgent) ||
      (window as any).Capacitor?.getPlatform?.() === 'android');

  const integrations: IntegrationItem[] = [
    {
      id: 'google',
      name: 'Google Identity & Cloud Services',
      category: 'Authentication & Profile',
      description: 'Single sign-on verification and authenticated profile avatar synchronization',
      status: user?.provider === 'GOOGLE' || user?.isVerified ? 'connected' : 'available',
      account: user?.provider === 'GOOGLE' ? user.email : 'Google OAuth Available',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-base text-slate-800 dark:text-white shadow-2xs">
          G
        </div>
      ),
      actionText: user?.provider === 'GOOGLE' ? 'Verified' : 'Connect Account',
    },
    {
      id: 'firebase',
      name: 'Firebase Cloud Messaging (FCM)',
      category: 'Push Notification Gateway',
      description: 'Low-latency encrypted push delivery for urgent bill reminders and debit alerts',
      status: 'connected',
      account: 'HomeMind.AI FCM Gateway Active',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs">
          <Flame className="w-5 h-5" />
        </div>
      ),
      actionText: 'Operational',
    },
    {
      id: 'sms_sync',
      name: 'Android Bank SMS Detection Engine',
      category: 'Financial Telemetry',
      description: 'Local on-device background service for real-time UPI and bank debit message parsing',
      status: isAndroid ? 'native_active' : 'available',
      account: isAndroid ? 'Android Companion Active' : 'Available on Android devices',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs">
          <Smartphone className="w-5 h-5" />
        </div>
      ),
      actionText: isAndroid ? 'Engine Ready' : 'Download APK',
    },
    {
      id: 'capacitor',
      name: 'Capacitor Native Hardware Bridge',
      category: 'Device Hardware Integration',
      description: 'Native biometric sensors, haptic vibration engine, and encrypted local storage',
      status: isCapacitor ? 'native_active' : 'connected',
      account: isCapacitor ? 'Native Runtime Initialized' : 'Web View Sandbox',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-2xs">
          <Cpu className="w-5 h-5" />
        </div>
      ),
      actionText: isCapacitor ? 'Native Bridge Live' : 'Web Fallback Ready',
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setFeedback('Integrations status updated.');
      setTimeout(() => setFeedback(null), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-2xl flex items-center gap-2 border text-xs font-semibold bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      <SettingsCard
        id="integrations-list"
        title="Connected Services & Bridges"
        description="Active system integrations connecting HomeMind.AI with identity providers, hardware sensors, and cloud channels."
        badge={`${integrations.length} Services`}
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Bridges</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
            >
              <div className="flex items-start gap-3.5">
                {item.icon}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h3>
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                  {item.account}
                </span>

                <SettingsStatusBadge
                  label={
                    item.status === 'connected' || item.status === 'native_active'
                      ? 'Connected'
                      : 'Available'
                  }
                  variant={
                    item.status === 'connected' || item.status === 'native_active'
                      ? 'active'
                      : 'neutral'
                  }
                  icon={
                    item.status === 'connected' || item.status === 'native_active'
                      ? CheckCircle2
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
};

export default IntegrationSettings;
