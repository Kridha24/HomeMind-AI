import React from 'react';
import {
  Sparkles,
  Home,
  Bot,
  Users,
  CheckSquare,
  DollarSign,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

export const HomeMindEcosystem: React.FC = () => {
  const nodes = [
    {
      id: 'home',
      name: 'Home',
      tag: 'Residence',
      icon: Home,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      animation: 'animate-float-slow',
    },
    {
      id: 'ai',
      name: 'AI Assistant',
      tag: 'Everyday AI',
      icon: Bot,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      animation: 'animate-float-delayed',
    },
    {
      id: 'family',
      name: 'Family',
      tag: 'Household',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      animation: 'animate-float-slow',
    },
    {
      id: 'tasks',
      name: 'Tasks',
      tag: 'Chores & Routine',
      icon: CheckSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      animation: 'animate-float-delayed',
    },
    {
      id: 'finance',
      name: 'Finance',
      tag: 'Budget & Bills',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      animation: 'animate-float-slow',
    },
    {
      id: 'shopping',
      name: 'Shopping',
      tag: 'Pantry & Needs',
      icon: ShoppingBag,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      animation: 'animate-float-delayed',
    },
    {
      id: 'calendar',
      name: 'Calendar',
      tag: 'Timeline Sync',
      icon: Calendar,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      animation: 'animate-float-slow',
    },
  ];

  return (
    <div className="relative w-full max-w-xl py-3 my-1">
      {/* Central HomeMind AI Nucleus */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse-glow" />
          <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-panel/90 border border-blue-500/40 backdrop-blur-2xl shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white tracking-tight block">
                HomeMind AI
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                Intelligent Operating Core
              </span>
            </div>
          </div>
        </div>

        {/* Connected Ecosystem Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {nodes.map((node, i) => (
            <div
              key={node.id}
              className={`p-2.5 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all shadow-lg flex items-center gap-2.5 ${
                node.animation
              } ${i === 6 ? 'col-span-2' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-xl ${node.bg} border ${node.border} flex items-center justify-center ${node.color} flex-shrink-0`}
              >
                <node.icon className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold text-primary block truncate">
                  {node.name}
                </span>
                <span className="text-[9px] text-muted block truncate">
                  {node.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
