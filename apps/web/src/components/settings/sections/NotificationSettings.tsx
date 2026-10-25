import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CreditCard,
  CalendarClock,
  CheckSquare,
  Home,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Volume2,
  Globe,
  Smartphone,
  Laptop,
  Trash2,
  Send,
  RefreshCw,
  Info,
  ShoppingCart,
} from 'lucide-react';

import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';
import { webPushService, DeviceInfo } from '../../../services/webPushService';
import { firebaseConfig } from '../../../config/firebase';

export const NotificationSettings: React.FC = () => {
  const { pushNotifications, emailAlerts, updateSettings } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Browser permission & registration state
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [isCurrentDeviceRegistered, setIsCurrentDeviceRegistered] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Registered devices
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Category preferences
  const [prefs, setPrefs] = useState({
    finance: true,
    bills: true,
    tasks: true,
    groceries: true,
    family: true,
    security: true,
  });

  // Local preferences
  const [messageAlerts, setMessageAlerts] = useState(
    () => localStorage.getItem('hm_notif_messages') !== 'false'
  );
  const [notificationSound, setNotificationSound] = useState(
    () => localStorage.getItem('hm_notif_sound') === 'true'
  );

  useEffect(() => {
    setBrowserPerm(webPushService.getPermissionState());
    const token = localStorage.getItem('hm_push_token');
    setIsCurrentDeviceRegistered(Boolean(token));
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const devList = await webPushService.getRegisteredDevices();
      setDevices(devList);

      // If current device has preferences, sync them
      if (devList.length > 0) {
        const currentDev = devList[0];
        if (currentDev.preferences) {
          setPrefs({
            finance: currentDev.preferences.finance ?? true,
            bills: currentDev.preferences.bills ?? true,
            tasks: currentDev.preferences.tasks ?? true,
            groceries: currentDev.preferences.groceries ?? true,
            family: currentDev.preferences.family ?? true,
            security: currentDev.preferences.security ?? true,
          });
        }
      }
    } catch {
      // Degrade gracefully
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleEnablePushOnDevice = async () => {
    setEnablingPush(true);
    setFeedback(null);
    try {
      const res = await webPushService.requestPermission();
      setBrowserPerm(res.permission);

      if (res.success) {
        setIsCurrentDeviceRegistered(true);
        setFeedback({
          type: 'success',
          text: 'Push notifications successfully activated on this device!',
        });
        await loadDevices();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to enable notifications.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error requesting notification permission.' });
    } finally {
      setEnablingPush(false);
    }
  };

  const handleDisablePushOnCurrentDevice = async () => {
    setEnablingPush(true);
    try {
      await webPushService.unregisterCurrentDevice();
      setIsCurrentDeviceRegistered(false);
      setFeedback({ type: 'success', text: 'Notifications disabled for this device.' });
      await loadDevices();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to disable notifications on this device.' });
    } finally {
      setEnablingPush(false);
    }
  };

  const handleRemoveDevice = async (device: DeviceInfo) => {
    try {
      await webPushService.unregisterDevice(device.id);
      setFeedback({ type: 'success', text: `Removed device "${device.deviceName}".` });
      await loadDevices();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to remove device.' });
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    setFeedback(null);
    try {
      const res = await webPushService.sendTestNotification();
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'Test notification sent to registered device(s)!',
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Test push failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to trigger test push.' });
    } finally {
      setTestingPush(false);
    }
  };

  const handleToggleGlobalPush = async (checked: boolean) => {
    setSaving(true);
    try {
      await updateSettings({ pushNotifications: checked });
      setFeedback({ type: 'success', text: 'Push notification preference saved.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update setting.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmail = async (checked: boolean) => {
    setSaving(true);
    try {
      await updateSettings({ emailAlerts: checked });
      setFeedback({ type: 'success', text: 'Email alerts preference saved.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update setting.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryPrefChange = async (category: keyof typeof prefs, val: boolean) => {
    const updated = { ...prefs, [category]: val };
    setPrefs(updated);
    try {
      await webPushService.updatePreferences({ [category]: val });
      setFeedback({ type: 'success', text: `${category.toUpperCase()} notifications updated.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to sync category preference.' });
    }
  };

  const currentMetadata = webPushService.getDeviceMetadata();

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl flex items-center justify-between border text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Device Permission & Activation Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-500/5 via-slate-500/5 to-purple-500/5 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Bell className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Device Push Notifications
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {currentMetadata.deviceName}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Stay in sync with your home. Get real-time alerts for shared expenses, upcoming bills,
              assigned tasks, and family updates. Each laptop, desktop, or mobile device you use can be
              managed independently.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            {browserPerm === 'denied' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Blocked in browser settings</span>
              </div>
            ) : isCurrentDeviceRegistered ? (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingPush ? 'Sending...' : 'Test Alert'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisablePushOnCurrentDevice}
                  disabled={enablingPush}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                >
                  <span>Disable on This Device</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnablePushOnDevice}
                disabled={enablingPush}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                <Bell className="w-4 h-4" />
                <span>{enablingPush ? 'Activating...' : 'Enable Notifications on this Device'}</span>
              </button>
            )}
          </div>
        </div>

        {browserPerm === 'denied' && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Notifications are currently blocked for this site in your browser. Click the lock or settings
              icon next to the URL in your browser's address bar to reset permission and re-enable notifications.
            </span>
          </div>
        )}

        {!firebaseConfig.apiKey && (
          <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Push Notification Notice:</span>
              <span>
                Firebase Cloud Messaging keys are currently optional and not set in environment variables. WebSockets, live audio calling, and in-app family updates are active and functioning.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Registered Devices List */}
      <SettingsCard
        id="registered-devices"
        title="Your Registered Devices"
        description="All active devices connected to receive push notifications for your account."
        badge={`${devices.length} Registered`}
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {devices.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {loadingDevices ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Loading connected devices...</span>
                </div>
              ) : (
                'No devices are currently registered. Click "Enable Notifications" above to link this browser.'
              )}
            </div>
          ) : (
            devices.map((device, idx) => (
              <div
                key={device.id || idx}
                className="py-3.5 px-4 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {device.platform === 'android' || device.platform === 'ios' ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {device.deviceName}
                      </span>
                      {device.maskedToken && (
                        <span className="text-[10px] font-mono text-slate-400">
                          ({device.maskedToken})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Last seen: {new Date(device.lastSeenAt).toLocaleDateString()} at{' '}
                      {new Date(device.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(device)}
                    title="Remove device registration"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SettingsCard>

      {/* 3. Notification Category Preferences */}
      <SettingsCard
        id="notification-categories"
        title="Notification Categories"
        description="Choose which event types deliver push notifications to your active devices."
        badge="Filtered by Category"
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Finance & Expenses"
            description="Alerts when new shared expenses or financial transactions are recorded"
            icon={CreditCard}
          >
            <SettingsToggle
              checked={prefs.finance}
              onChange={(val) => handleCategoryPrefChange('finance', val)}
              ariaLabel="Enable finance notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Bills & Due Dates"
            description="Upcoming payment reminders and notices when a bill status changes"
            icon={CalendarClock}
          >
            <SettingsToggle
              checked={prefs.bills}
              onChange={(val) => handleCategoryPrefChange('bills', val)}
              ariaLabel="Enable bill notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Tasks & Chores"
            description="Notifications when tasks are assigned to you or marked as completed"
            icon={CheckSquare}
          >
            <SettingsToggle
              checked={prefs.tasks}
              onChange={(val) => handleCategoryPrefChange('tasks', val)}
              ariaLabel="Enable task notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Groceries & Pantry"
            description="Notices when grocery items are added or low stock thresholds are reached"
            icon={ShoppingCart}
          >
            <SettingsToggle
              checked={prefs.groceries}
              onChange={(val) => handleCategoryPrefChange('groceries', val)}
              ariaLabel="Enable grocery notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Family Workspace"
            description="Alerts when family members join or residence roles are updated"
            icon={Home}
          >
            <SettingsToggle
              checked={prefs.family}
              onChange={(val) => handleCategoryPrefChange('family', val)}
              ariaLabel="Enable family workspace notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Security Alerts"
            description="Critical notices on logins from new devices or locations (Recommended)"
            icon={ShieldAlert}
          >
            <SettingsToggle
              checked={prefs.security}
              onChange={(val) => handleCategoryPrefChange('security', val)}
              ariaLabel="Enable security alerts"
            />
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* 4. Global Alert Channels & Sound */}
      <SettingsCard
        id="notification-channels"
        title="Delivery Channels & Audio"
        description="Delivery channels configured for your account (Synced across devices)."
        badge="Account Settings"
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Account Push Master Toggle"
            description="Allow backend push dispatch across all registered devices"
            icon={Bell}
          >
            <SettingsToggle
              checked={pushNotifications}
              onChange={handleToggleGlobalPush}
              disabled={saving}
              ariaLabel="Enable push notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Email Summaries & Alerts"
            description="Important family finance recaps and security sign-in receipts"
            icon={Mail}
          >
            <SettingsToggle
              checked={emailAlerts}
              onChange={handleToggleEmail}
              disabled={saving}
              ariaLabel="Enable email alerts"
            />
          </SettingsRow>

          <SettingsRow
            label="Notification Sound"
            description="Play a subtle chime on incoming direct messages and urgent alerts"
            icon={Volume2}
          >
            <SettingsToggle
              checked={notificationSound}
              onChange={() => {
                const next = !notificationSound;
                setNotificationSound(next);
                localStorage.setItem('hm_notif_sound', String(next));
              }}
              ariaLabel="Enable notification sound"
            />
          </SettingsRow>
        </div>
      </SettingsCard>
    </div>
  );
};

export default NotificationSettings;
