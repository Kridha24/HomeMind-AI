import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  LogIn,
  CreditCard,
  Home,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Activity,
  User,
  Heart,
  Smile,
  Zap,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { PhoneAuthModal } from '../../components/common/PhoneAuthModal';
import { EmailAuthModal } from '../../components/common/EmailAuthModal';
import { GoogleAuthModal } from '../../components/common/GoogleAuthModal';
import { NewUserOnboardingModal } from '../../components/common/NewUserOnboardingModal';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '154894572185-6f8oc2utef3ubc0v6k19v6c7mp0b1eoh.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const [authTab, setAuthTab] = useState<'NEW_USER' | 'EXISTING_USER'>('NEW_USER');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  // 3D Perspective & Cursor Tracking Coordinates (-1 to +1 normalized)
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [normPos, setNormPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('Google GSI init failed:', e);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // 3D Mouse Movement & Cursor-Responsive People Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    
    // Normalized coordinates from -1 (left/top) to +1 (right/bottom)
    const nx = (e.clientX - winW / 2) / (winW / 2);
    const ny = (e.clientY - winH / 2) / (winH / 2);
    setNormPos({ x: nx, y: ny });
    setMousePos({ x: e.clientX, y: e.clientY });

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setRotateX(-y / 25);
      setRotateY(x / 25);
    }
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setNormPos({ x: 0, y: 0 });
  };

  const handleGoogleCallback = async (response: any) => {
    setLoadingGoogle(true);
    setError('');

    try {
      const idToken = response.credential;
      const res = await apiClient.post('/auth/google', { idToken });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();

      if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
        setNewUserName(res.data.user.name || '');
        setShowOnboardingModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setShowGoogleModal(true);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const triggerGoogleAccountChooser = () => {
    setError('');

    // Try Google OAuth2 Native Popup Window with prompt: 'select_account'
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
        setLoadingGoogle(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch verified profile from Google OAuth2 API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                
                const res = await apiClient.post('/auth/google', {
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email.split('@')[0],
                  avatar: userInfo.picture,
                  googleId: 'google-' + userInfo.sub,
                });

                setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
                await fetchSettings();

                if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
                  setNewUserName(res.data.user.name || '');
                  setShowOnboardingModal(true);
                } else {
                  navigate('/');
                }
              } catch (err: any) {
                console.error('Google Auth backend error:', err);
                setShowGoogleModal(true);
              } finally {
                setLoadingGoogle(false);
              }
            } else {
              setLoadingGoogle(false);
              if (tokenResponse?.error !== 'popup_closed_by_user') {
                setShowGoogleModal(true);
              }
            }
          },
          error_callback: () => {
            setLoadingGoogle(false);
            setShowGoogleModal(true);
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('OAuth2 popup client error, falling back to modal:', e);
        setLoadingGoogle(false);
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleAuthSuccess = async (isNewReg?: boolean, userName?: string) => {
    setShowEmailModal(false);
    setShowPhoneModal(false);
    setShowGoogleModal(false);
    await fetchSettings();

    if (authTab === 'NEW_USER' && isNewReg) {
      setNewUserName(userName || '');
      setShowOnboardingModal(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none perspective-1000"
      style={{ perspective: '1000px' }}
    >
      {/* Dynamic Cursor Light Glow Halo */}
      <div
        className="fixed pointer-events-none rounded-full w-[500px] h-[500px] bg-blue-500/15 blur-3xl transition-opacity duration-300 z-0"
        style={{
          left: `${mousePos.x - 250}px`,
          top: `${mousePos.y - 250}px`,
        }}
      ></div>

      {/* ========================================================================= */}
      {/* REALISTIC ANIMATED SMART HOME ENVIRONMENT BACKGROUND LAYER */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out pointer-events-none opacity-40"
        style={{
          transform: `translate3d(${-normPos.x * 12}px, ${-normPos.y * 12}px, 0)`,
        }}
      >
        {/* Smart Living Room & Kitchen Illumination Gradients */}
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      {/* ========================================================================= */}
      {/* CURSOR-RESPONSIVE PEOPLE / FAMILY CHARACTERS (PEOPLE MOVE WITH CURSOR) */}
      {/* ========================================================================= */}

      {/* Person 1: Homeowner Avatar (Left Side - Follows Cursor) */}
      <div
        className="absolute top-28 left-20 hidden xl:flex flex-col items-center gap-2 pointer-events-none transition-transform duration-200 ease-out z-0"
        style={{
          transform: `translate3d(${normPos.x * 35}px, ${normPos.y * 25}px, 0) rotate(${normPos.x * 8}deg)`,
        }}
      >
        <div className="glass-panel px-3 py-1.5 border-emerald-500/30 bg-slate-900/80 rounded-2xl text-[10px] text-emerald-300 font-bold shadow-xl flex items-center gap-1.5 animate-bounce-slow">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>"Zero Demo Data • Full Isolation 🔒"</span>
        </div>

        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl shadow-blue-500/40 border border-blue-400/40 overflow-hidden flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt="Homeowner"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div
            className="absolute top-4 left-6 w-2.5 h-2.5 bg-blue-400 rounded-full blur-[1px] transition-transform duration-100"
            style={{
              transform: `translate(${normPos.x * 4}px, ${normPos.y * 4}px)`,
            }}
          ></div>
        </div>
        <span className="text-[11px] font-bold text-slate-300 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
          HomeMind Member
        </span>
      </div>

      {/* Person 2: Partner Avatar (Right Side - Follows Cursor) */}
      <div
        className="absolute top-28 right-20 hidden xl:flex flex-col items-center gap-2 pointer-events-none transition-transform duration-200 ease-out z-0"
        style={{
          transform: `translate3d(${normPos.x * 40}px, ${normPos.y * 30}px, 0) rotate(${-normPos.x * 8}deg)`,
        }}
      >
        <div className="glass-panel px-3 py-1.5 border-blue-500/30 bg-slate-900/80 rounded-2xl text-[10px] text-blue-300 font-bold shadow-xl flex items-center gap-1.5 animate-bounce-slow">
          <ShoppingBag className="w-3 h-3 text-emerald-400" />
          <span>"Multi-Currency (₹, $, €, £) 🌐"</span>
        </div>

        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 p-1 shadow-2xl shadow-purple-500/40 border border-purple-400/40 overflow-hidden flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
              alt="Partner"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div
            className="absolute top-4 left-6 w-2.5 h-2.5 bg-purple-400 rounded-full blur-[1px] transition-transform duration-100"
            style={{
              transform: `translate(${normPos.x * 4}px, ${normPos.y * 4}px)`,
            }}
          ></div>
        </div>
        <span className="text-[11px] font-bold text-slate-300 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
          Smart Household
        </span>
      </div>

      {/* ========================================================================= */}
      {/* MAIN 3D PERSPECTIVE GLASSMORPHISM LOGIN CARD */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl p-8 space-y-6 relative z-10 border border-slate-800/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-t border-slate-700/60"
      >
        {/* 3D Glowing Header Badge */}
        <div className="text-center space-y-3" style={{ transform: 'translateZ(30px)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40 border border-blue-400/30 hover:scale-110 transition-transform">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              HomeMind AI
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Intelligent Household Management Operating System
            </p>
          </div>
        </div>

        {/* 3D Animated Tab Switcher: New User vs Existing User */}
        <div
          className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner relative"
          style={{ transform: 'translateZ(20px)' }}
        >
          <button
            onClick={() => {
              setAuthTab('NEW_USER');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${
              authTab === 'NEW_USER'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> 🆕 New User (Sign Up)
          </button>
          <button
            onClick={() => {
              setAuthTab('EXISTING_USER');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${
              authTab === 'EXISTING_USER'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" /> 🔑 Existing User (Sign In)
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* 3D Interactive Action Buttons */}
        <div className="space-y-3 pt-1" style={{ transform: 'translateZ(25px)' }}>
          {/* Email Address OTP Button */}
          <button
            onClick={() => setShowEmailModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/25 border border-blue-400/30 transition-all group"
          >
            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>
              {authTab === 'NEW_USER'
                ? 'Continue with Email ID (OTP)'
                : 'Sign In with Email ID (OTP)'}
            </span>
          </button>

          {/* Mobile Phone SMS OTP Button */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/25 border border-emerald-400/30 transition-all group"
          >
            <Phone className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>
              {authTab === 'NEW_USER'
                ? 'Continue with Mobile Phone (SMS OTP)'
                : 'Sign In with Mobile Phone (SMS OTP)'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={triggerGoogleAccountChooser}
            disabled={loadingGoogle}
            className="w-full bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-xl transition-all border border-white/50 group"
          >
            {loadingGoogle ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {authTab === 'NEW_USER'
                ? 'Continue with Google Account'
                : 'Sign In with Google Account'}
            </span>
          </button>
        </div>

        {/* Security Footer */}
        <div
          className="pt-4 text-center text-[11px] text-slate-500 space-y-1.5 border-t border-slate-800/80"
          style={{ transform: 'translateZ(15px)' }}
        >
          <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Multi-Tenant Data Isolation
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">
            {authTab === 'NEW_USER'
              ? '✨ New User starts with 100% Clean Slate (0 Expenses, 0 Bills, 0 Groceries)'
              : '💾 Existing User automatically loads your permanently saved household data'}
          </p>
        </div>
      </div>

      {/* Modals */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        mode={authTab}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(isNew, name) => handleAuthSuccess(isNew, name)}
      />

      <EmailAuthModal
        isOpen={showEmailModal}
        mode={authTab}
        onClose={() => setShowEmailModal(false)}
        onSuccess={(isNew, name) => handleAuthSuccess(isNew, name)}
      />

      <PhoneAuthModal
        isOpen={showPhoneModal}
        mode={authTab}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(isNew, name) => handleAuthSuccess(isNew, name)}
      />

      <NewUserOnboardingModal
        isOpen={showOnboardingModal}
        initialName={newUserName}
        onComplete={() => {
          setShowOnboardingModal(false);
          navigate('/');
        }}
      />
    </div>
  );
};
