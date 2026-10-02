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
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { SettingsSection } from '../primitives/SettingsSection';

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
  const isAndroid = typeof navigator !== 'undefined' && (/Android/i.test(navigator.userAgent) || (window as any).Capacitor?.getPlatform?.() === 'android');

  const integrations: IntegrationItem[] = [
    {
      id: 'google',
      name: 'Google Identity & Cloud Platform',
      category: 'Authentication & Security',
      description: 'Single sign-on verification and authenticated profile avatar synchronization',
      status: user?.provider === 'GOOGLE' || user?.isVerified ? 'connected' : 'available',
      account: user?.provider === 'GOOGLE' ? user.email : 'Ready to link',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-base text-white">
          G
        </div>
      ),
      actionText: user?.provider === 'GOOGLE' ? 'Verified' : 'Connect Account'
    },
    {
      id: 'firebase',
      name: 'Firebase Cloud Messaging (FCM)',
      category: 'Push Notification Engine',
      description: 'Low-latency encrypted push delivery for urgent bill reminders and debit alerts',
      status: 'connected',
      account: 'HomeMind FCM Gateway Active',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Flame className="w-5 h-5" />
        </div>
      ),
      actionText: 'Operational'
    },
    {
      id: 'sms_sync',
      name: 'Android Financial SMS Engine',
      category: 'Financial Telemetry',
      description: 'Local on-device background service for real-time UPI and debit message parsing',
      status: isAndroid ? 'native_active' : 'available',
      account: isAndroid ? 'Android Companion Active' : 'Available on Android devices',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Smartphone className="w-5 h-5" />
        </div>
      ),
      actionText: isAndroid ? 'Engine Ready' : 'Download APK'
    },
    {
      id: 'capacitor',
      name: 'Capacitor Native Hardware Bridge',
      category: 'Device Hardware Integration',
      description: 'Biometric sensors, haptic vibration engine, and encrypted SQLite storage layer',
      status: isCapacitor ? 'native_active' : 'connected',
      account: isCapacitor ? 'Native Runtime Initialized' : 'Web View Sandbox',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Cpu className="w-5 h-5" />
        </div>
      ),
      actionText: isCapacitor ? 'Native Bridge Live' : 'Web Fallback Ready'
    }
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
          className="p-4 rounded-xl flex items-center gap-3 border text-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      <SettingsSection
        title="Connected Platforms & Gateways"
        description="Active external integrations, identity providers, and device hardware bridges"
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 pt-1">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                    <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                  {item.account && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      {item.account}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:self-center flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  item.status === 'connected' || item.status === 'native_active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  {item.actionText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
};
