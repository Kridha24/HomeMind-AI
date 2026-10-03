import React from 'react';
import { Lightbulb, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnalyticsInsightProps {
  insights: string[];
}

export const AnalyticsInsight: React.FC<AnalyticsInsightProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-5 border-primary space-y-3">
      <div className="flex items-center gap-2 border-b border-primary pb-3">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
          Household Intelligence & Insights
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight, idx) => {
          const isWarning =
            insight.toLowerCase().includes('overdue') ||
            insight.toLowerCase().includes('low stock') ||
            insight.toLowerCase().includes('deficit');
          const isSuccess =
            insight.toLowerCase().includes('completed') ||
            insight.toLowerCase().includes('surplus') ||
            insight.toLowerCase().includes('healthy');

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                isWarning
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                  : isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
              }`}
            >
              {isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{insight}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
