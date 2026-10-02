import React from 'react';
import { STATUS_CONFIGS, TaskStatus } from '../utils/taskStatus';

interface TaskStatusBadgeProps {
  status?: string;
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status = 'PENDING', className = '' }) => {
  const config = STATUS_CONFIGS[status as TaskStatus] || STATUS_CONFIGS.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeBg} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
