import React from 'react';
import { ShoppingCart, AlertOctagon, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../utils/analyticsFormatters';

interface GroceriesAnalyticsProps {
  groceries: {
    total: number;
    needToBuy: number;
    purchased: number;
    lowStock: number;
    healthyStock: number;
    urgent: number;
  };
}

export const GroceriesAnalytics: React.FC<GroceriesAnalyticsProps> = ({
  groceries,
}) => {
  const navigate = useNavigate();

  const total = groceries.total || 0;
  const healthyStock = groceries.healthyStock || 0;
  const lowStock = groceries.lowStock || 0;
  const needToBuy = groceries.needToBuy || 0;
  const urgent = groceries.urgent || 0;

  // Safe percentage calculation
  const healthyPercent = total > 0 ? (healthyStock / total) * 100 : 0;
  const lowStockPercent = total > 0 ? (lowStock / total) * 100 : 0;

  return (
    <div className="glass-panel p-5 border-primary space-y-4">
      <div className="flex items-center justify-between border-b border-primary pb-3">
        <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
          <ShoppingCart className="w-4 h-4 text-cyan-500" />
          <span>Grocery Telemetry</span>
        </h3>
        <button
          onClick={() => navigate('/groceries')}
          className="text-xs text-blue-500 hover:text-blue-400 font-bold hover:underline"
        >
          View All ({formatCount(total, 'Item')})
        </button>
      </div>

      {total === 0 ? (
        <div className="py-6 text-center text-xs text-muted space-y-2">
          <p>No inventory tracked yet.</p>
          <button
            onClick={() => navigate('/groceries')}
            className="text-cyan-500 font-bold hover:underline"
          >
            + Add Grocery Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stock Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-secondary font-medium">Inventory Health</span>
              <span className="font-mono text-muted text-[11px]">
                {healthyPercent.toFixed(0)}% optimal
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${healthyPercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
              <div
                style={{ width: `${lowStockPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
              />
            </div>
          </div>

          {/* Metric cards with strict pluralization: "4 Items", "1 Item", never "Items" alone */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              onClick={() => navigate('/groceries?stock=healthy')}
              className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-secondary font-medium">Healthy Stock</span>
              </div>
              <span className="font-mono font-bold text-primary">
                {formatCount(healthyStock, 'Item')}
              </span>
            </div>

            <div
              onClick={() => navigate('/groceries?stock=low')}
              className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-secondary font-medium">Low Stock</span>
              </div>
              <span className="font-mono font-bold text-amber-400">
                {formatCount(lowStock, 'Item')}
              </span>
            </div>

            <div
              onClick={() => navigate('/groceries?filter=need-to-buy')}
              className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-secondary font-medium">Need to Buy</span>
              </div>
              <span className="font-mono font-bold text-blue-400">
                {formatCount(needToBuy, 'Item')}
              </span>
            </div>

            {urgent > 0 ? (
              <div
                onClick={() => navigate('/groceries?stock=urgent')}
                className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span className="text-secondary font-medium">Urgent</span>
                </div>
                <span className="font-mono font-bold text-rose-400">
                  {formatCount(urgent, 'Item')}
                </span>
              </div>
            ) : (
              <div
                onClick={() => navigate('/groceries')}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors flex items-center justify-between text-muted"
              >
                <span>Stock Restock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
