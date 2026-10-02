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
  AlertTriangle
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsSection } from '../primitives/SettingsSection';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';

export const NotificationSettings: React.FC = () => {
  const { 
    pushNotifications, 
    emailAlerts, 
    updateSettings, 
    saveSettings 
  } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Granular category preferences stored with persistence
  const [txnAlerts, setTxnAlerts] = useState(() => 
    localStorage.getItem('hm_notif_txn') !== 'false'
  );
  const [billReminders, setBillReminders] = useState(() => 
    localStorage.getItem('hm_notif_bills') !== 'false'
  );
  const [taskReminders, setTaskReminders] = useState(() => 
    localStorage.getItem('hm_notif_tasks') !== 'false'
  );
  const [householdActivity, setHouseholdActivity] = useState(() => 
    localStorage.getItem('hm_notif_household') !== 'false'
  );
  const [securityAlerts, setSecurityAlerts] = useState(() => 
    localStorage.getItem('hm_notif_security') !== 'false'
  );
  const [aiInsights, setAiInsights] = useState(() => 
    localStorage.getItem('hm_notif_ai') !== 'false'
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
      {feedback && (
        <div 
          role="status"
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Delivery Channels */}
      <SettingsSection
        title="Delivery Channels"
        description="Choose how HomeMind reaches you for important events"
      >
        <div className="space-y-1">
          <SettingsRow
            label="In-App Push Notifications"
            description="Receive real-time push alerts on your desktop browser and mobile device"
            icon={<Bell className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={pushNotifications}
              onChange={handleTogglePush}
              disabled={saving}
              ariaLabel="Toggle push notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Email Summaries & Urgent Alerts"
            description="Send financial summaries, invoices, and high-severity security notifications to your email"
            icon={<Mail className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={emailAlerts}
              onChange={handleToggleEmail}
              disabled={saving}
              ariaLabel="Toggle email alerts"
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Category Subscriptions */}
      <SettingsSection
        title="Notification Topics"
        description="Fine-tune which categories trigger notifications across your active channels"
      >
        <div className="space-y-1">
          <SettingsRow
            label="Transaction Alerts"
            description="Get notified when a new bank, UPI, or credit transaction is logged or auto-detected"
            icon={<CreditCard className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={txnAlerts}
              onChange={() => handleCategoryToggle('hm_notif_txn', txnAlerts, setTxnAlerts, 'Transaction alert')}
              ariaLabel="Toggle transaction alerts"
            />
          </SettingsRow>

          <SettingsRow
            label="Bill Due Reminders"
            description="Advance warning before recurring utility, rent, subscription, or loan payments are due"
            icon={<CalendarClock className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={billReminders}
              onChange={() => handleCategoryToggle('hm_notif_bills', billReminders, setBillReminders, 'Bill reminder')}
              ariaLabel="Toggle bill reminders"
            />
          </SettingsRow>

          <SettingsRow
            label="Task & Chore Assignments"
            description="Reminders when a chore is assigned, due soon, or marked complete by family members"
            icon={<CheckSquare className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={taskReminders}
              onChange={() => handleCategoryToggle('hm_notif_tasks', taskReminders, setTaskReminders, 'Task reminder')}
              ariaLabel="Toggle task notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Household Activity"
            description="Updates when new members join, invitations are accepted, or roles are updated"
            icon={<Home className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={householdActivity}
              onChange={() => handleCategoryToggle('hm_notif_household', householdActivity, setHouseholdActivity, 'Household activity')}
              ariaLabel="Toggle household activity notifications"
            />
          </SettingsRow>

          <SettingsRow
            label="Security & Session Alerts"
            description="Instant notifications whenever a new login occurs or security credentials change"
            icon={<ShieldAlert className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={securityAlerts}
              onChange={() => handleCategoryToggle('hm_notif_security', securityAlerts, setSecurityAlerts, 'Security alert')}
              ariaLabel="Toggle security alerts"
            />
          </SettingsRow>

          <SettingsRow
            label="AI Insights & Weekly Digests"
            description="Personalized spend forecasts, grocery restock recommendations, and budget tips"
            icon={<Sparkles className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={aiInsights}
              onChange={() => handleCategoryToggle('hm_notif_ai', aiInsights, setAiInsights, 'AI insights')}
              ariaLabel="Toggle AI insights"
            />
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
};
