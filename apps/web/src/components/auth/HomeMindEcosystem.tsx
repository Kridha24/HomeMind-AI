import React from 'react';
import { Home, Receipt, ShoppingBag, FileText, CheckSquare } from 'lucide-react';

export const HomeMindEcosystem: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl py-4 my-2 select-none">
      {/* SVG Network Connector Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-coral" x1="50%" y1="50%" x2="20%" y2="20%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="line-amber" x1="50%" y1="50%" x2="80%" y2="20%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="line-emerald" x1="50%" y1="50%" x2="20%" y2="80%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="line-violet" x1="50%" y1="50%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Subtle connecting lines from center to 4 corners */}
        <line x1="50%" y1="50%" x2="24%" y2="24%" stroke="url(#line-coral)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="50%" y1="50%" x2="76%" y2="24%" stroke="url(#line-amber)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="50%" y1="50%" x2="24%" y2="76%" stroke="url(#line-emerald)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="50%" y1="50%" x2="76%" y2="76%" stroke="url(#line-violet)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      </svg>

      <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 items-center">
        {/* Module 1: Expenses (Coral / Rose) */}
        <div className="p-3.5 rounded-2xl bg-[#0e172e]/80 border border-rose-500/30 backdrop-blur-xl shadow-lg shadow-rose-950/20 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white block">Expenses</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-rose-300/80 font-medium block">Budget & Tracking</span>
          </div>
        </div>

        {/* Module 2: Bills (Amber / Orange) */}
        <div className="p-3.5 rounded-2xl bg-[#0e172e]/80 border border-amber-500/30 backdrop-blur-xl shadow-lg shadow-amber-950/20 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white block">Bills</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-amber-300/80 font-medium block">Rent & Utilities</span>
          </div>
        </div>

        {/* Central Core (Spans full or sits between) */}
        <div className="col-span-2 flex justify-center -my-1">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full blur-md opacity-40 animate-pulse" />
            <div className="relative px-4 py-2 rounded-full bg-[#0a1128]/95 border border-indigo-400/40 backdrop-blur-2xl flex items-center gap-2 shadow-xl shadow-indigo-950/60">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                HomeMind AI Core
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold">
                SYNCED
              </span>
            </div>
          </div>
        </div>

        {/* Module 3: Groceries (Emerald) */}
        <div className="p-3.5 rounded-2xl bg-[#0e172e]/80 border border-emerald-500/30 backdrop-blur-xl shadow-lg shadow-emerald-950/20 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white block">Groceries</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-300/80 font-medium block">Pantry & Shopping</span>
          </div>
        </div>

        {/* Module 4: Tasks (Violet) */}
        <div className="p-3.5 rounded-2xl bg-[#0e172e]/80 border border-purple-500/30 backdrop-blur-xl shadow-lg shadow-purple-950/20 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 flex-shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white block">Tasks</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-purple-300/80 font-medium block">Household Chores</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-3">
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          One intelligent operating system for your whole household.
        </p>
      </div>
    </div>
  );
};
