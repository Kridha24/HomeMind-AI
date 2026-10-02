import React from 'react';

interface SettingsCardProps {
  id?: string;
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  id,
  title,
  description,
  badge,
  action,
  children,
  footer,
  className = '',
}) => {
  return (
    <section
      id={id}
      aria-labelledby={id && title ? `${id}-heading` : undefined}
      className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden p-4 sm:p-6 transition-all duration-200 ${className}`}
    >
      {(title || action || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {title && (
                <h2
                  id={id ? `${id}-heading` : undefined}
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  {title}
                </h2>
              )}
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
      )}

      <div className="space-y-4 pt-2">{children}</div>

      {footer && (
        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </section>
  );
};

export default SettingsCard;
