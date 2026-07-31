import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowRight, ShieldCheck, X, RefreshCw, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
    if (!phoneNumber) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      // Check if Firebase Auth is configured in environment
      if ((import.meta as any).env?.VITE_FIREBASE_API_KEY) {
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }

        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
        setConfirmationResult(confirmation);
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(`Firebase 100% Free Real SMS sent to ${formattedPhone}`);
      } else {
        // Fallback to Backend SMS Endpoint
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber });
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(res.data.message || `SMS verification code sent to ${phoneNumber}`);
      }
    } catch (err: any) {
      // If Firebase recaptcha fails or falls back
      try {
        const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber });
        setStep('OTP');
        setTimeLeft(300);
        setResendCooldown(30);
        setInfoMessage(res.data.message || `SMS verification code sent to ${phoneNumber}`);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.error || err.message || 'Failed to send SMS OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    if (timeLeft <= 0) {
      setError('OTP has expired after 5 minutes. Please request a new OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (confirmationResult) {
        // Confirm Firebase OTP
        await confirmationResult.confirm(otp);
      }

      // Sync user with backend
      const res = await apiClient.post('/auth/phone/verify-otp', { phoneNumber, otp, name });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      // Fallback backend verification
      try {
        const res = await apiClient.post('/auth/phone/verify-otp', { phoneNumber, otp, name });
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        <div id="recaptcha-container"></div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Firebase Real SMS Verification</h3>
            <p className="text-xs text-slate-400">10,000 100% Free SMS Monthly Worldwide</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-medium">
            {infoMessage}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Phone Number (Include Country Code)</label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name (For Household Setup)</label>
              <input
                type="text"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Send Firebase Free Real SMS Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">6-Digit SMS Code</label>
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(timeLeft)}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="──────"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || timeLeft <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify SMS OTP & Continue
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-slate-400 hover:text-white"
              >
                Change Number
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleSendOTP()}
                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 font-semibold"
              >
                {resendCooldown > 0 ? `Resend SMS in ${resendCooldown}s` : 'Resend SMS Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
