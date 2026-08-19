import React from 'react';
import {
  Sparkles,
  Home,
  Bot,
  Users,
  CheckSquare,
  CreditCard,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

export const EcosystemVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl py-6 my-2">
      {/* Central HomeMind AI Nucleus */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/25 rounded-2xl blur-xl animate-pulse-glow" />
          <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-panel/90 border border-blue-500/40 backdrop-blur-2xl shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-primary tracking-tight block leading-none">
                HomeMind AI
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block mt-0.5">
                Central Nervous System
              </span>
            </div>
          </div>
        </div>

        {/* Connected Ecosystem Orbit / Grid Nodes */}
        <div className="w-full grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-5">
          {/* 1. Home */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 transition-all shadow-lg animate-float-slow flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Home</span>
              <span className="text-[9px] text-muted block truncate">Residence</span>
            </div>
          </div>

          {/* 2. AI Assistant */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-lg animate-float-delayed flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Assistant</span>
              <span className="text-[9px] text-muted block truncate">Everyday AI</span>
            </div>
          </div>

          {/* 3. Family */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/30 transition-all shadow-lg animate-float-slow flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Family</span>
              <span className="text-[9px] text-muted block truncate">Workspace</span>
            </div>
          </div>

          {/* 4. Tasks */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-lg animate-float-delayed flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Tasks</span>
              <span className="text-[9px] text-muted block truncate">Chores</span>
            </div>
          </div>

          {/* 5. Finance */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/30 transition-all shadow-lg animate-float-slow flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Finance</span>
              <span className="text-[9px] text-muted block truncate">Multi-Currency</span>
            </div>
          </div>

          {/* 6. Shopping */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/30 transition-all shadow-lg animate-float-delayed flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Shopping</span>
              <span className="text-[9px] text-muted block truncate">Groceries</span>
            </div>
          </div>

          {/* 7. Calendar / Events */}
          <div className="p-3 rounded-2xl bg-panel/60 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/30 transition-all shadow-lg animate-float-slow col-span-3 sm:col-span-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-primary block truncate">Calendar & Telemetry</span>
              <span className="text-[9px] text-muted block truncate">Synchronized Schedule</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
