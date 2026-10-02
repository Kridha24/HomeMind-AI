import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Edit3, Sparkles, Check, Calendar, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Task, HouseholdMember } from '../../../types';
import { formatDateForInput } from '../utils/taskFormatters';
import { TaskPriority } from '../utils/taskStatus';

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    id?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    assigneeId?: string | null;
    isRecurring?: boolean;
  }) => Promise<void>;
  initialData?: Task | null;
  members: HouseholdMember[];
}

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  members,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('UNASSIGNED');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority((initialData.priority as TaskPriority) || 'MEDIUM');
      setDueDate(formatDateForInput(initialData.dueDate) || formatDateForInput(new Date()));
      setAssigneeId(initialData.assigneeId || 'UNASSIGNED');
      setIsRecurring(Boolean(initialData.isRecurring));
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate(formatDateForInput(new Date()));
      setAssigneeId('UNASSIGNED');
      setIsRecurring(false);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setError('Title and due date are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await onSave({
        id: initialData?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: new Date(dueDate).toISOString(),
        assigneeId: assigneeId === 'UNASSIGNED' ? null : assigneeId,
        isRecurring,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save household task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            {initialData ? <Edit3 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">
              {initialData ? 'Edit Household Task' : 'Add Household Task & Chore'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData
                ? 'Update deadline, priority, or assigned member'
                : 'Organize domestic responsibilities and schedules'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Change AC filters, Clean refrigerator, Take out recycling"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primary placeholder-muted focus:outline-none focus:border-purple-500 font-medium transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specific instructions, location, tools needed..."
              rows={2}
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-primary placeholder-muted focus:outline-none focus:border-purple-500 font-medium transition-colors"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary font-medium focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Assignee Selection (Strictly Real Household Members) */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Assigned Household Member</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary font-medium focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="UNASSIGNED">Unassigned (Anyone in household)</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Recurrence Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="modalRecurringCheckbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded bg-secondary border-primary text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="modalRecurringCheckbox"
              className="text-xs text-secondary font-medium cursor-pointer"
            >
              Recurring Chore (Keep as recurring routine)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary/60">
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
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{initialData ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
