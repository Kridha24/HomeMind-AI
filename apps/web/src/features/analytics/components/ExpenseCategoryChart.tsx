import React from 'react';
import { PieChart, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CategoryMetric } from '../types';
import { formatINR } from '../utils/analyticsFormatters';

interface ExpenseCategoryChartProps {
  categories: CategoryMetric[];
  totalAmount: number;
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  categories,
  totalAmount,
}) => {
  const navigate = useNavigate();

  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const handleCategoryClick = (category: string) => {
    navigate(`/expenses?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="glass-panel p-6 border-primary space-y-5">
      <div className="flex items-center justify-between border-b border-primary pb-3">
        <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
          <PieChart className="w-4 h-4 text-emerald-500" />
          <span>Spending by Category</span>
        </h3>
        <span className="text-xs font-mono font-bold text-rose-500">
          -{formatINR(totalAmount)}
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted space-y-2">
          <p>No expenses logged for this period.</p>
          <button
            onClick={() => navigate('/expenses')}
            className="text-blue-500 font-bold hover:underline"
          >
            + Add Expense
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
              {categories.map((c, idx) => {
                if (totalAmount <= 0 || c.amount <= 0) return null;
                const percent = c.amount / totalAmount;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                return (
                  <circle
                    key={c.category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    onClick={() => handleCategoryClick(c.category)}
                    className="transition-all duration-300 hover:opacity-75 cursor-pointer"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-extrabold text-primary font-mono leading-none">
                {formatINR(totalAmount)}
              </span>
              <span className="text-[10px] text-muted font-medium uppercase tracking-wider mt-1">
                Total Spend
              </span>
            </div>
          </div>

          {/* Legend and Category List */}
          <div className="space-y-2 w-full max-w-[240px]">
            {categories.slice(0, 6).map((c, idx) => (
              <div
                key={c.category}
                onClick={() => handleCategoryClick(c.category)}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-secondary/60 cursor-pointer group transition-colors"
                title={`Filter expenses by ${c.category}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-secondary group-hover:text-primary font-medium truncate">
                    {c.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-2 font-mono flex-shrink-0">
                  <span className="text-muted text-[11px]">{c.percentage}%</span>
                  <span className="font-bold text-primary">-{formatINR(c.amount)}</span>
                  <ArrowUpRight className="w-3 h-3 text-muted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
