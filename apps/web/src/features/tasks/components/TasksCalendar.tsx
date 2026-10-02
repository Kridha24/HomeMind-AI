import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { Task, HouseholdMember } from '../../../types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { getDueDateStatus } from '../utils/taskFormatters';

interface TasksCalendarProps {
  tasks: Task[];
  members: HouseholdMember[];
  onSelectTask: (task: Task) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
}

export const TasksCalendar: React.FC<TasksCalendarProps> = ({
  tasks,
  members,
  onSelectTask,
  onToggleStatus,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayMonth = () => {
    setCurrentDate(new Date());
  };

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Today string
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Month Navigation Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-panel border border-primary/80">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base sm:text-lg font-black text-primary">
            {monthName} {year}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={todayMonth}
            className="px-3 py-1.5 rounded-xl border border-primary/80 text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block rounded-2xl bg-panel border border-primary/80 p-3 overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted pb-2 border-b border-primary/40">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] p-1.5 rounded-xl opacity-30 bg-secondary/20" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateKey === todayKey;
            const dayTasks = tasksByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-purple-500/50 bg-purple-500/[0.04]'
                    : dayTasks.length > 0
                    ? 'border-primary/80 bg-secondary/30'
                    : 'border-primary/40 bg-secondary/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-purple-600 text-white font-black'
                        : 'text-secondary'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-muted">
                      {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {/* Day tasks badges */}
                <div className="space-y-1 overflow-y-auto max-h-[70px] scrollbar-none">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md truncate cursor-pointer font-medium flex items-center gap-1 border ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 line-through'
                          : 'bg-panel border-primary/60 text-primary hover:border-purple-500/60'
                      }`}
                      title={t.title}
                    >
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-muted text-center font-semibold">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Agenda List */}
      <div className="block md:hidden space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary px-1">
          Agenda For {monthName}
        </h3>
        {Object.keys(tasksByDate).length === 0 ? (
          <div className="p-6 text-center text-xs text-muted rounded-2xl bg-panel border border-primary/80">
            No scheduled tasks with due dates in {monthName}.
          </div>
        ) : (
          Object.entries(tasksByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dayTasks]) => {
              const d = new Date(dateKey + 'T00:00:00');
              const isToday = dateKey === todayKey;

              return (
                <div key={dateKey} className="rounded-2xl bg-panel border border-primary/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-primary/50 pb-2">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-purple-600 dark:text-purple-400' : 'text-primary'
                      }`}
                    >
                      {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {isToday && ' (Today)'}
                    </span>
                    <span className="text-[11px] text-muted font-medium">
                      {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/50 border border-primary/40 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(t.id, t.status);
                            }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-400 bg-secondary'
                            }`}
                          >
                            {t.status === 'COMPLETED' && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <span
                            className={`text-xs font-semibold text-primary truncate ${
                              t.status === 'COMPLETED' ? 'line-through text-muted' : ''
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <TaskPriorityBadge priority={t.priority} showIcon={false} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
