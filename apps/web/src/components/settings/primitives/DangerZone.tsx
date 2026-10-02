import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DangerZoneProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  title = 'Danger Zone',
  description = 'Irreversible actions that permanently modify or delete account resources.',
  children,
}) => {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-rose-300/80 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/15 p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-rose-200/60 dark:border-rose-900/40">
        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-300">
            {title}
          </h3>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
            {description}
          </p>
        </div>
      </div>
      <div className="divide-y divide-rose-200/50 dark:divide-rose-900/30">{children}</div>
    </div>
  );
};
