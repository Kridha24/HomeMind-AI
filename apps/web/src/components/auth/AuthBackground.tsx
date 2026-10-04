import React from 'react';

export const AuthBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070B16]">
      {/* Cinematic Smart Home Night Backdrop Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center sm:bg-[center_top_30%] opacity-55 scale-100 transition-transform duration-1000"
        style={{
          backgroundImage: `url('/cinematic-home-night.jpg')`,
          filter: 'brightness(1.05) contrast(1.1)',
        }}
      />

      {/* Atmospheric Deep Midnight Vignette & Gradients to protect text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070B16]/90 via-[#070B16]/55 to-[#070B16]/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B16]/75 via-transparent to-[#070B16]/95" />

      {/* Subtle Blueprint Mesh Grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-blue-700/20 via-indigo-600/15 to-transparent rounded-full blur-[140px]" />
      <div className="absolute -bottom-40 right-10 w-[540px] h-[540px] bg-gradient-to-br from-indigo-600/20 via-violet-800/15 to-transparent rounded-full blur-[140px]" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-950/25 rounded-full blur-[180px]" />
    </div>
  );
};
