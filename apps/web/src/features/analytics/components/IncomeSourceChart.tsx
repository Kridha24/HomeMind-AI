import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IncomeSourceMetric } from '../types';
import { formatINR } from '../utils/analyticsFormatters';

interface IncomeSourceChartProps {
  sources: IncomeSourceMetric[];
  totalAmount: number;
}

const INCOME_COLORS = [
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b', // slate
];

export const IncomeSourceChart: React.FC<IncomeSourceChartProps> = ({
  sources,
  totalAmount,
}) => {
  const navigate = useNavigate();

  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const handleSourceClick = (source: string) => {
    navigate(`/finance?source=${encodeURIComponent(source)}`);
  };

  return (
    <div className="glass-panel p-6 border-primary space-y-5">
      <div className="flex items-center justify-between border-b border-primary pb-3">
        <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <span>Income Sources</span>
        </h3>
        <span className="text-xs font-mono font-bold text-emerald-500">
          +{formatINR(totalAmount)}
        </span>
      </div>

      {sources.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted space-y-2">
          <p>No income streams logged for this period.</p>
          <button
            onClick={() => navigate('/finance')}
            className="text-cyan-500 font-bold hover:underline"
          >
            + Add Income
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* SVG Donut */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {sources.map((s, idx) => {
                if (totalAmount <= 0 || s.amount <= 0) return null;
                const percent = s.amount / totalAmount;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                return (
                  <circle
                    key={s.source}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={INCOME_COLORS[idx % INCOME_COLORS.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    onClick={() => handleSourceClick(s.source)}
                    className="transition-all duration-300 hover:opacity-75 cursor-pointer"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                Total In
              </span>
              <span className="text-xs font-black text-primary font-mono">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          {/* Legend / Breakdown List */}
          <div className="w-full sm:w-1/2 space-y-2 max-h-48 overflow-y-auto pr-1">
            {sources.map((s, idx) => {
              const color = INCOME_COLORS[idx % INCOME_COLORS.length];
              return (
                <div
                  key={s.source}
                  onClick={() => handleSourceClick(s.source)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-secondary group-hover:text-primary font-medium">
                      {s.source}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-mono font-bold text-primary block">
                      {formatINR(s.amount)}
                    </span>
                    <span className="text-[10px] text-muted">
                      {s.percentage.toFixed(1)}% ({s.count})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
