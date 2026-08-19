import React from 'react';
import { Bot, Users, ShoppingCart, DollarSign, ArrowUpRight } from 'lucide-react';

export const FloatingFeatureCards: React.FC = () => {
  const cards = [
    {
      icon: Bot,
      category: 'AI Assistant',
      title: 'Good evening. 3 tasks need your attention.',
      color: 'text-indigo-400',
      border: 'border-indigo-500/25',
      bg: 'bg-indigo-500/10',
      animation: 'animate-float-slow',
    },
    {
      icon: Users,
      category: 'Family',
      title: 'Family schedule updated.',
      color: 'text-purple-400',
      border: 'border-purple-500/25',
      bg: 'bg-purple-500/10',
      animation: 'animate-float-delayed',
    },
    {
      icon: ShoppingCart,
      category: 'Shopping',
      title: '4 items added to your shopping list.',
      color: 'text-rose-400',
      border: 'border-rose-500/25',
      bg: 'bg-rose-500/10',
      animation: 'animate-float-slow',
    },
    {
      icon: DollarSign,
      category: 'Finance',
      title: 'Monthly household spending is on track.',
      color: 'text-emerald-400',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/10',
      animation: 'animate-float-delayed',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
      {cards.map((c) => (
        <div
          key={c.category}
          className={`p-3 rounded-2xl bg-panel/50 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all space-y-1 shadow-md group ${c.animation}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center ${c.color}`}
              >
                <c.icon className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                {c.category}
              </span>
            </div>
            <ArrowUpRight className="w-3 h-3 text-muted group-hover:text-secondary transition-colors" />
          </div>
          <p className="text-xs font-medium text-primary leading-snug">
            "{c.title}"
          </p>
        </div>
      ))}
    </div>
  );
};
