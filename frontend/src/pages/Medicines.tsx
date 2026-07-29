import React, { useState, useEffect } from 'react';
import { Pill, Plus, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Medicine } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { AddMedicineModal } from '../components/common/AddMedicineModal';

export const Medicines: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMedicines = async () => {
    try {
      const res = await apiClient.get('/medicines');
      setMedicines(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/medicines/schedules/${scheduleId}/taken`, { taken: !currentStatus });
      fetchMedicines();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-400" /> Family Medicine & Prescription Intake Tracker
          </h1>
          <p className="text-xs text-slate-400">Prescription dosages, pill counts, doctor details & daily intake schedules</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* List / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading prescription schedules from database...</div>
      ) : medicines.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medicines added"
          description="Keep your family's health on track by adding prescriptions, dosage details, and daily intake schedules with automated reminders."
          actionLabel="+ Add Medicine"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((medicine) => (
            <div
              key={medicine.id}
              className="glass-panel p-5 border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dosage: {medicine.dosage}
                  </span>
                  <h3 className="font-bold text-base text-slate-100 mt-0.5">{medicine.name}</h3>
                  {medicine.doctorName && (
                    <p className="text-xs text-purple-400 font-medium mt-0.5">Prescribed by {medicine.doctorName}</p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-b border-slate-800/80 py-3 text-xs">
                <span className="text-slate-400">Pills Remaining</span>
                <span className="font-bold font-mono text-purple-300">{medicine.stockCount} Pills</span>
              </div>

              {medicine.schedules && medicine.schedules.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">Daily Intake Schedule</span>
                  {medicine.schedules.map((sch) => (
                    <div
                      key={sch.id}
                      onClick={() => handleToggleSchedule(sch.id, sch.taken)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        sch.taken
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-purple-400" /> {sch.timeOfDay}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[11px]">
                        {sch.taken ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : 'Take Pill'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddMedicineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchMedicines}
      />
    </div>
  );
};
