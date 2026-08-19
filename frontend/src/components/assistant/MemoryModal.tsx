import React, { useState, useEffect } from 'react';
import { Brain, X, Plus, Trash2, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  importance: string;
  createdAt: string;
}

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('PREFERENCE');
  const [submitting, setSubmitting] = useState(false);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/assistant/memories');
      setMemories(res.data.memories || []);
    } catch (e) {
      console.warn('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post('/assistant/memories', {
        content: newContent.trim(),
        type: newType,
        importance: 'HIGH',
      });
      if (res.data.memory) {
        setMemories([res.data.memory, ...memories]);
        setNewContent('');
      }
    } catch (e) {
      console.error('Failed to add memory:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/assistant/memories/${id}`);
      setMemories(memories.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-white/[0.1] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">AI Household Memories</h3>
              <p className="text-[11px] text-slate-400">Manage facts, preferences, and household rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Add New Household Memory
          </span>
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="PREFERENCE">Preference</option>
              <option value="ROUTINE">Routine</option>
              <option value="HOUSEHOLD_RULE">Rule</option>
              <option value="NOTE">Note</option>
            </select>
            <input
              type="text"
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. We usually buy groceries on Saturday morning"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </form>

        {/* Memory List */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Loading stored memories...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No custom memories stored yet. You can add one above or tell HomeMind in chat!
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.05] hover:border-slate-800 flex items-start justify-between gap-3 group transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {m.type}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {m.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg opacity-80 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Security & Consent Footer */}
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>HomeMind only accesses user-approved memories strictly within your private household.</span>
        </div>

      </div>
    </div>
  );
};
