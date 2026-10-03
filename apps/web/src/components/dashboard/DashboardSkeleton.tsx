import React from 'react';

interface DashboardSkeletonProps {
  showFinancials?: boolean;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ showFinancials = false }) => {
  return (
    <div
      className="space-y-4 sm:space-y-6 md:space-y-8 animate-pulse pb-12"
      aria-label="Loading Household Command Center"
    >
      {/* Header skeleton */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-slate-850 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-slate-100 dark:bg-slate-850 rounded-xl" />
            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-850 rounded-xl" />
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 h-4 w-48 bg-slate-100 dark:bg-slate-850 rounded" />
      </div>

      {/* Quick actions skeleton */}
      <div className="h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-24 bg-slate-200/60 dark:bg-slate-800 rounded-xl flex-shrink-0"
          />
        ))}
      </div>

      {/* 5 Financial Cards skeleton — ONLY for authorized Owner/Co-Owner (Part 46) */}
      {showFinancials && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3 ${
                i === 5 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-slate-200/80 dark:bg-slate-800 rounded-md" />
                <div className="h-7 w-7 bg-slate-100 dark:bg-slate-850 rounded-xl" />
              </div>
              <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Today at a glance skeleton */}
      <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4" />

      {/* 2-column bills & tasks skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="h-64 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-slate-100 dark:bg-slate-850 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="h-64 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-slate-100 dark:bg-slate-850 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
