import React from 'react';

export const TasksSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-secondary/60 border border-primary/40 p-4" />
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-primary/40 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 rounded-xl bg-secondary/50" />
        ))}
      </div>

      {/* Task Rows Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-panel border border-primary/60 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-secondary/80" />
              <div className="space-y-2">
                <div className="h-4 w-48 bg-secondary/80 rounded-md" />
                <div className="h-3 w-28 bg-secondary/50 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-secondary/80 rounded-full" />
              <div className="h-6 w-20 bg-secondary/60 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
