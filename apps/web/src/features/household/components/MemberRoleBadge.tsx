import React from 'react';
import { getRoleConfig } from '../utils/householdFormatters';

interface MemberRoleBadgeProps {
  role?: string;
  className?: string;
  showIcon?: boolean;
}

export const MemberRoleBadge: React.FC<MemberRoleBadgeProps> = ({
  role = 'MEMBER',
  className = '',
  showIcon = true,
}) => {
  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeBg} ${config.textColor} ${config.borderColor} ${className}`}
      title={config.description}
    >
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
