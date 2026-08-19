import React from 'react';
import { Sparkles, Brain, Trash2, X, Bot, Compass, CheckSquare, Zap, BarChart2 } from 'lucide-react';

export type AssistantMode = 'chat' | 'plan' | 'action' | 'insights';

interface AssistantHeaderProps {
  mode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
  onOpenMemories: () => void;
  onClearThread: () => void;
  onClose?: () => void;
  isStreaming?: boolean;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  mode,
  onModeChange,
  onOpenMemories,
  onClearThread,
  onClose,
  isStreaming = false,
}) => {
  const modes: Array<{ id: AssistantMode; label: string; icon: any }> = [
    { id: 'chat', label: 'Chat', icon: Bot },
    { id: 'plan', label: 'Plan', icon: Compass },
    { id: 'action', label: 'Actions', icon: Zap },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
  ];

  return (
    <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
      {/* Brand Identity & Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-sm text-white tracking-tight leading-none">
              HomeMind AI
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
              {isStreaming ? 'Thinking...' : 'Ready'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Context-Aware Household Operating Agent
          </p>
        </div>
      </div>

      {/* Mode Switcher & Actions */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        {/* Mode Pills */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 p-0.5 rounded-xl">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Memory Manager Button */}
        <button
          onClick={onOpenMemories}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
          title="AI Household Memories & Rules"
        >
          <Brain className="w-4 h-4" />
        </button>

        {/* Clear Thread Button */}
        <button
          onClick={onClearThread}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Close Button (if rendered in modal / drawer) */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
