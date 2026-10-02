import React from 'react';

export const GroceriesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="glass-panel p-6 rounded-3xl border border-primary/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-secondary/60 rounded-xl" />
            <div className="h-4 w-72 bg-secondary/40 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
            <div className="h-10 w-28 bg-secondary/60 rounded-xl" />
          </div>
        </div>
        <div className="h-10 w-full bg-secondary/40 rounded-xl" />
      </div>

      {/* 4 Summary Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl border border-primary/40 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-secondary/60 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-secondary/50" />
            </div>
            <div className="h-8 w-16 bg-secondary/70 rounded-lg" />
            <div className="h-3 w-28 bg-secondary/40 rounded-md" />
          </div>
        ))}
      </div>

      {/* Progress Strip Skeleton */}
      <div className="glass-panel p-4 rounded-2xl border border-primary/40 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-secondary/60 rounded-md" />
          <div className="h-4 w-24 bg-secondary/50 rounded-md" />
        </div>
        <div className="h-2.5 w-full bg-secondary/40 rounded-full" />
      </div>

      {/* Filters Bar Skeleton */}
      <div className="h-11 w-full bg-secondary/40 rounded-2xl" />

      {/* Item Rows Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-primary/40 bg-panel/50 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-6 h-6 rounded-lg bg-secondary/60 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-secondary/70 rounded-md" />
                <div className="h-3 w-24 bg-secondary/40 rounded-md" />
              </div>
            </div>
            <div className="h-8 w-24 bg-secondary/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
