import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Edit3, Sparkles, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'MEDIUM');
      if (initialData.dueDate) {
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
      }
      setIsRecurring(Boolean(initialData.isRecurring));
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
        // Edit existing task
        await apiClient.put(`/tasks/${initialData.id}`, {
          title,
          description,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          isRecurring,
        });
      } else {
        // Create new task
        await apiClient.post('/tasks', {
          title,
          description,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          isRecurring,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save task in database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            {initialData ? <Edit3 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">
              {initialData ? 'Edit Household Task' : 'Add Household Task'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData ? 'Update chore deadline or priority' : 'Assign chore or home maintenance task'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean AC filters, Buy groceries"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task instructions, location, or notes"
              rows={2}
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded bg-secondary border-primary text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <label htmlFor="isRecurring" className="text-xs text-secondary font-medium">
              Recurring Task (Auto-renews when completed)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:bg-secondary/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/25 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{initialData ? 'Update Task' : 'Save Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
