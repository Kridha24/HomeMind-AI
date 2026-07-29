import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, ShieldCheck, X, RefreshCw, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [resendCooldown, setResendCooldown] = useState(0);

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
      const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber });
      setStep('OTP');
      setTimeLeft(300);
      setResendCooldown(60);
      setDevOtp(res.data.devOtp);
      setInfoMessage(res.data.message || `OTP sent to ${phoneNumber}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch SMS verification OTP');
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
      const res = await apiClient.post('/auth/phone/verify-otp', { phoneNumber, otp, name });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP code');
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
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">
            {step === 'PHONE' ? 'Sign in with Mobile Number' : 'Enter Real SMS 6-Digit Code'}
          </h3>
          <p className="text-xs text-slate-400">
            {step === 'PHONE'
              ? 'Enter your mobile number to receive a cryptographic SMS OTP'
              : `Verification SMS dispatched to ${phoneNumber}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-medium">
            {infoMessage}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
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
              Dispatch SMS Verification Code
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
              {devOtp && (
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Real Cryptographic Dev OTP: <strong className="font-mono text-emerald-400">{devOtp}</strong>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || timeLeft <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify OTP & Sign In
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-slate-400 hover:text-slate-200 text-[11px]"
              >
                Change Phone Number
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={() => handleSendOTP()}
                className="text-emerald-400 disabled:text-slate-500 hover:underline text-[11px] font-semibold"
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
