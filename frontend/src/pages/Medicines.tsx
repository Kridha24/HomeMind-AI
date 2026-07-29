import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, Circle, Calendar, User } from 'lucide-react';
import apiClient from '../services/apiClient';

export const Medicines: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await apiClient.get('/medicines');
      setMedicines(res.data.medicines);
    } catch (e) {
      setMedicines([
        {
          id: '1',
          name: 'Multivitamin Complex',
          dosage: '1 Tablet',
          stockCount: 28,
          expiryDate: '2027-01-01',
          doctorName: 'Dr. Emily Vance',
          schedules: [
            { id: 's1', timeOfDay: '08:30', memberAssignee: 'Alex Rivera', taken: false }
          ]
        }
      ]);
    }
  };

  const toggleTaken = async (schedId: string) => {
    try {
      await apiClient.put(`/medicines/schedules/${schedId}/taken`);
      fetchMedicines();
    } catch (e) {
      setMedicines(prev => prev.map(m => ({
        ...m,
        schedules: m.schedules.map((s: any) => s.id === schedId ? { ...s, taken: !s.taken } : s)
      })));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Family Medicine & Prescription Tracker
          <Pill className="w-5 h-5 text-pink-400" />
        </h1>
        <p className="text-xs text-slate-400">Track prescriptions, pill counts, expiry alerts, doctor details and intake schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((med) => (
          <div key={med.id} className="glass-panel p-5 space-y-4 border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  {med.dosage}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-1">{med.name}</h3>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {med.stockCount} Pills Left
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" /> Doctor: {med.doctorName || 'General Practitioner'}</p>
              <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Expiry: {med.expiryDate.split('T')[0]}</p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Daily Intake Schedule:</h4>
              {med.schedules?.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => toggleTaken(s.id)}
                  className={`glass-card p-3 flex items-center justify-between cursor-pointer transition-all ${
                    s.taken ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {s.taken ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{s.timeOfDay}</span>
                      <span className="text-[10px] text-slate-400 block">{s.memberAssignee}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.taken ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'}`}>
                    {s.taken ? 'TAKEN' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
