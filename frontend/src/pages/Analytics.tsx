import React from 'react';
import { BarChart3, TrendingUp, PieChart, Zap, Droplet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';

const categoryData = [
  { name: 'Groceries', value: 520, color: '#3b82f6' },
  { name: 'Utilities', value: 325, color: '#eab308' },
  { name: 'Household', value: 180, color: '#a855f7' },
  { name: 'Health', value: 145, color: '#ec4899' },
  { name: 'Services', value: 250, color: '#10b981' },
];

const energyData = [
  { week: 'W1', kwh: 85, waterL: 1050 },
  { week: 'W2', kwh: 92, waterL: 1100 },
  { week: 'W3', kwh: 78, waterL: 980 },
  { week: 'W4', kwh: 85, waterL: 1070 },
];

export const Analytics: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Household Analytics & Forecasting
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </h1>
        <p className="text-xs text-slate-400">Deep telemetry analysis across finance, utility consumption, and food waste trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Distribution */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-semibold text-sm text-slate-200">Category Expense Outlay</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utility kWh & Water Bar Chart */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-semibold text-sm text-slate-200">Weekly Energy (kWh) & Water (L) Draw</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="kwh" fill="#eab308" radius={[6, 6, 0, 0]} />
                <Bar dataKey="waterL" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
