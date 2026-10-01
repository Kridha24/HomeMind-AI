import React from 'react';
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { InsightItem } from './utils/dashboardUtils';

interface HomeMindInsightCardProps {
  insights: InsightItem[];
  onAction?: (tab: 'bills' | 'tasks') => void;
}

export const HomeMindInsightCard: React.FC<HomeMindInsightCardProps> = ({
  insights,
  onAction,
}) => {
  if (insights.length === 0) return null;

  return (
    <section
      className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border border-slate-200/80 dark:border-indigo-900/40 p-4 sm:p-5 shadow-sm space-y-3"
      aria-label="HomeMind Smart Insights"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
            HomeMind Insights
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Deterministic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {insights.map((item) => {
          const isWarning = item.type === 'warning';
          const isPositive = item.type === 'positive';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                isWarning
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200'
                  : isPositive
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  {isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : isPositive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                  <p className="text-[11px] opacity-80 leading-normal">{item.message}</p>
                </div>
              </div>

              {item.actionLabel && item.actionTab && onAction && (
                <button
                  type="button"
                  onClick={() => onAction(item.actionTab!)}
                  className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[10px] font-bold flex items-center gap-0.5 flex-shrink-0 active:scale-95 transition-all mt-0.5"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
