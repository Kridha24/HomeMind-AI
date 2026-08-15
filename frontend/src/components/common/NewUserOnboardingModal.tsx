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
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { COUNTRY_DEFAULTS } from '../../utils/currency';
import { useSettingStore } from '../../stores/useSettingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';
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

  // Mobile Phone Verification States
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user?.phoneNumber);
  const [devPhoneOtp, setDevPhoneOtp] = useState('');
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifierRef = React.useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
      setIsPhoneVerified(true);
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

  const handleSendPhoneOTP = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setError('Please enter a valid mobile phone number.');
      return;
    }

    setSendingPhoneOtp(true);
    setError('');
    setPhoneSuccessMsg('');
    setDevPhoneOtp('');

    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${currentCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      if ((import.meta as any).env?.VITE_FIREBASE_API_KEY && auth) {
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) {}
          recaptchaVerifierRef.current = null;
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'onboarding-recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try sending OTP again.');
          },
        });

        const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
        setConfirmationResult(confirmation);
        setIsPhoneOtpSent(true);
        setPhoneSuccessMsg(`SMS verification code sent to ${fullPhone}`);
      } else {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: fullPhone });
        setIsPhoneOtpSent(true);
        setPhoneSuccessMsg(`SMS verification code sent to ${fullPhone}`);
        if (res.data.devOtp) {
          setDevPhoneOtp(res.data.devOtp);
        }
      }
    } catch (err: any) {
      try {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: fullPhone });
        setIsPhoneOtpSent(true);
        setPhoneSuccessMsg(`SMS verification code sent to ${fullPhone}`);
        if (res.data.devOtp) {
          setDevPhoneOtp(res.data.devOtp);
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Failed to send mobile verification SMS.');
      }
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      setError('Please enter the 6-digit SMS OTP code.');
      return;
    }

    setVerifyingPhoneOtp(true);
    setError('');

    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${currentCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(phoneOtp);
      }

      await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber: fullPhone,
        otp: phoneOtp,
        name,
        country,
        currency,
      });

      setIsPhoneVerified(true);
      setIsPhoneOtpSent(false);
      setPhoneSuccessMsg(`✅ Mobile Number ${fullPhone} verified successfully!`);
    } catch (err: any) {
      try {
        await apiClient.post('/auth/phone/verify-otp', {
          phoneNumber: fullPhone,
          otp: phoneOtp,
          name,
          country,
          currency,
        });

        setIsPhoneVerified(true);
        setIsPhoneOtpSent(false);
        setPhoneSuccessMsg(`✅ Mobile Number ${fullPhone} verified successfully!`);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Invalid mobile OTP code.');
      }
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !country || !currency) {
      setError('Please fill in all profile fields.');
      return;
    }

    if (!isPhoneVerified) {
      setError('Please verify your mobile phone number before continuing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${currentCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;

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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div id="onboarding-recaptcha-container"></div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Complete Household Setup</h2>
          <p className="text-xs text-slate-400">Verify your profile & mobile number to activate HomeMind AI.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {phoneSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {phoneSuccessMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name Field */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> Full Name <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mihir Shekhar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
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
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Preferred Household Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
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

          {/* ========================================================================= */}
          {/* MANDATORY MOBILE NUMBER VERIFICATION SECTION */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number Verification <span className="text-cyan-400">*</span>
              </label>
              {isPhoneVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Phone Verified
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Verification Required
                </span>
              )}
            </div>

            {!isPhoneVerified ? (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono flex items-center">
                    {currentCountry.dialCode}
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g. 8340496912"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isPhoneOtpSent}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                  {!isPhoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={sendingPhoneOtp || !phoneNumber}
                      className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                    >
                      {sendingPhoneOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                      <span>Send SMS OTP</span>
                    </button>
                  )}
                </div>

                {isPhoneOtpSent && (
                  <div className="space-y-2 animate-in fade-in">
                    {devPhoneOtp && (
                      <div
                        onClick={() => setPhoneOtp(devPhoneOtp)}
                        className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center cursor-pointer hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-semibold">
                          Dev SMS OTP: <strong className="font-mono text-emerald-200 tracking-wider underline">{devPhoneOtp}</strong> (Click to autofill)
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit SMS OTP"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOTP}
                        disabled={verifyingPhoneOtp || phoneOtp.length < 6}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                      >
                        {verifyingPhoneOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>Verify SMS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhoneOtpSent(false);
                          setPhoneOtp('');
                        }}
                        className="px-2.5 py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-mono font-semibold flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> {phoneNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneVerified(false);
                    setIsPhoneOtpSent(false);
                    setPhoneOtp('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                >
                  Edit Number
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPhoneVerified}
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

