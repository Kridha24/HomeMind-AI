import React, { useState, useEffect } from 'react';
import {
  User,
  Globe,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { COUNTRY_DEFAULTS } from '../../utils/currency';
import { useSettingStore } from '../../stores/useSettingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import apiClient from '../../services/apiClient';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: () => void;
}

const COUNTRY_OPTIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', dialCode: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', dialCode: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', dialCode: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', dialCode: '+81' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', dialCode: '+61' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', dialCode: '+65' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', dialCode: '+966' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', dialCode: '+41' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', dialCode: '+86' },
];

export const NewUserOnboardingModal: React.FC<NewUserOnboardingModalProps> = ({
  isOpen,
  initialName = '',
  onComplete,
}) => {
  const { user, updateUser } = useAuthStore();
  const { fetchSettings, setCurrency: setStoreCurrency, setCountry: setStoreCountry } = useSettingStore();

  const [name, setName] = useState(initialName || user?.name || '');
  const [country, setCountry] = useState('IN');
  const [age, setAge] = useState<string>('28');
  const [currency, setCurrency] = useState('INR');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user]);

  if (!isOpen) return null;

  const currentCountry = COUNTRY_OPTIONS.find((c) => c.code === country) || COUNTRY_OPTIONS[0];

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
      setError('Please fill in your name and country preferences.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = phoneNumber ? (phoneNumber.startsWith('+') ? phoneNumber : `${currentCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`) : undefined;

      await apiClient.put('/auth/profile', {
        name,
        age: age ? parseInt(age, 10) : undefined,
        phoneNumber: fullPhone,
        country,
        currency,
      });

      updateUser({
        name,
        age: age ? parseInt(age, 10) : undefined,
        phoneNumber: fullPhone,
      });

      setStoreCountry(country);
      setStoreCurrency(currency);
      await fetchSettings();
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div id="onboarding-recaptcha-container"></div>
      <div className="bg-panel border border-primary rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-primary tracking-tight">Complete Household Setup</h2>
          <p className="text-xs text-muted">Verify your profile & mobile number to activate HomeMind AI.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name Field */}
          <div>
            <label className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> Full Name <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Age Field */}
            <div>
              <label className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-1">
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
                className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Country Field */}
            <div>
              <label className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Country
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Currency Field */}
          <div>
            <label className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Preferred Household Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-amber-500"
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

          {/* Optional Phone Field */}
          <div>
            <label className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number <span className="text-muted">(Optional)</span>
            </label>
            <div className="flex gap-2">
              <div className="bg-background border border-primary rounded-xl px-3 py-2 text-xs text-muted font-mono flex items-center">
                {currentCountry.dialCode}
              </div>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-background border border-primary rounded-xl px-3.5 py-2 text-xs text-primary font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all mt-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Save & Open Command Center Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

