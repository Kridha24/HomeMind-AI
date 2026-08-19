import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, X, RefreshCw, Sparkles, KeyRound } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
  mode: 'NEW_USER' | 'EXISTING_USER';
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
}) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
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
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await apiClient.post('/auth/email/request-otp', { email });
      setStep('OTP');
      setTimeLeft(600);
      setResendCooldown(30);
      setInfoMessage(res.data.message || `Verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send email verification code.');
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

    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/email/verify-otp', {
        email,
        otp,
        name: name || undefined,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code. Please try again.');
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            {mode === 'NEW_USER' ? 'Sign Up with Email ID' : 'Sign In with Email ID'}
          </h2>
          <p className="text-xs text-slate-400">
            {step === 'EMAIL'
              ? 'Enter your email address to receive a secure 6-digit verification code.'
              : `Enter the 6-digit code sent to ${email}`}
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

        {/* Step 1: Email Form */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {mode === 'NEW_USER' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Your Full Name <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 border border-blue-400/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send 6-Digit Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">6-Digit Verification Code</label>
                <span className="text-[11px] font-mono text-slate-400">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
                  <span>Verify & Proceed to HomeMind</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="hover:text-slate-200 transition-colors"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={resendCooldown > 0 || loading}
                className="text-blue-400 hover:text-blue-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
