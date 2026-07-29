import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldCheck, X, RefreshCw } from 'lucide-react';
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

  const { setAuth } = useAuthStore();

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/phone/send-otp', { phoneNumber });
      setStep('OTP');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
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
            {step === 'PHONE' ? 'Sign in with Mobile Number' : 'Enter 6-Digit Verification Code'}
          </h3>
          <p className="text-xs text-slate-400">
            {step === 'PHONE'
              ? 'We will send a 6-digit OTP to verify your mobile number'
              : `OTP code sent to ${phoneNumber}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {error}
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
              Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[10px] text-slate-500 mt-1 text-center">Use code <span className="font-mono text-emerald-400">123456</span> for dev verification</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify OTP & Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
