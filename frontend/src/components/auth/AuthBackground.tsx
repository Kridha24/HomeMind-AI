import React from 'react';

export const AuthBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#030712]">
      {/* Subtle Blueprint Mesh Grid */}
      <div
        className="absolute inset-0 opacity-[0.14] sm:opacity-[0.18]"
        style={{
          backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 85%)',
        }}
      />

      {/* Layered Calm Ambient Orbs (Near-black / Deep Navy Palette) */}
      <div className="absolute -top-48 -left-48 w-[540px] h-[540px] bg-gradient-to-tr from-blue-700/20 via-indigo-600/15 to-transparent rounded-full blur-[140px]" />
      <div className="absolute -bottom-48 -right-48 w-[540px] h-[540px] bg-gradient-to-br from-cyan-600/15 via-blue-800/15 to-transparent rounded-full blur-[140px]" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-950/20 rounded-full blur-[180px]" />
    </div>
  );
};
