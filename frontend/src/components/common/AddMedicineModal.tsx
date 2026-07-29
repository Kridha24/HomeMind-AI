import React, { useState } from 'react';
import { X, Pill } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [stockCount, setStockCount] = useState('30');
  const [expiryDate, setExpiryDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [scheduleTimes, setScheduleTimes] = useState('08:30, 20:00');
  const [memberAssignee, setMemberAssignee] = useState('Self');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expiryDate) return;
    setLoading(true);
    setError('');

    const schedules = scheduleTimes
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((timeOfDay) => ({ timeOfDay, memberAssignee }));

    try {
      await apiClient.post('/medicines', {
        name,
        dosage,
        stockCount: parseInt(stockCount, 10),
        expiryDate,
        doctorName,
        schedules,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save medicine prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Add Medicine Prescription</h3>
            <p className="text-xs text-slate-400">Save prescription details & daily dose times</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Medicine Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Paracetamol / Amoxicillin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dosage</label>
              <input
                type="text"
                required
                placeholder="500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Stock Pill Count</label>
              <input
                type="number"
                required
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Doctor Name</label>
              <input
                type="text"
                placeholder="Dr. Smith"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Daily Schedule Times (Comma-separated)</label>
            <input
              type="text"
              placeholder="08:30, 20:00"
              value={scheduleTimes}
              onChange={(e) => setScheduleTimes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all mt-2"
          >
            {loading ? 'Registering Prescription...' : '+ Register Medicine Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};
