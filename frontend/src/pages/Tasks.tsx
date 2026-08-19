import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Task } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { AddTaskModal } from '../components/common/AddTaskModal';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/tasks');
      const list = Array.isArray(res.data) ? res.data : (res.data?.tasks || []);
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
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await apiClient.put(`/tasks/${id}/status`, { status: newStatus });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" /> Household Tasks & Chores Workspace
          </h1>
          <p className="text-xs text-muted">Assign recurring chores, maintenance tasks & family task workspace</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* List / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading household tasks from database...</div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No household tasks"
          description="Keep your household organized by creating tasks, setting priorities, and assigning chores to family members."
          actionLabel="+ Add Task"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`glass-panel p-5 border-primary space-y-4 hover:border-secondary transition-all ${
                task.status === 'COMPLETED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      task.priority === 'URGENT'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <h3
                    className={`font-bold text-base text-primary ${
                      task.status === 'COMPLETED' ? 'line-through text-muted' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && <p className="text-xs text-muted">{task.description}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-primary/80 pt-3 text-xs">
                <span className="text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-panel border-primary text-secondary hover:text-white'
                  }`}
                >
                  {task.status === 'COMPLETED' ? 'Completed ✓' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
};
