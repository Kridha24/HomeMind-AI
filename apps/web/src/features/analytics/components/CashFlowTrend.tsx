import React, { useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { MonthlyTrendPoint } from '../types';
import { formatINR } from '../utils/analyticsFormatters';

interface CashFlowTrendProps {
  data: MonthlyTrendPoint[];
}

export const CashFlowTrend: React.FC<CashFlowTrendProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyTrendPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-6 border-primary text-center text-xs text-muted">
        No historical trend data available.
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    1000
  );

  return (
    <div className="glass-panel p-6 border-primary space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Monthly Cash Flow & Spending Velocity</span>
          </h3>
          <p className="text-[11px] text-muted">
            Historical comparison of verified earnings against living expenses
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-muted">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-muted">Expenses</span>
          </div>
        </div>
      </div>

      {/* Responsive Bar Chart View */}
      <div className="pt-4 pb-2">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 border-b border-primary/60 pb-2">
          {data.map((point) => {
            const incomeHeight = Math.max(4, Math.round((point.income / maxVal) * 160));
            const expenseHeight = Math.max(4, Math.round((point.expenses / maxVal) * 160));
            const isHovered = hoveredPoint?.monthKey === point.monthKey;

            return (
              <div
                key={point.monthKey}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className={`flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                  isHovered ? 'scale-105' : ''
                }`}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] font-mono shadow-xl pointer-events-none whitespace-nowrap">
                    <div>+{formatINR(point.income)} | -{formatINR(point.expenses)}</div>
                    <div className={point.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Net: {point.net >= 0 ? '+' : ''}{formatINR(point.net)}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center">
                  {/* Income bar */}
                  <div
                    style={{ height: `${incomeHeight}px` }}
                    className="w-3.5 sm:w-5 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition-all duration-300"
                    title={`Income: +${formatINR(point.income)}`}
                  />
                  {/* Expenses bar */}
                  <div
                    style={{ height: `${expenseHeight}px` }}
                    className="w-3.5 sm:w-5 bg-rose-500/80 hover:bg-rose-400 rounded-t-md transition-all duration-300"
                    title={`Expenses: -${formatINR(point.expenses)}`}
                  />
                </div>

                <span className="text-[10px] sm:text-xs font-medium text-muted mt-2 truncate w-full text-center">
                  {point.month.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
