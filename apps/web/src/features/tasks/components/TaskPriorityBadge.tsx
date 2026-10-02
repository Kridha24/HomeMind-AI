import React from 'react';
import { PRIORITY_CONFIGS, TaskPriority } from '../utils/taskStatus';

interface TaskPriorityBadgeProps {
  priority?: string;
  className?: string;
  showIcon?: boolean;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority = 'MEDIUM',
  className = '',
  showIcon = true,
}) => {
  const config = PRIORITY_CONFIGS[priority as TaskPriority] || PRIORITY_CONFIGS.MEDIUM;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeBg} ${config.textColor} ${config.borderColor} ${className}`}
      title={`${config.label} priority`}
    >
      {showIcon && <Icon className="w-2.5 h-2.5 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
