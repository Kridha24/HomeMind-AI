import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowRight, ShieldCheck, X, RefreshCw, KeyRound } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
  mode?: 'NEW_USER' | 'EXISTING_USER';
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'NEW_USER',
}) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifierRef = useRef<any>(null);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    let cooldownTimer: any;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your mobile phone number.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
      const formattedPhone = phoneNumber.startsWith('+')
        ? `+${cleanDigits}`
        : cleanDigits.startsWith('91') && cleanDigits.length === 12
        ? `+${cleanDigits}`
        : `+91${cleanDigits.replace(/^0+/, '')}`;

      if (import.meta.env.VITE_FIREBASE_API_KEY && auth) {
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) {}
          recaptchaVerifierRef.current = null;
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try sending OTP again.');
          },
        });

        console.log(`[Firebase Phone Auth] Requesting SMS OTP for formatted number: ${formattedPhone}`);
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
        setConfirmationResult(confirmation);
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(`SMS verification code sent to ${formattedPhone}`);
      } else {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: formattedPhone });
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(res.data.message || `SMS verification code sent to ${formattedPhone}`);
      }
    } catch (err: any) {
      console.error('[Firebase Phone Auth Error]:', err.code, err.message);
      try {
        const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
        const formattedPhone = phoneNumber.startsWith('+')
          ? `+${cleanDigits}`
          : cleanDigits.startsWith('91') && cleanDigits.length === 12
          ? `+${cleanDigits}`
          : `+91${cleanDigits.replace(/^0+/, '')}`;

        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: formattedPhone });
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(res.data.message || `SMS verification code sent to ${formattedPhone}`);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Failed to send SMS OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit code.');
      return;
    }
    if (timeLeft <= 0) {
      setError('OTP has expired after 5 minutes. Please request a new OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }

      const res = await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber,
        otp,
        name: name || undefined,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      try {
        const res = await apiClient.post('/auth/phone/verify-otp', {
          phoneNumber,
          otp,
          name: name || undefined,
        });

        setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
        onSuccess(res.data.isNewRegistration, res.data.user?.name);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Invalid OTP code');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div id="recaptcha-container"></div>
      <div className="bg-panel border border-primary rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-primary tracking-tight">
            {mode === 'NEW_USER' ? 'Sign Up with Mobile OTP' : 'Sign In with Mobile OTP'}
          </h2>
          <p className="text-xs text-muted">
            {step === 'PHONE'
              ? 'Enter your mobile number with country code (e.g. +91 98765 43210).'
              : `Enter the 6-digit code sent via SMS to ${phoneNumber}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {infoMessage}
          </div>
        )}

        {/* Step 1: Phone Form */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {mode === 'NEW_USER' && (
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">
                  Your Full Name <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-xs text-primary placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Mobile Phone Number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-xs text-primary placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-400/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send SMS Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-secondary">6-Digit SMS Code</label>
                <span className="text-[11px] font-mono text-muted">
                  Expires in: <strong className="text-amber-400">{formatTime(timeLeft)}</strong>
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-primary placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-400/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Open HomeMind</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-primary/80">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="hover:text-primary transition-colors"
              >
                ← Change Number
              </button>

              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={resendCooldown > 0 || loading}
                className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend SMS in ${resendCooldown}s` : 'Resend SMS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
