import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, CheckCircle2, Lock, Unlock, ArrowRight } from 'lucide-react';

interface HomeEntryTransitionProps {
  userName?: string;
  onFinish: () => void;
}

type TransitionPhase =
  | 'authSuccess' // 0 - 400ms: Auth confirmed, greeting
  | 'approaching' // 400 - 950ms: Camera moves toward entrance
  | 'unlocking'   // 950 - 1300ms: Smart lock pulses green
  | 'doorOpening' // 1300 - 1800ms: Door opens inward in 3D
  | 'entering'    // 1800 - 2250ms: Camera enters through doorway into warm interior light
  | 'complete';

export const HomeEntryTransition: React.FC<HomeEntryTransitionProps> = ({
  userName,
  onFinish,
}) => {
  const [phase, setPhase] = useState<TransitionPhase>('authSuccess');
  const [skipped, setSkipped] = useState(false);
  const finishedRef = useRef(false);

  const firstName = userName ? userName.trim().split(' ')[0] : 'there';

  const handleComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 250);
      return () => clearTimeout(timer);
    }

    const t1 = setTimeout(() => setPhase('approaching'), 400);
    const t2 = setTimeout(() => setPhase('unlocking'), 950);
    const t3 = setTimeout(() => setPhase('doorOpening'), 1300);
    const t4 = setTimeout(() => setPhase('entering'), 1800);
    const t5 = setTimeout(() => {
      setPhase('complete');
      handleComplete();
    }, 2250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleSkip = () => {
    setSkipped(true);
    handleComplete();
  };

  if (skipped) return null;

  const isUnlocked = phase === 'unlocking' || phase === 'doorOpening' || phase === 'entering' || phase === 'complete';
  const isDoorOpen = phase === 'doorOpening' || phase === 'entering' || phase === 'complete';
  const isEntering = phase === 'entering' || phase === 'complete';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#070B16] text-white flex items-center justify-center select-none font-sans"
      aria-live="polite"
      aria-label="Entering HomeMind smart home"
    >
      {/* ── SKIP BUTTON (Unobtrusive) ── */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-5 z-40 px-3.5 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 group"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* ── AMBIENT ATMOSPHERE BACKDROP ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('/cinematic-home-night.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B16] via-[#070B16]/80 to-[#070B16]/95" />
      </div>

      {/* ── CAMERA / ENTRANCE SCENE CONTAINER (Scales smoothly to simulate physical approach) ── */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-700 ease-out ${
          isEntering
            ? 'scale-[1.7] opacity-0 blur-sm pointer-events-none'
            : isDoorOpen
            ? 'scale-[1.18]'
            : phase === 'approaching' || phase === 'unlocking'
            ? 'scale-105'
            : 'scale-100'
        }`}
        style={{ perspective: '1400px' }}
      >
        {/* ── TOP GREETING BANNER ── */}
        <div
          className={`absolute top-12 sm:top-16 text-center space-y-2 transition-all duration-500 z-20 ${
            phase === 'authSuccess' || phase === 'approaching'
              ? 'opacity-100 translate-y-0'
              : 'opacity-40 -translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authentication successful</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome home, {firstName}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Getting your home ready…
          </p>
        </div>

        {/* ── MODERN SMART HOME ENTRANCE PORCH ── */}
        <div className="relative w-[340px] sm:w-[420px] h-[520px] sm:h-[580px] rounded-t-[36px] bg-[#0d1529]/90 border border-white/10 shadow-2xl shadow-black/80 flex flex-col items-center justify-end p-6 overflow-hidden mt-10">
          
          {/* Architectural Wall Sconces & Ambient Light */}
          <div className="absolute top-12 left-4 w-3 h-10 rounded-full bg-amber-400/80 shadow-[0_0_25px_10px_rgba(245,158,11,0.5)]" />
          <div className="absolute top-12 right-4 w-3 h-10 rounded-full bg-amber-400/80 shadow-[0_0_25px_10px_rgba(245,158,11,0.5)]" />
          
          {/* Glass Side-Panels with warm interior glimpse */}
          <div className="absolute inset-y-8 left-8 w-10 bg-amber-500/10 border-r border-white/10 backdrop-blur-sm" />
          <div className="absolute inset-y-8 right-8 w-10 bg-amber-500/10 border-l border-white/10 backdrop-blur-sm" />

          {/* ── DOORWAY FRAME (Contains the 3D rotating door & interior light bloom) ── */}
          <div
            className="relative w-[210px] sm:w-[240px] h-[400px] sm:h-[450px] bg-black/60 rounded-t-2xl border-4 border-[#1e293b] shadow-inner overflow-visible"
            style={{ perspective: '1100px' }}
          >
            {/* INTERIOR LIGHT BLOOM (Revealed inside when door opens) */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-amber-400 via-amber-200 to-indigo-300 rounded-t-xl transition-all duration-700 ease-in-out flex flex-col items-center justify-center text-center p-4 ${
                isDoorOpen
                  ? 'opacity-100 shadow-[0_0_80px_35px_rgba(251,191,36,0.7)]'
                  : 'opacity-0'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-white/30 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-lg">
                <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
              </div>
              <span className="text-xs font-black text-amber-950 tracking-wider uppercase">
                Home Connected
              </span>
              <span className="text-[10px] text-amber-900 font-semibold">
                Entering workspace…
              </span>
            </div>

            {/* ── 3D PHYSICAL WOODEN FRONT DOOR ── */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#2e1d14] via-[#3d271b] to-[#1c120c] rounded-t-xl border border-amber-900/40 shadow-2xl flex flex-col justify-between p-5 origin-left transition-transform duration-700 ease-out"
              style={{
                transformOrigin: 'left center',
                transform: isDoorOpen ? 'rotateY(-82deg)' : 'rotateY(0deg)',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Vertical Wood Slat Texture lines */}
              <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-20">
                <div className="w-px h-full bg-white" />
                <div className="w-px h-full bg-black" />
                <div className="w-px h-full bg-white" />
                <div className="w-px h-full bg-black" />
              </div>

              {/* Door Top Header: Modern HomeMind Crest */}
              <div className="flex items-center justify-between relative z-10">
                <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[9px] font-bold text-amber-200/60 uppercase tracking-widest">
                  HomeMind OS
                </span>
              </div>

              {/* CENTER: SMART LOCK MOMENT */}
              <div className="flex flex-col items-center justify-center space-y-2 relative z-10 py-6">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
                    isUnlocked
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_25px_5px_rgba(16,185,129,0.4)] scale-110'
                      : 'bg-indigo-500/20 border-2 border-indigo-400/60 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                  }`}
                >
                  {isUnlocked ? (
                    <Unlock className="w-6 h-6 text-emerald-400 animate-in zoom-in-75 duration-300" />
                  ) : (
                    <Lock className="w-6 h-6 text-indigo-300" />
                  )}
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 ${
                    isUnlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                      : 'bg-black/50 text-slate-400 border border-white/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isUnlocked ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'
                    }`}
                  />
                  <span>{isUnlocked ? 'Home verified' : 'Verifying…'}</span>
                </div>
              </div>

              {/* Modern Brushed Brass Door Handle */}
              <div className="self-end mr-1 w-2.5 h-20 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 shadow-md relative z-10" />
            </div>
          </div>

          {/* Porch Welcome Mat */}
          <div className="w-[180px] h-3 bg-[#1e293b] rounded-full mt-3 border border-white/10 opacity-70 shadow-md" />
        </div>
      </div>

      {/* ── EXPANDING INTERIOR BLOOM ON ENTERING ── */}
      <div
        className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-700 ease-in-out ${
          isEntering ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-tr from-[#070B16] via-indigo-950/70 to-amber-500/30 backdrop-blur-md`}
      />
    </div>
  );
};
