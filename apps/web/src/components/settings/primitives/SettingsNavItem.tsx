import React from 'react';
import { SemanticColor, semanticColorMap } from '../../common/IconTile';

interface SettingsNavItemProps {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  isActive: boolean;
  badge?: string;
  accent?: SemanticColor;
  onClick: () => void;
}

export const SettingsNavItem: React.FC<SettingsNavItemProps> = ({
  id,
  label,
  description,
  icon: Icon,
  isActive,
  badge,
  accent = 'blue',
  onClick,
}) => {
  const colorToken = semanticColorMap[accent] || semanticColorMap.blue;

  return (
    <button
      id={`settings-nav-${id}`}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`settings-panel-${id}`}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-180 relative group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 hover:-translate-y-px ${
        isActive
          ? `${colorToken.bg} ${colorToken.text} font-bold border ${colorToken.border} shadow-2xs`
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
      }`}
    >
      {/* Left Active Accent Pill */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-current shadow-[0_0_8px_currentColor]"
        />
      )}

      {/* Semantic Icon Badge */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-180 ${
          colorToken.bg
        } ${colorToken.border} ${colorToken.text} ${
          isActive ? 'scale-105 shadow-xs' : 'group-hover:scale-105'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-xs block truncate leading-tight">{label}</span>
        {description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate leading-tight mt-0.5 font-normal">
            {description}
          </span>
        )}
      </div>

      {badge && (
        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20 flex-shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
};

export default SettingsNavItem;
