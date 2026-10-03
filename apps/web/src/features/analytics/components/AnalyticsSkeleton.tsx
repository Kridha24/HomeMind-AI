import React from 'react';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      {/* Header Skeleton */}
      <div className="glass-panel p-6 border-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-secondary/80 rounded-xl"></div>
          <div className="h-4 w-96 bg-secondary/60 rounded-lg"></div>
        </div>
        <div className="h-8 w-44 bg-secondary/60 rounded-xl"></div>
      </div>

      {/* Filter Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-secondary/60 rounded-xl"></div>
        ))}
      </div>

      {/* Top 4 Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-6 border-primary space-y-3">
            <div className="h-4 w-28 bg-secondary/60 rounded"></div>
            <div className="h-8 w-36 bg-secondary/80 rounded-lg"></div>
            <div className="h-3 w-32 bg-secondary/40 rounded"></div>
          </div>
        ))}
      </div>

      {/* Middle Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-primary h-72 space-y-4">
          <div className="h-5 w-44 bg-secondary/60 rounded"></div>
          <div className="h-48 w-full bg-secondary/30 rounded-2xl"></div>
        </div>
        <div className="glass-panel p-6 border-primary h-72 space-y-4">
          <div className="h-5 w-44 bg-secondary/60 rounded"></div>
          <div className="h-48 w-full bg-secondary/30 rounded-2xl"></div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-6 border-primary h-64 space-y-4">
            <div className="h-4 w-36 bg-secondary/60 rounded"></div>
            <div className="h-40 w-full bg-secondary/30 rounded-2xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
