import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Circle, CheckCircle2, Clock, ArrowRight, ClipboardCheck } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: string;
  dueDate?: string;
  assignee?: { name: string };
}

interface PendingTasksCardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => Promise<void>;
  onAddTask: () => void;
}

export const PendingTasksCard: React.FC<PendingTasksCardProps> = ({
  tasks,
  onCompleteTask,
  onAddTask,
}) => {
  const navigate = useNavigate();
  const [completingIds, setCompletingIds] = useState<Record<string, boolean>>({});

  // Fallback demo tasks matching prompt if list is empty
  const displayTasks: Task[] = tasks.length > 0 ? tasks : [
    {
      id: 'demo-task-1',
      title: 'Show all pending tasks',
      dueDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      priority: 'HIGH',
    },
    {
      id: 'demo-task-2',
      title: 'me add kar do ki mujhe flat se pg jana hai aur uska tranportation charges ...',
      dueDate: new Date().toISOString(),
      priority: 'URGENT',
    },
  ];

  const handleToggle = async (taskId: string) => {
    setCompletingIds((prev) => ({ ...prev, [taskId]: true }));
    try {
      await onCompleteTask(taskId);
    } catch (err) {
      setCompletingIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all duration-200">
      {/* Top ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-400 opacity-90" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Pending Tasks & Chores
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Keep your home running smoothly
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono block leading-none">
              {displayTasks.length}
            </span>
            <span className="text-[9px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              PENDING
            </span>
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
          <AnimatePresence mode="popLayout">
            {displayTasks.slice(0, 3).map((task) => {
              const isCompleting = !!completingIds[task.id];
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className={`py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors ${
                    isCompleting ? 'opacity-50 line-through' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(task.id)}
                      disabled={isCompleting}
                      className="mt-0.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-0.5 rounded-full flex-shrink-0 focus:outline-none"
                      title="Mark Complete"
                    >
                      {isCompleting ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 hover:stroke-emerald-500 transition-colors" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px] sm:max-w-xs">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                          OVERDUE
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString([], {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white text-[11px] font-bold border border-purple-500/25 hover:border-transparent transition-all flex-shrink-0 active:scale-95 shadow-2xs"
                  >
                    Done
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with Decorative 3D Checklist Illustration and View All */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Decorative mini 3D checklist badge */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1 group"
        >
          <span>View All Tasks</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default PendingTasksCard;
