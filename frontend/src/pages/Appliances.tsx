import React, { useState, useEffect } from 'react';
import { Tv, Plus, Wrench, Shield, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Appliance } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddApplianceModal } from '../components/common/AddApplianceModal';

export const Appliances: React.FC = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const { format } = useSettingStore();

  const fetchAppliances = async () => {
    try {
      const res = await apiClient.get('/appliances');
      const list = Array.isArray(res.data) ? res.data : (res.data?.appliances || []);
      setAppliances(list);
    } catch (e) {
      console.error(e);
      setAppliances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliances();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Tv className="w-6 h-6 text-cyan-400" /> Home Appliance Telemetry & Warranty Tracker
          </h1>
          <p className="text-xs text-muted">Track equipment purchase dates, warranty countdowns & technician service logs</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Appliance</span>
        </button>
      </div>

      {/* List / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading household appliances from database...</div>
      ) : appliances.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No appliances registered"
          description="Register your ACs, refrigerators, washing machines, and microwave ovens to monitor warranty countdowns and receive predictive maintenance alerts."
          actionLabel="+ Register Appliance"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appliances.map((appliance) => (
            <div
              key={appliance.id}
              className="glass-panel p-5 border-primary space-y-4 hover:border-secondary transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    {appliance.brand}
                  </span>
                  <h3 className="font-bold text-base text-primary mt-0.5">{appliance.name}</h3>
                  {appliance.modelNumber && (
                    <p className="text-xs font-mono text-muted mt-0.5">Model: {appliance.modelNumber}</p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-primary/80 py-3 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Purchased</span>
                  <span className="font-semibold text-primary">{new Date(appliance.purchaseDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Warranty Coverage</span>
                  <span className="font-semibold text-cyan-400">{appliance.warrantyYears} Year Warranty</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddApplianceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAppliances}
      />
    </div>
  );
};
