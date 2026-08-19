import React from 'react';
import { Bot, Home, Users } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: Bot,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      title: 'AI Assistant',
      desc: 'Your intelligent everyday companion.',
    },
    {
      icon: Home,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      title: 'Smart Home',
      desc: 'Organize everything around your home.',
    },
    {
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      title: 'Family',
      desc: 'Keep your household connected.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
      {features.map((f) => (
        <div
          key={f.title}
          className="p-3.5 rounded-2xl bg-panel/50 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all space-y-1.5 shadow-lg group"
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl ${f.bgColor} border ${f.borderColor} flex items-center justify-center ${f.color}`}>
              <f.icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-primary tracking-tight">
              {f.title}
            </h3>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  );
};
