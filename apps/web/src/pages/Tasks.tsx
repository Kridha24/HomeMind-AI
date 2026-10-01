import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, AlertTriangle, Trash2, Edit3, Sparkles } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Task } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { AddTaskModal } from '../components/common/AddTaskModal';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tasks');
      const list = Array.isArray(res.data) ? res.data : res.data?.tasks || [];
      setTasks(list);
    } catch (e) {
      console.error(e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await apiClient.put(`/tasks/${id}/status`, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus as any } : t))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" /> Household Chores & Task Hub
          </h1>
          <p className="text-xs text-secondary">
            Assign and complete domestic routines, maintenance, and errands
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-purple-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading household tasks from database...</div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No pending tasks found"
          description="Create recurring chores, maintenance schedules, or one-off reminders for family members."
          actionLabel="+ Add First Task"
          onAction={handleAddNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`glass-panel p-5 border-primary/80 space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-sm ${
                task.status === 'COMPLETED' ? 'opacity-65' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      task.priority === 'URGENT'
                        ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        : task.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                    }`}
                  >
                    {task.priority} Priority
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-1 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                      title="Edit Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  className={`font-bold text-base text-primary ${
                    task.status === 'COMPLETED' ? 'line-through text-muted' : ''
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && <p className="text-xs text-secondary">{task.description}</p>}
              </div>

              <div className="flex items-center justify-between border-t border-primary/60 pt-3 text-xs">
                <span className="text-muted flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-xs ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                      : 'bg-secondary/70 border-primary/80 text-primary hover:bg-secondary'
                  }`}
                >
                  {task.status === 'COMPLETED' ? 'Completed ✓' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        initialData={editingTask}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        onSuccess={fetchTasks}
      />
    </div>
  );
};

export default Tasks;
