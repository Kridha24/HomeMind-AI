import React, { useState } from 'react';
import { 
  Globe, 
  Coins, 
  Clock, 
  Calendar, 
  Gauge, 
  Hash, 
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SUPPORTED_CURRENCIES } from '../../../utils/currency';
import { SUPPORTED_LANGUAGES, useI18n } from '../../../utils/i18n';
import { SettingsSection } from '../primitives/SettingsSection';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsSelect } from '../primitives/SettingsSelect';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada, UTC-5:00)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada, UTC-8:00)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London, UTC+0:00)' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin, UTC+1:00)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai, UTC+4:00)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (Singapore, UTC+8:00)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo, UTC+9:00)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 02/10/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 10/02/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-10-02)' }
];

export const PreferencesSettings: React.FC = () => {
  const { 
    language, 
    currency, 
    timeZone, 
    dateFormat, 
    unitSystem,
    setLanguage, 
    setCurrency, 
    setTimeZone, 
    setDateFormat, 
    setUnitSystem, 
    updateSettings 
  } = useSettingStore();

  const { t } = useI18n();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local preferences
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(() => 
    localStorage.getItem('hm_firstDayOfWeek') || 'Monday'
  );
  const [numberFormat, setNumberFormat] = useState(() => 
    localStorage.getItem('hm_numberFormat') || 'indian'
  );
  const [defaultPeriod, setDefaultPeriod] = useState(() => 
    localStorage.getItem('hm_defaultPeriod') || 'month'
  );

  const notifyChange = (msg: string) => {
    setFeedback({ type: 'success', text: msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleLanguageChange = async (val: string) => {
    setSaving(true);
    setLanguage(val);
    try {
      await updateSettings({ language: val });
      notifyChange(`Language switched to ${SUPPORTED_LANGUAGES[val]?.name || val}`);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to synchronize language preference.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (val: string) => {
    setSaving(true);
    setCurrency(val);
    try {
      await updateSettings({ currency: val });
      notifyChange(`Currency set to ${val} (${SUPPORTED_CURRENCIES[val]?.symbol})`);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to synchronize currency.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (val: string) => {
    setSaving(true);
    setTimeZone(val);
    try {
      await updateSettings({ timeZone: val });
      notifyChange('Timezone updated successfully.');
    } catch {
      setFeedback({ type: 'error', text: 'Failed to synchronize timezone.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDateFormatChange = async (val: string) => {
    setSaving(true);
    setDateFormat(val);
    try {
      await updateSettings({ dateFormat: val });
      notifyChange('Date format updated.');
    } catch {
      setFeedback({ type: 'error', text: 'Failed to synchronize date format.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnitSystemChange = async (val: string) => {
    setSaving(true);
    const unit = val as 'Metric' | 'Imperial';
    setUnitSystem(unit);
    try {
      await updateSettings({ unitSystem: unit });
      notifyChange(`Measurement units set to ${unit}.`);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to synchronize unit system.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFirstDayChange = (val: string) => {
    setFirstDayOfWeek(val);
    localStorage.setItem('hm_firstDayOfWeek', val);
    notifyChange(`First day of the week set to ${val}.`);
  };

  const handleNumberFormatChange = (val: string) => {
    setNumberFormat(val);
    localStorage.setItem('hm_numberFormat', val);
    notifyChange('Number grouping format updated.');
  };

  const handleDefaultPeriodChange = (val: string) => {
    setDefaultPeriod(val);
    localStorage.setItem('hm_defaultPeriod', val);
    notifyChange('Default dashboard range updated.');
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

      {/* Regional & Localization */}
      <SettingsSection
        title="Regional & Localization"
        description="Configure your spoken language, standard currency, and timezone"
      >
        <div className="space-y-1">
          {/* Language */}
          <SettingsRow
            label="Display Language"
            description="Choose the language used throughout the dashboard and navigation"
            icon={<Globe className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={language.toLowerCase().startsWith('hi') ? 'hi' : language.toLowerCase().includes('hinglish') ? 'hinglish' : language}
                onChange={handleLanguageChange}
                disabled={saving}
                options={Object.entries(SUPPORTED_LANGUAGES).map(([code, def]) => ({
                  value: code,
                  label: `${def.flag} ${def.name}`
                }))}
                ariaLabel="Select language"
              />
            </div>
          </SettingsRow>

          {/* Currency */}
          <SettingsRow
            label="Operating Currency"
            description="HomeMind natively handles INR (₹) banking and SMS feeds; multi-currency options adapt dashboard display"
            icon={<Coins className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={currency || 'INR'}
                onChange={handleCurrencyChange}
                disabled={saving}
                options={Object.values(SUPPORTED_CURRENCIES).map((c) => ({
                  value: c.code,
                  label: `${c.code} (${c.symbol})`
                }))}
                ariaLabel="Select currency"
              />
            </div>
          </SettingsRow>

          {/* Timezone */}
          <SettingsRow
            label="Household Timezone"
            description="All scheduled tasks, transaction logs, and bill alerts adhere to this zone"
            icon={<Clock className="w-5 h-5" />}
          >
            <div className="w-52 sm:w-72">
              <SettingsSelect
                value={timeZone || 'Asia/Kolkata'}
                onChange={handleTimezoneChange}
                disabled={saving}
                options={TIMEZONES}
                ariaLabel="Select timezone"
              />
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Formatting & Conventions */}
      <SettingsSection
        title="Formatting & Standards"
        description="Customize how dates, numeric values, and units of measurement are represented"
      >
        <div className="space-y-1">
          {/* Date format */}
          <SettingsRow
            label="Date Format"
            description="Structure for calendar views, transaction dates, and task deadlines"
            icon={<Calendar className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={dateFormat || 'DD/MM/YYYY'}
                onChange={handleDateFormatChange}
                disabled={saving}
                options={DATE_FORMATS}
                ariaLabel="Select date format"
              />
            </div>
          </SettingsRow>

          {/* Number format */}
          <SettingsRow
            label="Number Grouping Format"
            description="Select Indian numbering system (Lakhs & Crores) or International standard"
            icon={<Hash className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={numberFormat}
                onChange={handleNumberFormatChange}
                options={[
                  { value: 'indian', label: 'Indian (₹ 1,00,000)' },
                  { value: 'international', label: 'International (100,000)' }
                ]}
                ariaLabel="Select number grouping format"
              />
            </div>
          </SettingsRow>

          {/* Unit system */}
          <SettingsRow
            label="Measurement System"
            description="Used for pantry inventories, appliance specs, and utility tracking"
            icon={<Gauge className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={unitSystem || 'Metric'}
                onChange={handleUnitSystemChange}
                disabled={saving}
                options={[
                  { value: 'Metric', label: 'Metric (kg, L, km, °C)' },
                  { value: 'Imperial', label: 'Imperial (lb, gal, mi, °F)' }
                ]}
                ariaLabel="Select unit system"
              />
            </div>
          </SettingsRow>

          {/* First day of week */}
          <SettingsRow
            label="First Day of the Week"
            description="Determines calendar and weekly task agenda column layout"
            icon={<Calendar className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={firstDayOfWeek}
                onChange={handleFirstDayChange}
                options={[
                  { value: 'Monday', label: 'Monday' },
                  { value: 'Sunday', label: 'Sunday' }
                ]}
                ariaLabel="Select first day of the week"
              />
            </div>
          </SettingsRow>

          {/* Default dashboard period */}
          <SettingsRow
            label="Default Analytics Horizon"
            description="Initial timeframe displayed when opening financial and household dashboards"
            icon={<Layers className="w-5 h-5" />}
          >
            <div className="w-48 sm:w-60">
              <SettingsSelect
                value={defaultPeriod}
                onChange={handleDefaultPeriodChange}
                options={[
                  { value: 'month', label: 'This Month' },
                  { value: '30days', label: 'Last 30 Days' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' }
                ]}
                ariaLabel="Select default analytics horizon"
              />
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
};
