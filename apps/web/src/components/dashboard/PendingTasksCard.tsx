import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Circle, CheckCircle2, Clock, Plus, Sparkles } from 'lucide-react';

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
  const [completingIds, setCompletingIds] = useState<Record<string, boolean>>({});

  const handleToggle = async (taskId: string) => {
    // 1. Optimistic local animation trigger
    setCompletingIds((prev) => ({ ...prev, [taskId]: true }));
    try {
      await onCompleteTask(taskId);
    } catch (err) {
      // 2. Rollback on failure as required
      console.error('Task completion failed, rolling back UI', err);
      setCompletingIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const getPriorityBadge = (priority?: string, dueDateStr?: string) => {
    const isOverdue = dueDateStr && new Date(dueDateStr) < new Date();

    if (isOverdue) {
      return (
        <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          Overdue
        </span>
      );
    }

    if (priority === 'URGENT') {
      return (
        <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
          Urgent
        </span>
      );
    }

    if (priority === 'HIGH') {
      return (
        <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          High
        </span>
      );
    }

    return (
      <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Normal
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500/[0.06] via-purple-500/[0.02] to-white dark:from-violet-950/25 dark:via-slate-900 dark:to-slate-900 border border-violet-500/25 dark:border-violet-500/35 p-4 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4">
      {/* Luminous Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-400 opacity-90" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-violet-500/15 dark:border-violet-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                Pending Tasks & Chores
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Daily maintenance, routines & grocery runs
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-base sm:text-xl font-extrabold text-violet-600 dark:text-violet-400 font-mono block">
              {tasks.length}
            </span>
            <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Pending
            </span>
          </div>
        </div>

        {/* Rows */}
        {tasks.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
            <AnimatePresence mode="popLayout">
              {tasks.slice(0, 4).map((task) => {
                const isCompleting = !!completingIds[task.id];
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                    className={`py-2.5 sm:py-3 flex items-center justify-between gap-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors ${
                      isCompleting ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggle(task.id)}
                        disabled={isCompleting}
                        className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-0.5 rounded-full flex-shrink-0 focus:outline-none"
                        title="Mark Complete"
                        aria-label={`Mark task ${task.title} as completed`}
                      >
                        {isCompleting ? (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-emerald-500"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <Circle className="w-4 h-4 hover:stroke-emerald-500 transition-colors" />
                        )}
                      </button>

                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getPriorityBadge(task.priority, task.dueDate)}
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(task.id)}
                      disabled={isCompleting}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-500/25 rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-2xs flex-shrink-0"
                    >
                      {isCompleting ? 'Saving...' : 'Done'}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-7 text-center space-y-1">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto opacity-80" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              All tasks completed! ✨
            </p>
            <p className="text-[11px] text-slate-400">
              Your household is up to date with no pending routines.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} remaining
        </span>
        <button
          onClick={onAddTask}
          className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Task
        </button>
      </div>
    </div>
  );
};
