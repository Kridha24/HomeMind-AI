import React from 'react';

interface SettingsNavItemProps {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}

export const SettingsNavItem: React.FC<SettingsNavItemProps> = ({
  id,
  label,
  description,
  icon: Icon,
  isActive,
  badge,
  onClick,
}) => {
  return (
    <button
      id={`settings-nav-${id}`}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`settings-panel-${id}`}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-180 relative group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
        isActive
          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
      }`}
    >
      {/* Left Active Accent Pill */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#3b82f6]"
        />
      )}

      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-transform duration-180 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 scale-105'
            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
        }`}
      />

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
