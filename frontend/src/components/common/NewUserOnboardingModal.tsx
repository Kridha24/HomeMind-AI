import React, { useState } from 'react';
import { User, Globe, Calendar, DollarSign, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { COUNTRY_DEFAULTS } from '../../utils/currency';
import { useSettingStore } from '../../stores/useSettingStore';
import apiClient from '../../services/apiClient';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: () => void;
}

const COUNTRY_OPTIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY' },
];

export const NewUserOnboardingModal: React.FC<NewUserOnboardingModalProps> = ({
  isOpen,
  initialName = '',
  onComplete,
}) => {
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState('IN');
  const [age, setAge] = useState<string>('28');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchSettings } = useSettingStore();

  if (!isOpen) return null;

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const defaults = COUNTRY_DEFAULTS[selectedCountry];
    if (defaults) {
      setCurrency(defaults.currency);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !country || !currency) {
      setError('Please fill in all onboarding fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.put('/auth/profile', {
        name,
        age: age ? parseInt(age, 10) : undefined,
        country,
        currency,
      });

      await fetchSettings();
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Welcome to HomeMind AI!</h2>
          <p className="text-xs text-slate-400">Complete your quick profile & household setup to get started.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Age Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" /> Age
              </label>
              <input
                type="number"
                min={18}
                max={120}
                required
                placeholder="28"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Country Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Country
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Currency Field */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Preferred Household Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
            >
              <option value="INR">₹ INR - Indian Rupee</option>
              <option value="USD">$ USD - US Dollar</option>
              <option value="EUR">€ EUR - Euro</option>
              <option value="GBP">£ GBP - British Pound</option>
              <option value="JPY">¥ JPY - Japanese Yen</option>
              <option value="CAD">C$ CAD - Canadian Dollar</option>
              <option value="AUD">A$ AUD - Australian Dollar</option>
              <option value="SGD">S$ SGD - Singapore Dollar</option>
              <option value="AED">د.إ AED - UAE Dirham</option>
              <option value="SAR">﷼ SAR - Saudi Riyal</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CNY">¥ CNY - Chinese Yuan</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all mt-4"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Save & Open Command Center Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
