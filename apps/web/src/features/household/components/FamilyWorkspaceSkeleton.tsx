import React from 'react';

export const FamilyWorkspaceSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading family workspace">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-muted/60 rounded-xl" />
          <div className="h-9 w-32 bg-muted/60 rounded-xl" />
        </div>
      </div>

      {/* Hero Card skeleton */}
      <div className="h-44 bg-muted/40 rounded-2xl border border-border/60" />

      {/* Summary grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted/40 rounded-2xl border border-border/60" />
        ))}
      </div>

      {/* Member list skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-muted/60 rounded" />
          <div className="h-8 w-48 bg-muted/40 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl border border-border/40" />
          ))}
        </div>
      </div>

      {/* Bottom sections skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-muted/40 rounded-2xl border border-border/60" />
        <div className="h-64 bg-muted/40 rounded-2xl border border-border/60" />
      </div>
    </div>
  );
};
