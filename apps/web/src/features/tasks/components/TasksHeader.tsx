import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  List,
  RotateCw,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';

interface TasksHeaderProps {
  onAddTask: () => void;
  onQuickAdd: (title: string) => Promise<void>;
  isQuickAdding?: boolean;
  viewMode: 'list' | 'calendar';
  onToggleViewMode: (mode: 'list' | 'calendar') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
  onAddTask,
  onQuickAdd,
  isQuickAdding = false,
  viewMode,
  onToggleViewMode,
  onRefresh,
  isRefreshing = false,
}) => {
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isQuickAdding) return;
    const title = quickTitle.trim();
    setQuickTitle('');
    await onQuickAdd(title);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-panel border border-primary/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span>Tasks & Chores</span>
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Organize household responsibilities and keep everyone on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* List / Calendar View Toggle */}
          <div className="flex items-center bg-secondary/70 border border-primary/80 p-0.5 rounded-2xl">
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-panel text-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-panel text-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Calendar view"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-panel border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/60 transition-colors disabled:opacity-50"
            title="Refresh tasks"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* + Add Task Button */}
          <button
            type="button"
            onClick={onAddTask}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-purple-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickSubmit} className="relative">
        <div className="flex items-center bg-panel border border-primary/80 rounded-2xl px-4 py-2 shadow-xs focus-within:border-purple-500/80 transition-colors">
          <Sparkles className="w-4 h-4 text-purple-500 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add: e.g. Buy cylinder, Clean refrigerator, Pay electricity bill..."
            disabled={isQuickAdding}
            className="w-full bg-transparent text-xs sm:text-sm text-primary placeholder-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim() || isQuickAdding}
            className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary/80 text-secondary hover:text-primary hover:bg-secondary border border-primary/60 text-[11px] font-semibold transition-colors disabled:opacity-40"
          >
            <CornerDownLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Enter</span>
          </button>
        </div>
      </form>
    </div>
  );
};
