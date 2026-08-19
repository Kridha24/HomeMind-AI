import React from 'react';
import { Leaf, Award, Zap, Droplet, Recycle, Sparkles } from 'lucide-react';

export const Sustainability: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          Household Sustainability Operating System
          <Leaf className="w-5 h-5 text-emerald-400" />
        </h1>
        <p className="text-xs text-muted">Carbon footprint reduction, food waste minimization and eco-efficiency rating</p>
      </div>

      {/* Main Score Hero Card */}
      <div className="glass-panel p-6 border-emerald-500/40 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Overall Eco Grade</span>
          <h2 className="text-4xl font-extrabold text-primary">86.5 <span className="text-lg text-emerald-400 font-normal">/ 100 (A Rating)</span></h2>
          <p className="text-xs text-secondary">Your household is in the top 12% most energy-efficient residences in San Francisco.</p>
        </div>
        <div className="w-32 h-32 rounded-full border-4 border-emerald-400/40 flex items-center justify-center bg-emerald-500/10 shadow-2xl shadow-emerald-500/20">
          <Leaf className="w-12 h-12 text-emerald-400" />
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 space-y-2 border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400">
            <Recycle className="w-4 h-4" />
            <h3 className="font-semibold text-xs text-primary">Food Waste Reduced</h3>
          </div>
          <p className="text-2xl font-bold text-primary">1.8 kg / mo</p>
          <p className="text-[11px] text-emerald-400">-42% vs national average</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400">
            <Zap className="w-4 h-4" />
            <h3 className="font-semibold text-xs text-primary">Electricity Footprint</h3>
          </div>
          <p className="text-2xl font-bold text-primary">340 kWh</p>
          <p className="text-[11px] text-muted">Off-peak shift active</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400">
            <Droplet className="w-4 h-4" />
            <h3 className="font-semibold text-xs text-primary">Water Conservation</h3>
          </div>
          <p className="text-2xl font-bold text-primary">4,200 Litres</p>
          <p className="text-[11px] text-blue-400">Optimal flow aerators installed</p>
        </div>
      </div>
    </div>
  );
};
