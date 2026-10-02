import React from 'react';
import { Task, HouseholdMember } from '../../../types';
import { TaskRow } from './TaskRow';
import { TaskCard } from './TaskCard';

interface TaskGroupProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  tasks: Task[];
  members: HouseholdMember[];
  currentUserId?: string;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  isMutating?: boolean;
}

export const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  badge,
  badgeColor = 'bg-secondary text-secondary border-primary/60',
  tasks,
  members,
  currentUserId,
  onToggleStatus,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  isMutating = false,
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {/* Group Header */}
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
          {title}
        </h3>
        {badge && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
        <span className="text-[11px] text-muted font-medium">({tasks.length})</span>
      </div>

      {/* Desktop List */}
      <div className="hidden sm:flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            members={members}
            currentUserId={currentUserId}
            onToggleStatus={onToggleStatus}
            onSelectTask={onSelectTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            isMutating={isMutating}
          />
        ))}
      </div>

      {/* Mobile Card Grid */}
      <div className="flex sm:hidden flex-col gap-2.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            currentUserId={currentUserId}
            onToggleStatus={onToggleStatus}
            onSelectTask={onSelectTask}
            isMutating={isMutating}
          />
        ))}
      </div>
    </div>
  );
};
