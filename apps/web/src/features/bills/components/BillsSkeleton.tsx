import React from 'react';

export const BillsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading Bills">
      {/* Header Skeleton */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border-primary/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-secondary/50 rounded-lg" />
          <div className="h-4 w-72 bg-secondary/30 rounded-lg" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-9 w-28 bg-secondary/50 rounded-xl" />
          <div className="h-9 w-24 bg-secondary/50 rounded-xl" />
        </div>
      </div>

      {/* Summary Strip Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-4 sm:p-5 rounded-2xl border-primary/80 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-secondary/40 rounded" />
              <div className="h-7 w-7 bg-secondary/30 rounded-xl" />
            </div>
            <div className="h-7 w-28 bg-secondary/60 rounded" />
            <div className="h-3 w-32 bg-secondary/30 rounded" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="h-9 flex-1 bg-secondary/40 rounded-xl" />
          <div className="h-9 w-36 bg-secondary/40 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 bg-secondary/40 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Rows Skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-panel border border-primary/60 rounded-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-secondary/40" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-secondary/60 rounded" />
                <div className="h-3 w-56 bg-secondary/30 rounded" />
              </div>
            </div>
            <div className="h-6 w-24 bg-secondary/30 rounded-full hidden md:block" />
            <div className="h-6 w-24 bg-secondary/50 rounded" />
            <div className="h-8 w-20 bg-secondary/40 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
