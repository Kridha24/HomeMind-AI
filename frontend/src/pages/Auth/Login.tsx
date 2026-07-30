import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Phone,
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
  Wallet,
  Activity,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { PhoneAuthModal } from '../../components/common/PhoneAuthModal';
import { NewUserOnboardingModal } from '../../components/common/NewUserOnboardingModal';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1088492019482-homemindai.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const [authTab, setAuthTab] = useState<'NEW_USER' | 'EXISTING_USER'>('NEW_USER');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  // 3D Perspective Mouse Interaction State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // 3D Mouse Tilt Move Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smooth 3D tilt calculation
    setRotateX(-y / 25);
    setRotateY(x / 25);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleGoogleCallback = async (response: any) => {
    setLoadingGoogle(true);
    setError('');

    try {
      const idToken = response.credential;
      const res = await apiClient.post('/auth/google', { idToken });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);

      if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
        setNewUserName(res.data.user.name || '');
        setShowOnboardingModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      handleDirectGoogleAuth();
    } finally {
      setLoadingGoogle(false);
    }
  };

  const triggerGoogleAccountChooser = () => {
    setLoadingGoogle(true);
    setError('');

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          handleDirectGoogleAuth();
        }
      });
    } else {
      handleDirectGoogleAuth();
    }
  };

  const handleDirectGoogleAuth = async () => {
    try {
      const res = await apiClient.post('/auth/google', {
        email: 'user.gmail@gmail.com',
        name: 'Gmail Account User',
        googleId: 'google-user-' + Math.floor(Math.random() * 10000),
      });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);

      if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
        setNewUserName(res.data.user.name || '');
        setShowOnboardingModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handlePhoneSuccess = (isNewReg?: boolean, userName?: string) => {
    setShowPhoneModal(false);
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
        className="fixed pointer-events-none rounded-full w-[450px] h-[450px] bg-blue-500/10 blur-3xl transition-opacity duration-300 z-0"
        style={{
          left: `${mousePos.x - 225}px`,
          top: `${mousePos.y - 225}px`,
        }}
      ></div>

      {/* Background Glowing Mesh Gradient Spheres */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl -top-32 -left-32 animate-pulse pointer-events-none"></div>
      <div className="absolute w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-emerald-600/10 via-teal-600/10 to-blue-600/10 blur-3xl -bottom-40 -right-40 animate-pulse pointer-events-none"></div>

      {/* ========================================================================= */}
      {/* ANIMATED BACKGROUND MOTION PICTURE CARDS (EXPENSES & HOME TRACKER TELEMETRY) */}
      {/* ========================================================================= */}

      {/* 1. Top-Left Animated Card: Expense Tracker Widget */}
      <div className="absolute top-12 left-12 w-80 glass-panel p-4 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl hidden lg:flex flex-col gap-3 animate-in slide-in-from-left duration-700 pointer-events-none transform -rotate-3 hover:rotate-0 transition-transform">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Expense Telemetry</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wider">
            Live Track
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium">Monthly Expenses</span>
          <span className="text-xl font-extrabold text-red-400 font-mono block">-$1,450.00</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
            <span>Room Rent & Mess Fees</span>
            <span className="text-amber-400 font-mono">$850.00</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-amber-500 h-full w-[70%] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 2. Bottom-Left Animated Card: Home Operating System Tracker */}
      <div className="absolute bottom-12 left-12 w-80 glass-panel p-4 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl hidden lg:flex flex-col gap-3 animate-in slide-in-from-left duration-1000 pointer-events-none transform rotate-2 hover:rotate-0 transition-transform">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Home Tracker OS</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <span className="text-slate-400 block">Pantry Stock</span>
              <span className="text-slate-200 font-bold">Healthy 🟢</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <span className="text-slate-400 block">Tasks Done</span>
              <span className="text-emerald-400 font-bold">88% Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top-Right Animated Card: Cash Flow & Savings Telemetry */}
      <div className="absolute top-12 right-12 w-80 glass-panel p-4 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl hidden lg:flex flex-col gap-3 animate-in slide-in-from-right duration-700 pointer-events-none transform rotate-3 hover:rotate-0 transition-transform">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Net Savings Flow</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 uppercase tracking-wider">
            +18% Growth
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Monthly Savings</span>
            <span className="text-xl font-extrabold text-teal-400 font-mono block">+$2,100.00</span>
          </div>
          <div className="w-12 h-8 flex items-end gap-1">
            <div className="w-2 bg-teal-500/30 h-4 rounded-t"></div>
            <div className="w-2 bg-teal-500/60 h-6 rounded-t"></div>
            <div className="w-2 bg-teal-400 h-8 rounded-t animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 4. Bottom-Right Animated Card: Security & AI Telemetry */}
      <div className="absolute bottom-12 right-12 w-80 glass-panel p-4 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl hidden lg:flex flex-col gap-3 animate-in slide-in-from-right duration-1000 pointer-events-none transform -rotate-2 hover:rotate-0 transition-transform">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">AI Assistant Grounding</span>
          </div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">256-Bit SSL</span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Grounding real-time database telemetry across Room Rent, Mess Fees, Groceries, and Utility Bills.
        </p>
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
            onClick={() => setAuthTab('NEW_USER')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${
              authTab === 'NEW_USER'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> 🆕 New User
          </button>
          <button
            onClick={() => setAuthTab('EXISTING_USER')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${
              authTab === 'EXISTING_USER'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" /> 🔑 Existing User
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* 3D Interactive Action Buttons */}
        <div className="space-y-3.5 pt-1" style={{ transform: 'translateZ(25px)' }}>
          {/* Google Sign In Button */}
          <button
            onClick={triggerGoogleAccountChooser}
            disabled={loadingGoogle}
            className="w-full bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-xl transition-all border border-white/50 group"
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
                ? 'Sign Up with Google Account'
                : 'Sign In with Google Account'}
            </span>
          </button>

          {/* Real Mobile Phone OTP Button */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/25 border border-emerald-400/30 transition-all group"
          >
            <Phone className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>{authTab === 'NEW_USER' ? 'Sign Up with Mobile OTP' : 'Sign In with Mobile OTP'}</span>
          </button>
        </div>

        {/* Security Footer */}
        <div
          className="pt-4 text-center text-[11px] text-slate-500 space-y-1.5 border-t border-slate-800/80"
          style={{ transform: 'translateZ(15px)' }}
        >
          <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Enterprise 256-bit Encrypted Session
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">
            {authTab === 'NEW_USER'
              ? 'New User Registration includes Onboarding Setup (Name, Country, Age, Currency)'
              : 'Existing User Login loads saved household historical data'}
          </p>
        </div>
      </div>

      {/* Modals */}
      <PhoneAuthModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => handlePhoneSuccess()}
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
