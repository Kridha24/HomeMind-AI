import React, { useState } from 'react';
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
  Receipt,
  Clock,
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';

export const NotificationSettings: React.FC = () => {
  const { pushNotifications, emailAlerts, updateSettings } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Granular category preferences stored with persistence
  const [txnAlerts, setTxnAlerts] = useState(
    () => localStorage.getItem('hm_notif_txn') !== 'false'
  );
  const [billReminders, setBillReminders] = useState(
    () => localStorage.getItem('hm_notif_bills') !== 'false'
  );
  const [taskReminders, setTaskReminders] = useState(
    () => localStorage.getItem('hm_notif_tasks') !== 'false'
  );
  const [householdActivity, setHouseholdActivity] = useState(
    () => localStorage.getItem('hm_notif_household') !== 'false'
  );
  const [securityAlerts, setSecurityAlerts] = useState(
    () => localStorage.getItem('hm_notif_security') !== 'false'
  );
  const [aiInsights, setAiInsights] = useState(
    () => localStorage.getItem('hm_notif_ai') !== 'false'
  );

  const handleTogglePush = async (checked: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({ pushNotifications: checked });
      setFeedback({ type: 'success', text: 'Push notification preference updated' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update push preference' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmail = async (checked: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({ emailAlerts: checked });
      setFeedback({ type: 'success', text: 'Email alert preference updated' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update email alert preference' });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (
    key: string,
    currentValue: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    label: string
  ) => {
    const next = !currentValue;
    setter(next);
    localStorage.setItem(key, String(next));
    setFeedback({ type: 'success', text: `${label} preferences saved` });
    setTimeout(() => setFeedback(null), 3000);
  };

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
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Global Alert Channels */}
      <SettingsCard
        id="notification-channels"
        title="Alert Channels"
        description="Choose how HomeMind.AI delivers real-time household notifications to you."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Push Notifications"
            description="Instant banner alerts on mobile and desktop web browsers"
            icon={Bell}
          >
            <SettingsToggle
              checked={pushNotifications}
              onChange={handleTogglePush}
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
        </div>
      </SettingsCard>

      {/* 2. Finance Notifications */}
      <SettingsCard
        id="finance-notifications"
        title="Finance & Payments"
        description="Stay on top of family spending, detected SMS transactions, and upcoming due dates."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Transaction Alerts"
            description="Instant alert when bank, credit card, or UPI transaction is recorded"
            icon={CreditCard}
          >
            <SettingsToggle
              checked={txnAlerts}
              onChange={() =>
                handleCategoryToggle('hm_notif_txn', txnAlerts, setTxnAlerts, 'Transaction')
              }
              ariaLabel="Enable transaction alerts"
            />
          </SettingsRow>

          <SettingsRow
            label="Bill Due Date Reminders"
            description="Advance notices 3 days and 24 hours prior to rent or utility deadlines"
            icon={CalendarClock}
          >
            <SettingsToggle
              checked={billReminders}
              onChange={() =>
                handleCategoryToggle('hm_notif_bills', billReminders, setBillReminders, 'Bill reminder')
              }
              ariaLabel="Enable bill due date reminders"
            />
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* 3. Household & Chores Notifications */}
      <SettingsCard
        id="household-notifications"
        title="Household & Chores"
        description="Keep family members synchronized on shared responsibilities."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Task & Chore Reminders"
            description="Alerts when pending tasks are assigned to you or marked completed"
            icon={CheckSquare}
          >
            <SettingsToggle
              checked={taskReminders}
              onChange={() =>
                handleCategoryToggle('hm_notif_tasks', taskReminders, setTaskReminders, 'Task')
              }
              ariaLabel="Enable task reminders"
            />
          </SettingsRow>

          <SettingsRow
            label="Member Activity"
            description="Notifications when new family members join or change residence roles"
            icon={Home}
          >
            <SettingsToggle
              checked={householdActivity}
              onChange={() =>
                handleCategoryToggle(
                  'hm_notif_household',
                  householdActivity,
                  setHouseholdActivity,
                  'Household activity'
                )
              }
              ariaLabel="Enable member activity alerts"
            />
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* 4. Security & AI Notifications */}
      <SettingsCard
        id="security-ai-notifications"
        title="Security & AI Intelligence"
        description="Critical account security triggers and proactive household insights."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="New Sign-In & Security Alerts"
            description="Immediate notification on logins from unverified devices or IP ranges"
            icon={ShieldAlert}
          >
            <SettingsToggle
              checked={securityAlerts}
              onChange={() =>
                handleCategoryToggle(
                  'hm_notif_security',
                  securityAlerts,
                  setSecurityAlerts,
                  'Security'
                )
              }
              ariaLabel="Enable security alerts"
            />
          </SettingsRow>

          <SettingsRow
            label="AI Copilot Insights Ready"
            description="Periodic smart recommendations regarding utility trends and pantry waste"
            icon={Sparkles}
          >
            <SettingsToggle
              checked={aiInsights}
              onChange={() =>
                handleCategoryToggle('hm_notif_ai', aiInsights, setAiInsights, 'AI copilot')
              }
              ariaLabel="Enable AI insights alerts"
            />
          </SettingsRow>
        </div>
      </SettingsCard>
    </div>
  );
};

export default NotificationSettings;
