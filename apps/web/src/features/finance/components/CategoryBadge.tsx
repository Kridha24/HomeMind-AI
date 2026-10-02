import React from 'react';
import { getCategoryIcon, getCategoryColor } from '../utils/financeFormatters';

interface CategoryBadgeProps {
  category?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = '',
  showIcon = true,
}) => {
  const displayCategory = category?.trim() || 'Uncategorized';
  const Icon = getCategoryIcon(displayCategory);
  const colors = getCategoryColor(displayCategory);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="truncate max-w-[130px]">{displayCategory}</span>
    </span>
  );
};
