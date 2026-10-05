import React from 'react';
import { Home, Receipt, ShoppingBag, FileText, CheckSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingStore } from '../../stores/useSettingStore';

interface HomeMindEcosystemProps {
  isHighlighted?: boolean;
}

export const HomeMindEcosystem: React.FC<HomeMindEcosystemProps> = ({ isHighlighted = false }) => {
  const { theme } = useSettingStore();
  const isLight = theme === 'light';

  // Stagger container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-2xl py-2 sm:py-3 select-none"
    >
      {/* SVG Network Connector Curved Lines with Animated Pulse */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        viewBox="0 0 600 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curve-coral" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="curve-amber" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="curve-emerald" x1="50%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="curve-violet" x1="50%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="curve-cyan" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Curved bezier paths with gentle breathing stroke opacity */}
        <motion.path
          d="M 300 110 Q 220 60 140 40"
          stroke="url(#curve-coral)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          animate={{
            strokeDashoffset: [0, -16],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        <motion.path
          d="M 300 110 Q 380 60 460 40"
          stroke="url(#curve-amber)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          animate={{
            strokeDashoffset: [0, 16],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
          }}
        />

        <motion.path
          d="M 280 135 Q 200 165 140 195"
          stroke="url(#curve-emerald)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          animate={{
            strokeDashoffset: [0, -16],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{
            strokeDashoffset: { duration: 3.2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
        />

        <motion.path
          d="M 320 135 Q 400 165 460 195"
          stroke="url(#curve-violet)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          animate={{
            strokeDashoffset: [0, 16],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{
            strokeDashoffset: { duration: 3.2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
          }}
        />

        <motion.path
          d="M 300 145 Q 300 180 300 205"
          stroke="url(#curve-cyan)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          animate={{
            strokeDashoffset: [0, -16],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{
            strokeDashoffset: { duration: 2.8, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
          }}
        />
      </svg>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-center">
        {/* Node 1: Expenses (Rose / Coral) */}
        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group ${
            isLight
              ? 'bg-white/85 border-rose-200 shadow-md shadow-rose-100/60 hover:shadow-lg hover:shadow-rose-200/50'
              : 'bg-[#090F24]/85 border-rose-500/30 shadow-lg shadow-rose-950/25 hover:border-rose-400/50 hover:shadow-rose-500/20'
          } ${isHighlighted ? 'ring-2 ring-rose-400' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/30 flex-shrink-0"
            >
              <Receipt className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Expenses
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${isLight ? 'text-rose-600' : 'text-rose-200/80'}`}>
                Track • Plan • Save
              </span>
            </div>
          </div>
        </motion.div>

        {/* Node 2: Bills (Amber / Orange) */}
        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, -4.5, 0],
          }}
          transition={{
            y: { duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group ${
            isLight
              ? 'bg-white/85 border-amber-200 shadow-md shadow-amber-100/60 hover:shadow-lg hover:shadow-amber-200/50'
              : 'bg-[#090F24]/85 border-amber-500/30 shadow-lg shadow-amber-950/25 hover:border-amber-400/50 hover:shadow-amber-500/20'
          } ${isHighlighted ? 'ring-2 ring-amber-400' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Bills
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${isLight ? 'text-amber-600' : 'text-amber-200/80'}`}>
                Never Miss • Stay Calm
              </span>
            </div>
          </div>
        </motion.div>

        {/* Central Core: HomeMind AI Core */}
        <div className="sm:col-span-2 flex justify-center py-0.5">
          <motion.div
            variants={itemVariants}
            animate={{
              scale: [1, 1.025, 1],
            }}
            transition={{
              scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative group cursor-default"
          >
            {/* Breathing Glow Aura */}
            <motion.div
              animate={{
                opacity: [0.4, 0.75, 0.4],
                scale: [0.98, 1.06, 0.98],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -inset-1.5 bg-gradient-to-r from-rose-500 via-indigo-500 to-cyan-500 rounded-full blur-md"
            />
            <div
              className={`relative px-4 sm:px-5 py-2 rounded-full border backdrop-blur-2xl flex items-center gap-2.5 shadow-xl transition-all ${
                isLight
                  ? 'bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-200/40'
                  : 'bg-[#080E24]/95 border-indigo-400/40 text-white shadow-indigo-950/80'
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/40 flex-shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                  HomeMind.AI Core
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-400/30 font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Synced
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Node 3: Groceries (Emerald / Green) */}
        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            y: { duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group ${
            isLight
              ? 'bg-white/85 border-emerald-200 shadow-md shadow-emerald-100/60 hover:shadow-lg hover:shadow-emerald-200/50'
              : 'bg-[#090F24]/85 border-emerald-500/30 shadow-lg shadow-emerald-950/25 hover:border-emerald-400/50 hover:shadow-emerald-500/20'
          } ${isHighlighted ? 'ring-2 ring-emerald-400' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Groceries
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${isLight ? 'text-emerald-600' : 'text-emerald-200/80'}`}>
                Plan • Shop • Share
              </span>
            </div>
          </div>
        </motion.div>

        {/* Node 4: Tasks (Violet / Purple) */}
        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, -4.8, 0],
          }}
          transition={{
            y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.1 },
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group ${
            isLight
              ? 'bg-white/85 border-purple-200 shadow-md shadow-purple-100/60 hover:shadow-lg hover:shadow-purple-200/50'
              : 'bg-[#090F24]/85 border-purple-500/30 shadow-lg shadow-purple-950/25 hover:border-purple-400/50 hover:shadow-purple-500/20'
          } ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 flex-shrink-0"
            >
              <CheckSquare className="w-4 h-4" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Tasks
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${isLight ? 'text-purple-600' : 'text-purple-200/80'}`}>
                Get Things Done Together
              </span>
            </div>
          </div>
        </motion.div>

        {/* Node 5: Family Workspace (Blue / Cyan) - Spans 2 cols */}
        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, -3.5, 0],
          }}
          transition={{
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
          }}
          whileHover={{ y: -3, scale: 1.01 }}
          className={`sm:col-span-2 p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group ${
            isLight
              ? 'bg-white/85 border-cyan-200 shadow-md shadow-cyan-100/60 hover:shadow-lg hover:shadow-cyan-200/50'
              : 'bg-[#090F24]/85 border-cyan-500/30 shadow-lg shadow-cyan-950/25 hover:border-cyan-400/50 hover:shadow-cyan-500/20'
          } ${isHighlighted ? 'ring-2 ring-cyan-400' : ''}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.1 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0"
              >
                <Users className="w-4 h-4" />
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs sm:text-sm font-bold tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Family Workspace
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${isLight ? 'text-cyan-600' : 'text-cyan-200/80'}`}>
                  Plans • Notes • Lists
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9.5px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-300/90 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              Always in sync
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
