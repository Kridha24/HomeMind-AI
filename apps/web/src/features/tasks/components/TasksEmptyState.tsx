import React from 'react';
import { CheckCircle2, Calendar, CheckSquare, Plus, SearchX, Sparkles } from 'lucide-react';
import { TaskTab } from '../hooks/useTaskFilters';

interface TasksEmptyStateProps {
  activeTab: TaskTab;
  hasFilters: boolean;
  onClearFilters: () => void;
  onAddTask: () => void;
}

export const TasksEmptyState: React.FC<TasksEmptyStateProps> = ({
  activeTab,
  hasFilters,
  onClearFilters,
  onAddTask,
}) => {
  if (hasFilters) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-primary/80 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary/80 text-secondary flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-primary">
            No matching tasks found
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Try adjusting or clearing your search term, priority, or assignee filters.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-primary text-xs font-bold border border-primary/60 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  // Today view empty state
  if (activeTab === 'today') {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-primary/80 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-primary">
            No tasks due today
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Everything scheduled for today is taken care of! Enjoy your day or plan upcoming household routines.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    );
  }

  // Completed tab empty state
  if (activeTab === 'completed') {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-primary/80 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary/80 text-secondary flex items-center justify-center mx-auto">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-primary">
            No completed tasks yet
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Tasks marked as done will appear here with completion timestamps.
          </p>
        </div>
      </div>
    );
  }

  // Assigned to me tab empty state
  if (activeTab === 'assigned-me') {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-primary/80 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-primary">
            No tasks assigned to you
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            You currently have no pending tasks assigned. You can assign chores to yourself or add a new task.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    );
  }

  // Default / All Tasks empty state (Section 44)
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-primary/80 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-base text-primary">
          Everything's handled.
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Your household has no pending tasks. Keep things tidy by adding regular routines or maintenance reminders.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddTask}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/25 active:scale-95 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    </div>
  );
};
