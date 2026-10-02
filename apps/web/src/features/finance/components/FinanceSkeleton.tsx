import React from 'react';

export const FinanceSkeleton: React.FC = () => {
  return (
    <div className="glass-panel border-primary/40 rounded-3xl overflow-hidden shadow-sm animate-pulse">
      <div className="p-4 bg-secondary/30 border-b border-primary/30 flex items-center justify-between">
        <div className="h-4 w-32 bg-surface-elevated/80 rounded-md" />
        <div className="h-4 w-16 bg-surface-elevated/80 rounded-md" />
      </div>

      <div className="divide-y divide-primary/10">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-8 w-16 bg-surface-elevated/60 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 bg-surface-elevated/80 rounded-md" />
                <div className="h-3 w-24 bg-surface-elevated/40 rounded-md" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="h-5 w-20 bg-surface-elevated/60 rounded-full" />
              <div className="h-5 w-20 bg-surface-elevated/60 rounded-md" />
            </div>

            <div className="h-5 w-24 bg-surface-elevated/80 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};
