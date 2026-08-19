import React, { useState, useRef, useEffect } from 'react';
import { Phone, ShieldCheck, X, RefreshCw, CheckCircle2, KeyRound, ArrowRight } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';

interface VerifyPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: string) => void;
}

export const VerifyPhoneModal: React.FC<VerifyPhoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [dialCode, setDialCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifierRef = useRef<any>(null);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${dialCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY && auth) {
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) {}
          recaptchaVerifierRef.current = null;
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'verify-phone-recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try sending OTP again.');
          },
        });

        const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
        setConfirmationResult(confirmation);
        setStep('OTP');
        setSuccessMsg(`SMS verification code sent to ${fullPhone}`);
      } else {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: fullPhone });
        setStep('OTP');
        setSuccessMsg(`SMS verification code sent to ${fullPhone}`);
      }
    } catch (err: any) {
      try {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: fullPhone });
        setStep('OTP');
        setSuccessMsg(`SMS verification code sent to ${fullPhone}`);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Failed to send SMS OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${dialCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }

      await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber: fullPhone,
        otp,
      });

      await apiClient.put('/auth/profile', {
        phoneNumber: fullPhone,
      });

      updateUser({ phoneNumber: fullPhone });
      if (onSuccess) onSuccess(fullPhone);
      setSuccessMsg('✅ Mobile number verified and saved to profile successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      try {
        await apiClient.post('/auth/phone/verify-otp', {
          phoneNumber: fullPhone,
          otp,
        });

        await apiClient.put('/auth/profile', {
          phoneNumber: fullPhone,
        });

        updateUser({ phoneNumber: fullPhone });
        if (onSuccess) onSuccess(fullPhone);
        setSuccessMsg('✅ Mobile number verified and saved to profile successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Invalid OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div id="verify-phone-recaptcha-container"></div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/30">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Verify Mobile Number</h2>
          <p className="text-xs text-slate-400">
            {step === 'PHONE'
              ? 'Link your mobile phone number to your HomeMind profile for SMS alerts.'
              : `Enter the 6-digit SMS verification code`}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {successMsg}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Mobile Number <span className="text-cyan-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+49">🇩🇪 +49</option>
                </select>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 8340496912"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              <span>Send SMS Verification Code</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                6-Digit SMS Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify & Save to Profile</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Change Phone Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
