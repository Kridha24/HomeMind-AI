import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/tasks');
      setTasks(res.data.tasks);
    } catch (e) {
      setTasks([
        { id: '1', title: 'Clean HVAC Filters', description: 'Clean dust mesh in living room AC unit', priority: 'HIGH', status: 'PENDING', dueDate: '2026-08-02', assignee: { name: 'Sarah Rivera' } },
        { id: '2', title: 'Pay Electricity Utility Bill', description: 'Pay before discount deadline', priority: 'URGENT', status: 'PENDING', dueDate: '2026-08-05', assignee: { name: 'Alex Rivera' } },
        { id: '3', title: 'Organize Recycling Bins', description: 'Separate glass and paper', priority: 'LOW', status: 'COMPLETED', dueDate: '2026-07-28', assignee: { name: 'Leo Rivera' } }
      ]);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    try {
      await apiClient.put(`/tasks/${id}/status`, { status: nextStatus });
    } catch (e) {}
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Household Task Workspace
          <CheckSquare className="w-5 h-5 text-blue-400" />
        </h1>
        <p className="text-xs text-slate-400">Assign tasks to family members, track priority, recurrence and due dates</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`glass-panel p-4 flex items-center justify-between transition-all ${
              task.status === 'COMPLETED' ? 'opacity-60 bg-slate-900/30' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className={`p-2 rounded-xl border transition-colors ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <div>
                <h3 className={`font-semibold text-sm ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span>{task.assignee?.name || 'Unassigned'}</span>
              </div>
              <span className={`font-bold px-2.5 py-1 rounded-lg text-[10px] border ${
                task.priority === 'URGENT'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : task.priority === 'HIGH'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
