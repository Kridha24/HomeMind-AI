import React from 'react';
import { Bot, Home, Users } from 'lucide-react';

export const ProductBenefits: React.FC = () => {
  const benefits = [
    {
      icon: Bot,
      title: 'AI Assistant',
      desc: 'Your intelligent everyday companion.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      icon: Home,
      title: 'Smart Home',
      desc: 'Organize everything around your home.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: Users,
      title: 'Family',
      desc: 'Keep your household connected.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
      {benefits.map((b) => (
        <div
          key={b.title}
          className="p-3.5 rounded-2xl bg-panel/50 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all space-y-1.5 shadow-lg group"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center ${b.color}`}
            >
              <b.icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-primary tracking-tight">
              {b.title}
            </h3>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {b.desc}
          </p>
        </div>
      ))}
    </div>
  );
};
