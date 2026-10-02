import React from 'react';

interface SettingsRowProps {
  label: string;
  description?: string;
  icon?: React.ElementType | React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  icon,
  children,
  disabled = false,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
      );
    }
    const IconComp = icon as React.ElementType;
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
        <IconComp className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {renderIcon()}
        <div className="space-y-0.5 min-w-0">
          <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block truncate">
            {label}
          </label>
          {description && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
        {children}
      </div>
    </div>
  );
};

export default SettingsRow;
