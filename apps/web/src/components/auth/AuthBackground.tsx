import React from 'react';
import { motion } from 'framer-motion';
import { ParticleGlobeCanvas } from './ParticleGlobeCanvas';
import { useSettingStore } from '../../stores/useSettingStore';

export const AuthBackground: React.FC = () => {
  const { theme } = useSettingStore();
  const isLight = theme === 'light';

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-700 ${
        isLight ? 'bg-[#F4F6FC]' : 'bg-[#070B16]'
      }`}
    >
      {/* 1. Cinematic Smart Home Backdrop Image */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: isLight ? 0.35 : 0.55 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 bg-cover bg-center sm:bg-[center_top_20%] transition-all duration-700"
        style={{
          backgroundImage: `url('/warm_indian_home.jpg')`,
          filter: isLight
            ? 'brightness(1.15) contrast(0.95) saturate(1.1)'
            : 'brightness(1.08) contrast(1.12) saturate(1.15)',
        }}
      />

      {/* 2. Atmospheric Gradient Overlays (Dark vs Light) */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F6FC]/95 via-[#F4F6FC]/75 to-[#F4F6FC]/90 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F6FC]/80 via-transparent to-[#F4F6FC]" />
          <div className="absolute inset-0 bg-radial-at-c from-amber-400/10 via-transparent to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#070B16]/95 via-[#070B16]/65 to-[#070B16]/90 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070B16]/85 via-transparent to-[#070B16]" />
          <div className="absolute inset-0 bg-radial-at-c from-amber-500/10 via-transparent to-transparent" />
        </>
      )}

      {/* 3. Subtle Animated Blueprint Mesh Grid */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight ? 'opacity-[0.05]' : 'opacity-[0.08]'
        }`}
        style={{
          backgroundImage: `linear-gradient(to right, ${
            isLight ? '#4f46e5' : '#6366f1'
          } 1px, transparent 1px), linear-gradient(to bottom, ${
            isLight ? '#4f46e5' : '#6366f1'
          } 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      {/* 4. Continuous Live 3D Animated Particle Sphere / Globe */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ${
          isLight ? 'opacity-35' : 'opacity-70'
        }`}
      >
        <ParticleGlobeCanvas />
      </div>

      {/* 5. Slow Ambient Floating Gradient Orbs (Framer Motion) */}
      <motion.div
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -30, 15, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ${
          isLight
            ? 'bg-gradient-to-tr from-blue-300/30 via-indigo-200/25 to-pink-200/20'
            : 'bg-gradient-to-tr from-blue-700/25 via-indigo-600/20 to-pink-500/10'
        }`}
      />

      <motion.div
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -25, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className={`absolute -bottom-32 right-5 w-[520px] h-[520px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ${
          isLight
            ? 'bg-gradient-to-br from-indigo-300/25 via-violet-200/20 to-amber-200/25'
            : 'bg-gradient-to-br from-indigo-600/25 via-violet-800/20 to-amber-500/10'
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: isLight ? [0.15, 0.25, 0.15] : [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[160px] pointer-events-none transition-colors duration-700 ${
          isLight ? 'bg-indigo-300/30' : 'bg-indigo-950/35'
        }`}
      />
    </div>
  );
};
