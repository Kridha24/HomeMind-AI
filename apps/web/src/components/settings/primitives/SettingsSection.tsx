import React from 'react';

interface SettingsSectionProps {
  id?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  title,
  description,
  badge,
  action,
  children,
  footer,
}) => {
  return (
    <section
      id={id}
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6 transition-colors"
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2
              id={id ? `${id}-heading` : undefined}
              className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight"
            >
              {title}
            </h2>
            {badge && (
              typeof badge === 'string' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {badge}
                </span>
              ) : (
                badge
              )
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Content */}
      <div className="space-y-3">{children}</div>

      {/* Optional Footer */}
      {footer && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </section>
  );
};

export default SettingsSection;
