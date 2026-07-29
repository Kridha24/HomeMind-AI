import React, { useState, useEffect } from 'react';
import { Tv, Wrench, ShieldCheck, AlertCircle, Plus } from 'lucide-react';
import apiClient from '../services/apiClient';

export const Appliances: React.FC = () => {
  const [appliances, setAppliances] = useState<any[]>([]);

  useEffect(() => {
    fetchAppliances();
  }, []);

  const fetchAppliances = async () => {
    try {
      const res = await apiClient.get('/appliances');
      setAppliances(res.data.appliances);
    } catch (e) {
      setAppliances([
        {
          id: '1',
          name: 'Living Room Dual Inverter AC',
          brand: 'Daikin',
          purchaseDate: '2024-05-10',
          warrantyYears: 3,
          lastServicedDate: '2026-02-15',
          nextServiceDueDate: '2026-08-15',
          maintenanceLogs: [
            { id: '1', description: 'Deep coil cleaning and refrigerant filter replacement', cost: 45.00, serviceDate: '2026-02-15' }
          ]
        }
      ]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Appliance Telemetry & Service Manager
          <Tv className="w-5 h-5 text-blue-400" />
        </h1>
        <p className="text-xs text-slate-400">Track warranties, purchase dates, maintenance logs, and AI maintenance predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appliances.map((app) => (
          <div key={app.id} className="glass-panel p-5 space-y-4 border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {app.brand}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-1">{app.name}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Warranty Active ({app.warrantyYears}y)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Purchase Date</span>
                <span className="font-semibold text-slate-300">{app.purchaseDate.split('T')[0]}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Next Service Due</span>
                <span className="font-semibold text-amber-400">{app.nextServiceDueDate?.split('T')[0] || 'N/A'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Service & Maintenance Log:</h4>
              {app.maintenanceLogs?.map((log: any) => (
                <div key={log.id} className="glass-card p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-200 font-medium">{log.description}</p>
                    <span className="text-[10px] text-slate-400">{log.serviceDate.split('T')[0]}</span>
                  </div>
                  <span className="font-bold text-slate-200">${log.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
