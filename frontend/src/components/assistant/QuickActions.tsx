import React from 'react';
import { Calendar, CheckSquare, ShoppingBag, DollarSign, Brain, Home } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSelectAction,
  disabled = false,
}) => {
  const actions = [
    { label: 'Plan my day', icon: Calendar, prompt: 'Plan my day with upcoming tasks and schedule' },
    { label: 'Show pending tasks', icon: CheckSquare, prompt: 'Show all my pending household tasks' },
    { label: 'Open shopping list', icon: ShoppingBag, prompt: 'Show low stock grocery items and shopping list' },
    { label: 'Analyze spending', icon: DollarSign, prompt: 'Analyze my spending and show monthly financial overview' },
    { label: 'What do you remember?', icon: Brain, prompt: 'What household memories and preferences do you remember?' },
    { label: 'Household summary', icon: Home, prompt: 'Give me a full household status summary' },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
        Suggested Contextual Actions
      </span>
      <div className="flex flex-wrap gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={() => onSelectAction(act.prompt)}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-blue-400" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
