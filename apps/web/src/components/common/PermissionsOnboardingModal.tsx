import React, { useState } from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Bell,
  Camera,
  Mic,
  ArrowRight,
  CheckCircle2,
  X,
  Smartphone
} from 'lucide-react';
import { SmsPluginBridge } from '../../services/sms/smsPluginBridge';
import { SmsSyncManager } from '../../services/sms/smsSyncManager';

interface PermissionsOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsOnboardingModal: React.FC<PermissionsOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [requesting, setRequesting] = useState(false);
  const [step, setStep] = useState<'overview' | 'notification_access'>('overview');

  if (!isOpen) return null;

  const handleAllowPermissions = async () => {
    setRequesting(true);
    try {
      // 1. Request SMS Permissions (Triggers native Android "Allow HomeMind to access SMS?" prompt)
      try {
        const smsRes = await SmsPluginBridge.requestPermissions();
        if (smsRes.granted) {
          SmsSyncManager.setTrackingEnabled(true);
          // Auto-trigger initial scan in background
          SmsSyncManager.scanAndSync().catch(() => {});
        }
      } catch (err) {
        console.warn('SMS permission request skipped/failed:', err);
      }

      // 2. Request Push Notifications
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }

      // 3. Request Camera & Microphone (for Pantry Vision & Family Calls)
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn('Media devices permission error:', err);
      }

      // 4. Check if Native & Notification Access for PhonePe/GPay is needed
      if (SmsPluginBridge.isNative()) {
        const notifGranted = await SmsPluginBridge.isNotificationAccessGranted();
        if (!notifGranted) {
          setStep('notification_access');
          setRequesting(false);
          return;
        }
      }

      // All done!
      handleFinish();
    } catch (e) {
      console.error('Permission onboarding error:', e);
      handleFinish();
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenNotificationAccess = async () => {
    await SmsPluginBridge.openNotificationAccessSettings();
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('homemind_permissions_prompted', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
        {step === 'overview' ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Set Up App Permissions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Allow access to unlock automatic tracking & reminders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinish}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Skip permissions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Permission Cards List */}
            <div className="space-y-2.5 pt-1">
              {/* Item 1: SMS & UPI Tracking */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Bank SMS & UPI Auto-Detect
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Automatically records expense debits from PhonePe, GPay, and Indian banks.
                  </p>
                </div>
              </div>

              {/* Item 2: Notifications */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Notifications & Alerts
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Receive bill due dates, household task reminders, and family alerts.
                  </p>
                </div>
              </div>

              {/* Item 3: Camera */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Camera & Receipt Scanner
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Scan grocery bills and identify items with Pantry Vision AI.
                  </p>
                </div>
              </div>

              {/* Item 4: Microphone */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Microphone for Family Calls
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Enables high-definition household audio calls and voice notes.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={requesting}
                onClick={handleAllowPermissions}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                <span>{requesting ? 'Requesting Permissions...' : 'Allow All Permissions'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Maybe Later (Skip for now)
              </button>
            </div>
          </>
        ) : (
          /* Step 2: UPI Apps Notification Access */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  PhonePe & GPay Direct Detection
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Even when bank SMS does not arrive
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                To capture transactions directly when you pay using <strong>PhonePe, Google Pay, or Paytm</strong>, Android requires <strong>Notification Access</strong>.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% On-device privacy: PIN & private messages are never read.</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleOpenNotificationAccess}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>Enable in Android Settings</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Skip UPI Direct Detection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
