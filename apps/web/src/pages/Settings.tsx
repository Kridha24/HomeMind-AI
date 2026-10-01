import React, { useEffect, useState } from 'react';
import {
  Globe,
  DollarSign,
  Moon,
  Sun,
  Bell,
  Bot,
  Shield,
  Check,
  Save,
  Clock,
  Ruler,
  FileText,
  Trash2,
  Download,
  Sparkles,
  Phone,
  CheckCircle2,
  User,
  Languages,
} from 'lucide-react';
import { useSettingStore } from '../stores/useSettingStore';
import { useAuthStore } from '../stores/useAuthStore';
import { VerifyPhoneModal } from '../components/common/VerifyPhoneModal';
import { SUPPORTED_CURRENCIES, COUNTRY_DEFAULTS } from '../utils/currency';
import { SUPPORTED_LANGUAGES, useI18n } from '../utils/i18n';
import apiClient from '../services/apiClient';
import { AutomaticSmsSettingsSection } from '../components/sms/AutomaticSmsSettingsSection';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const {
    country,
    currency,
    theme,
    timeZone,
    dateFormat,
    unitSystem,
    language,
    pushNotifications,
    emailAlerts,
    aiSuggestions,
    aiPredictions,
    aiRecipes,
    setCountry,
    setCurrency,
    setTheme,
    setLanguage,
    setTimeZone,
    setDateFormat,
    setUnitSystem,
    saveSettings,
  } = useSettingStore();

  const { t } = useI18n();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleCountryChange = (cCode: string) => {
    setCountry(cCode);
    const defaults = COUNTRY_DEFAULTS[cCode];
    if (defaults) {
      setCurrency(defaults.currency);
      setTimeZone(defaults.timeZone);
      setDateFormat(defaults.dateFormat);
      setUnitSystem(defaults.unitSystem);
    }
  };

  const handleCurrencyChange = (currCode: string) => {
    setCurrency(currCode);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await saveSettings();
      setSuccessMsg(t('common.saveChanges', 'Settings saved successfully!'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setDownloadingPDF(true);
    try {
      const res = await apiClient.get('/reports/monthly/pdf', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `HomeMind_Telemetry_Report_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" /> {t('nav.settings', 'App Settings')}
          </h1>
          <p className="text-xs text-secondary">
            Configure language, currency, regional defaults, appearance & smart suggestions
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{t('common.saveChanges', 'Save Changes')}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-500" /> {successMsg}
        </div>
      )}

      {/* Account & Verified Mobile Profile Card */}
      <div className="glass-panel p-6 border-primary/80 flex flex-col md:flex-row items-center justify-between gap-4 bg-panel/75 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || 'User'
              )}&background=3b82f6&color=fff`
            }
            alt="Avatar"
            className="w-14 h-14 rounded-2xl border border-blue-500/30 object-cover shadow-sm"
          />
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              {user?.name || 'Homeowner'}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 uppercase">
                {user?.role || 'OWNER'}
              </span>
            </h3>
            <p className="text-xs text-muted font-mono">{user?.email || 'Email Identity'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {user?.phoneNumber ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-mono font-bold">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>{user.phoneNumber}</span>
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-sans uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t('common.verified', 'Verified')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl text-xs w-full md:w-auto justify-between">
              <span className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-500" /> Mobile Not Verified
              </span>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                Verify It
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Automatic UPI & Bank Transaction Tracking Section */}
        <AutomaticSmsSettingsSection />

        {/* Section 1: Multi-Language & Country Configuration */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Language & Country Settings</h3>
              <p className="text-[11px] text-muted">Choose your preferred app language and currency</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Preferred Language Selector */}
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Display Language / भाषा चुनें
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-bold"
              >
                {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                  <option key={l.code} value={l.name}>
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Country & Region
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500"
              >
                {Object.values(COUNTRY_DEFAULTS).map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.countryName} ({c.currencySymbol} {c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Preferred Currency (12 Supported)
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-medium"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} — {curr.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-secondary/50 border border-primary/60 p-3 rounded-xl">
                <span className="text-[10px] text-muted block">Active Symbol</span>
                <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {SUPPORTED_CURRENCIES[currency]?.symbol || '$'}
                </span>
              </div>
              <div className="bg-secondary/50 border border-primary/60 p-3 rounded-xl">
                <span className="text-[10px] text-muted block">Measurement Unit</span>
                <span className="text-xs font-bold text-primary">{unitSystem} System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Regional & Theme Customization */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Visual Theme & Time</h3>
              <p className="text-[11px] text-muted">Theme appearance, time zone & date format</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">Visual Theme Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md'
                      : 'bg-secondary/60 border-primary/80 text-secondary'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                      : 'bg-secondary/60 border-primary/80 text-secondary'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light Mode
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">Time Zone</label>
                <input
                  type="text"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">Date Format</label>
                <input
                  type="text"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: AI Intelligence Options */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Smart AI Assistant Settings</h3>
              <p className="text-[11px] text-muted">Control automatic AI suggestions and recipe ideas</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-primary/60">
              <div>
                <span className="text-xs font-bold text-primary block">Smart Home Suggestions</span>
                <span className="text-[10px] text-muted">Suggest energy savings and bill warnings</span>
              </div>
              <input
                type="checkbox"
                checked={aiSuggestions}
                onChange={(e) => useSettingStore.setState({ aiSuggestions: e.target.checked })}
                className="w-4 h-4 rounded bg-background border-primary text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-primary/60">
              <div>
                <span className="text-xs font-bold text-primary block">Predictive Utility Forecasting</span>
                <span className="text-[10px] text-muted">Predict upcoming utility bills accurately</span>
              </div>
              <input
                type="checkbox"
                checked={aiPredictions}
                onChange={(e) => useSettingStore.setState({ aiPredictions: e.target.checked })}
                className="w-4 h-4 rounded bg-background border-primary text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-primary/60">
              <div>
                <span className="text-xs font-bold text-primary block">Zero-Waste Meal Recommendations</span>
                <span className="text-[10px] text-muted">Suggest quick recipes for expiring groceries</span>
              </div>
              <input
                type="checkbox"
                checked={aiRecipes}
                onChange={(e) => useSettingStore.setState({ aiRecipes: e.target.checked })}
                className="w-4 h-4 rounded bg-background border-primary text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Data Export & Privacy Control */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Data Export & Backup</h3>
              <p className="text-[11px] text-muted">Download home reports or reset records</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={downloadingPDF}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60"
            >
              {downloadingPDF ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Creating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Full Household PDF Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => alert('Purging household records requires Owner authorization.')}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4 text-red-500" /> Purge Household Records
            </button>
          </div>
        </div>
      </div>

      {/* Verify Phone Modal */}
      <VerifyPhoneModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
    </div>
  );
};

export default Settings;
