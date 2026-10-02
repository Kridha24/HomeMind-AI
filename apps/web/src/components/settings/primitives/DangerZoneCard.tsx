import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DangerZoneCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({
  title = 'Danger Zone',
  description = 'Irreversible actions that permanently modify or delete account resources.',
  children,
  className = '',
}) => {
  return (
    <section
      aria-label={title}
      className={`rounded-2xl sm:rounded-3xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/15 p-4 sm:p-6 space-y-4 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-rose-200/60 dark:border-rose-900/40">
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-rose-900 dark:text-rose-300">
            {title}
          </h3>
          <p className="text-[11px] sm:text-xs text-rose-700/80 dark:text-rose-400/80">
            {description}
          </p>
        </div>
      </div>
      <div className="divide-y divide-rose-200/50 dark:divide-rose-900/30">{children}</div>
    </section>
  );
};

export default DangerZoneCard;
