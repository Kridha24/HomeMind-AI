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
} from 'lucide-react';
import { useSettingStore } from '../stores/useSettingStore';
import { useAuthStore } from '../stores/useAuthStore';
import { VerifyPhoneModal } from '../components/common/VerifyPhoneModal';
import { SUPPORTED_CURRENCIES, COUNTRY_DEFAULTS } from '../utils/currency';
import apiClient from '../services/apiClient';

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
    aiOcr,
    setCountry,
    setCurrency,
    setTheme,
    updateSettings,
    fetchSettings,
  } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCountryChange = (cCode: string) => {
    setCountry(cCode);
    setSuccessMsg(`Country updated to ${COUNTRY_DEFAULTS[cCode]?.countryName || cCode}. Currency & regional defaults configured!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCurrencyChange = (currCode: string) => {
    setCurrency(currCode);
    setSuccessMsg(`Currency updated to ${currCode} (${SUPPORTED_CURRENCIES[currCode]?.symbol}). Entire application updated!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await updateSettings({
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
      aiOcr,
    });
    setSaving(false);
    setSuccessMsg('Household settings saved successfully to cloud database!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" /> Household Settings & Multi-Currency Engine
          </h1>
          <p className="text-xs text-muted">Configure household currency, regional defaults, AI features & privacy</p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl text-xs shadow-lg shadow-blue-600/25 transition-all"
        >
          {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" /> {successMsg}
        </div>
      )}

      {/* Account & Verified Mobile Profile Card */}
      <div className="glass-panel p-6 border-primary flex flex-col md:flex-row items-center justify-between gap-4 bg-panel/60">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
            alt="Avatar"
            className="w-14 h-14 rounded-2xl border border-blue-500/30 object-cover"
          />
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              {user?.name || 'Homeowner'}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">
                {user?.role || 'OWNER'}
              </span>
            </h3>
            <p className="text-xs text-muted font-mono">{user?.email || 'Email Identity'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {user?.phoneNumber ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs text-emerald-300 font-mono font-bold">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{user.phoneNumber}</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-sans uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-xs w-full md:w-auto justify-between">
              <span className="text-amber-300 font-medium flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-400" /> Mobile Not Verified
              </span>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Verify It
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Country & Multi-Currency Engine */}
        <div className="glass-panel p-6 space-y-5 border-primary">
          <div className="flex items-center gap-3 border-b border-primary pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Multi-Currency & Country Configuration</h3>
              <p className="text-[11px] text-muted">Updates all prices, reports, forecasts & AI context instantly</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">Primary Household Country</label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500/50"
              >
                {Object.values(COUNTRY_DEFAULTS).map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.countryName} ({c.currencySymbol} {c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">Preferred Currency (12 Supported)</label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500/50 font-medium"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} — {curr.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-background/40 border border-primary/60 p-3 rounded-xl">
                <span className="text-[10px] text-muted block">Active Symbol</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {SUPPORTED_CURRENCIES[currency]?.symbol || '$'}
                </span>
              </div>
              <div className="bg-background/40 border border-primary/60 p-3 rounded-xl">
                <span className="text-[10px] text-muted block">Measurement Unit</span>
                <span className="text-xs font-bold text-primary">{unitSystem} System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Regional & System Preferences */}
        <div className="glass-panel p-6 space-y-5 border-primary">
          <div className="flex items-center gap-3 border-b border-primary pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Regional & Theme Customization</h3>
              <p className="text-[11px] text-muted">Time zone, date format & visual theme interface</p>
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
                      : 'bg-background border-primary text-muted'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md'
                      : 'bg-background border-primary text-muted'
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
                  onChange={(e) => useSettingStore.setState({ timeZone: e.target.value })}
                  className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">Date Format</label>
                <input
                  type="text"
                <label className="text-xs font-semibold text-secondary block mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => useSettingStore.setState({ currency: e.target.value })}
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-4 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                    <option key={code} value={code}>
                      {code} ({SUPPORTED_CURRENCIES[code].symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">Unit System</label>
                <select
                  value={unitSystem}
                  onChange={(e) => useSettingStore.setState({ unitSystem: e.target.value as any })}
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-4 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="METRIC">Metric (kg, L, km)</option>
                  <option value="IMPERIAL">Imperial (lbs, gal, mi)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Appearance & Theme */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">Interface Theme</h3>
              <p className="text-[11px] text-muted">Select your visual display appearance</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'glass', label: 'OLED Glass', icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => useSettingStore.setState({ theme: t.id as any })}
                  className={`p-3.5 rounded-2xl border text-center space-y-2 transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500 shadow-sm'
                      : 'bg-secondary/60 text-secondary border-primary/80 hover:border-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto" />
                  <span className="text-xs font-bold block">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: AI Intelligence Options */}
        <div className="glass-panel p-6 space-y-4 border-primary/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">AI Autopilot & Suggestions</h3>
              <p className="text-[11px] text-muted">Control automated AI telemetry and recipe matching</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-primary/60">
              <div>
                <span className="text-xs font-bold text-primary block">Proactive AI Recommendations</span>
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
                <span className="text-xs font-bold text-primary block">Zero-Waste Meal Recommendations</span>
                <span className="text-[10px] text-muted">Inventory expiry matching recipes</span>
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
              <h3 className="font-bold text-sm text-primary">Data Export & Privacy Controls</h3>
              <p className="text-[11px] text-muted">Download telemetry backups or purge household records</p>
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
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Full Household Telemetry PDF</span>
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
      <VerifyPhoneModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  );
};
