import React from 'react';
import { Receipt, FileText, ShoppingBag, CheckSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingStore } from '../../stores/useSettingStore';

export const FloatingFeatureCards: React.FC = () => {
  const { theme } = useSettingStore();
  const isLight = theme === 'light';

  const modules = [
    {
      icon: Receipt,
      title: 'Expenses',
      tag: 'Track & Save',
      color: isLight ? 'text-rose-600' : 'text-rose-400',
      border: isLight ? 'border-rose-200 hover:border-rose-300' : 'border-rose-500/30 hover:border-rose-400/50',
      bg: isLight ? 'bg-rose-50' : 'bg-rose-500/15',
      glow: isLight ? 'hover:shadow-rose-100' : 'hover:shadow-rose-500/15',
    },
    {
      icon: FileText,
      title: 'Bills',
      tag: 'Never Miss',
      color: isLight ? 'text-amber-600' : 'text-amber-400',
      border: isLight ? 'border-amber-200 hover:border-amber-300' : 'border-amber-500/30 hover:border-amber-400/50',
      bg: isLight ? 'bg-amber-50' : 'bg-amber-500/15',
      glow: isLight ? 'hover:shadow-amber-100' : 'hover:shadow-amber-500/15',
    },
    {
      icon: ShoppingBag,
      title: 'Groceries',
      tag: 'Pantry & Lists',
      color: isLight ? 'text-emerald-600' : 'text-emerald-400',
      border: isLight ? 'border-emerald-200 hover:border-emerald-300' : 'border-emerald-500/30 hover:border-emerald-400/50',
      bg: isLight ? 'bg-emerald-50' : 'bg-emerald-500/15',
      glow: isLight ? 'hover:shadow-emerald-100' : 'hover:shadow-emerald-500/15',
    },
    {
      icon: CheckSquare,
      title: 'Tasks',
      tag: 'Shared Chores',
      color: isLight ? 'text-purple-600' : 'text-purple-400',
      border: isLight ? 'border-purple-200 hover:border-purple-300' : 'border-purple-500/30 hover:border-purple-400/50',
      bg: isLight ? 'bg-purple-50' : 'bg-purple-500/15',
      glow: isLight ? 'hover:shadow-purple-100' : 'hover:shadow-purple-500/15',
    },
    {
      icon: Users,
      title: 'Family',
      tag: 'Notes & Hub',
      color: isLight ? 'text-cyan-600' : 'text-cyan-400',
      border: isLight ? 'border-cyan-200 hover:border-cyan-300' : 'border-cyan-500/30 hover:border-cyan-400/50',
      bg: isLight ? 'bg-cyan-50' : 'bg-cyan-500/15',
      glow: isLight ? 'hover:shadow-cyan-100' : 'hover:shadow-cyan-500/15',
    },
  ];

  return (
    <div className="w-full max-w-2xl select-none">
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {modules.map((m, idx) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.1 + idx * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            className={`p-1 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-xl border ${m.border} transition-all shadow-sm ${m.glow} flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-0.5 sm:gap-2 group cursor-default ${
              isLight ? 'bg-white/80' : 'bg-[#090F24]/80'
            }`}
          >
            <div
              className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg ${m.bg} flex items-center justify-center ${m.color} group-hover:scale-110 transition-transform flex-shrink-0`}
            >
              <m.icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-[9px] sm:text-[11.5px] font-bold block leading-tight truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {m.title}
              </span>
              <span className={`hidden sm:block text-[9.5px] font-medium leading-tight truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {m.tag}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
