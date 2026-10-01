import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  DollarSign,
  Wallet,
  CreditCard,
  FileText,
  CheckSquare,
  ShoppingBag,
  Tv,
  Pill,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';

// Helper component for SVG Donut/Circle Progress Chart
const SVGDonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  totalValue: number;
  centerText: string;
  centerSubtext: string;
}> = ({ data, totalValue, centerText, centerSubtext }) => {
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Base Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {data.map((item, idx) => {
          if (totalValue <= 0 || item.value <= 0) return null;
          const percent = item.value / totalValue;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedPercent * circumference;
          accumulatedPercent += percent;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
            />
          );
        })}
      </svg>
      {/* Center Telemetry Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-extrabold text-primary font-mono leading-none">{centerText}</span>
        <span className="text-[10px] text-muted font-medium uppercase tracking-wider mt-1">{centerSubtext}</span>
      </div>
    </div>
  );
};

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

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { format, currencySymbol } = useSettingStore();

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/analytics/summary');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = data?.summary || {};
  const expenseCategories = data?.expenseCategories || [];
  const incomeSources = data?.incomeSources || [];
  const billsAnalytics = data?.billsAnalytics || {};
  const tasksAnalytics = data?.tasksAnalytics || {};
  const inventoryAnalytics = data?.inventoryAnalytics || {};
  const counts = data?.counts || {};

  const totalMonthlyIncome = summary.monthlyIncome || 0;
  const totalMonthlyExpenses = summary.monthlyExpenses || 0;
  const overallIncome = summary.overallIncome || 0;
  const overallExpenses = summary.overallExpenses || 0;

  const isDataEmpty =
    counts.expensesCount === 0 &&
    counts.incomesCount === 0 &&
    billsAnalytics.totalBillsCount === 0;

  // Donut chart dataset for Expense Categories
  const expenseDonutData = expenseCategories.map((c: any, idx: number) => ({
    label: c.category,
    value: c.amount,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  // Donut chart dataset for Income Sources
  const incomeDonutData = incomeSources.map((s: any, idx: number) => ({
    label: s.source,
    value: s.amount,
    color: CATEGORY_COLORS[(idx + 2) % CATEGORY_COLORS.length],
  }));

  // Circle chart dataset for Bills Settlement
  const billsDonutData = [
    { label: 'Paid Bills', value: billsAnalytics.paidCount || 0, color: '#10b981' },
    { label: 'Unpaid Bills', value: billsAnalytics.unpaidCount || 0, color: '#f59e0b' },
  ];

  // Circle chart dataset for Tasks Completion
  const tasksDonutData = [
    { label: 'Completed', value: tasksAnalytics.completedTasks || 0, color: '#10b981' },
    { label: 'Pending', value: tasksAnalytics.pendingTasks || 0, color: '#f59e0b' },
    { label: 'In Progress', value: tasksAnalytics.inProgressTasks || 0, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Household Analytics & Visual Insights
          </h1>
          <p className="text-xs text-muted">
            Comprehensive telemetry graphs, circle charts, and financial breakdown in {currencySymbol}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono">
            {counts.expensesCount + counts.incomesCount} Transactions Analyzed
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-muted">Loading household visual analytics...</div>
      ) : isDataEmpty ? (
        <EmptyState
          icon={BarChart3}
          title="No data logged for analytics visual charts"
          description="Log income entries, expenses, or utility bills to automatically generate circle donut charts and category breakdown graphs."
          actionLabel="+ Log Income or Expense"
          onAction={() => (window.location.href = '/income')}
        />
      ) : (
        <>
          {/* Main Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-emerald-500/30 bg-gradient-to-tr from-slate-900 via-emerald-950/20 to-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Monthly Income</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-primary font-mono">+{format(totalMonthlyIncome)}</p>
              <p className="text-[11px] text-emerald-400 font-medium">Verified Earnings Stream</p>
            </div>

            <div className="glass-panel p-6 border-red-500/30 bg-gradient-to-tr from-slate-900 via-red-950/20 to-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Monthly Expenses</span>
                <CreditCard className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-extrabold text-red-400 font-mono">-{format(totalMonthlyExpenses)}</p>
              <p className="text-[11px] text-muted">Total Monthly Spend</p>
            </div>

            <div className="glass-panel p-6 border-purple-500/30 bg-gradient-to-tr from-slate-900 via-purple-950/20 to-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Overall Lifetime Spend</span>
                <PieIcon className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-rose-400 font-mono">-{format(overallExpenses)}</p>
              <p className="text-[11px] text-muted">Total Historical Expenses</p>
            </div>

            <div className="glass-panel p-6 border-blue-500/30 bg-gradient-to-tr from-slate-900 via-blue-950/20 to-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Bills Settlement Rate</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-blue-400 font-mono">{summary.billSettlementRate}%</p>
              <p className="text-[11px] text-muted">{billsAnalytics.paidCount} of {billsAnalytics.totalBillsCount} Bills Settled</p>
            </div>
          </div>

          {/* CIRCLE & DONUT CHARTS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Expense Category Breakdown Circle Chart */}
            <div className="glass-panel p-6 border-primary space-y-6">
              <div className="flex items-center justify-between border-b border-primary pb-3">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <PieIcon className="w-4 h-4 text-emerald-400" /> Expense Category Distribution (Circle Chart)
                </h3>
                <span className="text-xs text-muted font-mono">-{format(overallExpenses)}</span>
              </div>

              {expenseCategories.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">No expenses logged to display category chart.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  <SVGDonutChart
                    data={expenseDonutData}
                    totalValue={overallExpenses}
                    centerText={format(overallExpenses)}
                    centerSubtext="Total Spent"
                  />

                  {/* Legend Grid */}
                  <div className="space-y-2.5 w-full max-w-[200px]">
                    {expenseCategories.map((c: any, idx: number) => (
                      <div key={c.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                          ></span>
                          <span className="text-secondary font-semibold truncate">{c.category}</span>
                        </div>
                        <span className="font-mono text-primary font-bold ml-2">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Income Sources Circle Chart */}
            <div className="glass-panel p-6 border-primary space-y-6">
              <div className="flex items-center justify-between border-b border-primary pb-3">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-blue-400" /> Income Sources Revenue (Circle Chart)
                </h3>
                <span className="text-xs text-emerald-400 font-mono">+{format(overallIncome)}</span>
              </div>

              {incomeSources.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">No income streams logged to display source chart.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  <SVGDonutChart
                    data={incomeDonutData}
                    totalValue={overallIncome}
                    centerText={format(overallIncome)}
                    centerSubtext="Total Revenue"
                  />

                  {/* Legend Grid */}
                  <div className="space-y-2.5 w-full max-w-[200px]">
                    {incomeSources.map((s: any, idx: number) => (
                      <div key={s.source} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[(idx + 2) % CATEGORY_COLORS.length] }}
                          ></span>
                          <span className="text-secondary font-semibold truncate">{s.source}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold ml-2">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECONDARY CIRCLE PROGRESS CHARTS & BAR GRAPHS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bills Settlement Circle Progress */}
            <div className="glass-panel p-6 border-primary space-y-4 text-center">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Bills Settlement Progress
              </h4>
              <SVGDonutChart
                data={billsDonutData}
                totalValue={billsAnalytics.totalBillsCount || 1}
                centerText={`${summary.billSettlementRate}%`}
                centerSubtext="Bills Settled"
              />
              <div className="flex justify-around text-xs pt-2 border-t border-primary">
                <div>
                  <span className="text-emerald-400 font-bold font-mono block">{billsAnalytics.paidCount}</span>
                  <span className="text-[10px] text-muted">Paid Bills</span>
                </div>
                <div>
                  <span className="text-amber-400 font-bold font-mono block">{billsAnalytics.unpaidCount}</span>
                  <span className="text-[10px] text-muted">Unpaid Bills</span>
                </div>
              </div>
            </div>

            {/* Tasks Completion Gauge Circle */}
            <div className="glass-panel p-6 border-primary space-y-4 text-center">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center justify-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" /> Household Tasks Completion
              </h4>
              <SVGDonutChart
                data={tasksDonutData}
                totalValue={tasksAnalytics.totalTasksCount || 1}
                centerText={`${summary.taskCompletionRate}%`}
                centerSubtext="Completed"
              />
              <div className="flex justify-around text-xs pt-2 border-t border-primary">
                <div>
                  <span className="text-emerald-400 font-bold font-mono block">{tasksAnalytics.completedTasks}</span>
                  <span className="text-[10px] text-muted">Done</span>
                </div>
                <div>
                  <span className="text-amber-400 font-bold font-mono block">{tasksAnalytics.pendingTasks}</span>
                  <span className="text-[10px] text-muted">Pending</span>
                </div>
                <div>
                  <span className="text-blue-400 font-bold font-mono block">{tasksAnalytics.inProgressTasks}</span>
                  <span className="text-[10px] text-muted">In Progress</span>
                </div>
              </div>
            </div>

            {/* Grocery Inventory Telemetry */}
            <div className="glass-panel p-6 border-primary space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" /> Inventory Stock Telemetry
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-secondary font-semibold">
                      <span>Total Grocery Items</span>
                      <span className="font-mono text-emerald-400">{inventoryAnalytics.totalItems} Items</span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-secondary font-semibold">
                      <span>Healthy Stock</span>
                      <span className="font-mono text-blue-400">{inventoryAnalytics.healthyStockCount} Items</span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${
                            inventoryAnalytics.totalItems > 0
                              ? Math.round((inventoryAnalytics.healthyStockCount / inventoryAnalytics.totalItems) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-secondary font-semibold">
                      <span>Low Stock Warning</span>
                      <span className="font-mono text-amber-400">{inventoryAnalytics.lowStockCount} Items</span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{
                          width: `${
                            inventoryAnalytics.totalItems > 0
                              ? Math.round((inventoryAnalytics.lowStockCount / inventoryAnalytics.totalItems) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-primary text-[11px] text-muted flex items-center justify-between">
                <span>Appliances: {counts.appliancesCount} Logged</span>
                <span>Medicines: {counts.medicinesCount} Active</span>
              </div>
            </div>
          </div>

          {/* DETAILED CATEGORY SPENDING PROGRESS BARS */}
          <div className="glass-panel p-6 border-primary space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Category Spend Breakdown Bar Graphs
            </h3>

            <div className="space-y-3">
              {expenseCategories.map((cat: any, idx: number) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted font-mono">{cat.percentage}% of total</span>
                      <span className="font-bold font-mono text-red-400">-{format(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-background h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
