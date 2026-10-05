import React from 'react';
import { Heart, Users, Sparkles } from 'lucide-react';

export const ProductBenefits: React.FC = () => {
  const benefits = [
    {
      icon: Heart,
      title: 'Less Stress',
      desc: 'No more forgotten chores or surprise expenses.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
    },
    {
      icon: Users,
      title: 'More Togetherness',
      desc: 'Shared responsibilities, peaceful conversations.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
    },
    {
      icon: Sparkles,
      title: 'A Happier Home',
      desc: 'Intelligent rhythm that lets family time thrive.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/15',
      border: 'border-violet-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-xl select-none pt-2">
      {benefits.map((b) => (
        <div
          key={b.title}
          className="p-3 sm:p-3.5 rounded-2xl bg-[#090F24]/75 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all space-y-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center ${b.color} group-hover:scale-105 transition-transform`}
            >
              <b.icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              {b.title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-300/80 leading-relaxed font-normal">
            {b.desc}
          </p>
        </div>
      ))}
    </div>
  );
};

