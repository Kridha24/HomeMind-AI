import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowRight, ShieldCheck, X, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
}

function toE164(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 10) return null;
  const ten = digits.slice(-10);
  if (ten.length !== 10) return null;
  return `+91${ten}`;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [localNumber, setLocalNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [e164, setE164] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!isOpen) {
      setStep('PHONE');
      setLocalNumber('');
      setOtp('');
      setName('');
      setError('');
      setInfoMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    let cooldownTimer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'OTP') otpInputRef.current?.focus();
  }, [step]);

  if (!isOpen) return null;

  const sendOtp = async (phone: string) => {
    const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: phone });
    setE164(phone);
    setStep('OTP');
    setTimeLeft(300);
    setResendCooldown(30);
    setOtp('');
    setInfoMessage(res.data.message || `Code sent to ${phone}`);
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = toE164(localNumber);
    if (!phone) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await sendOtp(phone);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit code from SMS.');
      return;
    }
    if (timeLeft <= 0) {
      setError('Code expired. Request a new one.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber: e164,
        otp,
        name: name.trim() || undefined,
      });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-primary tracking-tight">
            {step === 'PHONE' ? 'Continue with phone' : 'Enter OTP'}
          </h2>
          <p className="text-xs text-muted">
            {step === 'PHONE'
              ? 'We will send a 6-digit SMS code. Same number = same account.'
              : `Sent to ${e164}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {infoMessage && !error && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-xl text-center font-medium">
            {infoMessage}
          </div>
        )}

        {step === 'PHONE' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Your name <span className="text-muted">(new accounts)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                autoComplete="name"
                className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-sm text-primary placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">Mobile number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-xl bg-background border border-primary text-sm font-semibold text-primary">
                  +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  maxLength={10}
                  value={localNumber}
                  onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 min-w-0 bg-background border border-primary rounded-xl px-4 py-3 text-sm text-primary placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || localNumber.length !== 10}
              className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-secondary">6-digit code</label>
                <span className="text-[11px] font-mono text-muted">
                  Expires <strong className="text-amber-400">{formatTime(timeLeft)}</strong>
                </span>
              </div>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-center text-lg tracking-[0.4em] font-mono text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify and continue</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-primary/80">
              <button type="button" onClick={() => { setStep('PHONE'); setError(''); }} className="hover:text-primary min-h-[44px]">
                Change number
              </button>
              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={resendCooldown > 0 || loading}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed min-h-[44px]"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
