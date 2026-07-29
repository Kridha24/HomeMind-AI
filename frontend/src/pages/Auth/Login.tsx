import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { PhoneAuthModal } from '../../components/common/PhoneAuthModal';

export const Login: React.FC = () => {
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');

    try {
      // Simulate Google OAuth Token Payload Callback
      const googlePayload = {
        token: 'google-oauth2-access-token',
        googleId: 'g_' + Math.random().toString(36).substring(2, 10),
        email: 'alex.rivera@gmail.com',
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };

      const res = await apiClient.post('/auth/google', googlePayload);
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Authentication failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -top-32 -left-32 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -bottom-32 -right-32 pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 space-y-6 relative z-10 border-slate-800 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">HomeMind AI</h1>
          <p className="text-xs text-slate-400">Intelligent Household Operating System</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-blue-500/50 text-slate-100 font-semibold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-lg transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.1 0-5.74-2.09-6.68-4.91H1.36v3.15C3.34 21.28 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.36C.49 8.31 0 10.1 0 12s.49 3.69 1.36 5.42l3.96-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.34 2.72 1.36 6.58l3.96 3.15c.94-2.82 3.58-4.98 6.68-4.98z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Mobile Phone OTP Button */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Continue with Mobile Number
          </button>
        </div>

        <div className="pt-4 text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1 font-semibold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Multi-Tenant Data Isolation
          </p>
          <p className="text-[10px] text-slate-500">Every account starts with an isolated Household context.</p>
        </div>
      </div>

      <PhoneAuthModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => navigate('/')}
      />
    </div>
  );
};
