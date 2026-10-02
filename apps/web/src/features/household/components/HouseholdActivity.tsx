import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, ArrowUpRight, Shield } from 'lucide-react';
import { HouseholdActivity as HouseholdActivityType } from '../../../types';
import { formatRelativeTime, getActivityIconConfig } from '../utils/householdFormatters';

interface HouseholdActivityProps {
  activities: HouseholdActivityType[];
  isLoading?: boolean;
}

export const HouseholdActivity: React.FC<HouseholdActivityProps> = ({
  activities,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const getTargetRoute = (activity: HouseholdActivityType): string | null => {
    const action = activity.action.toUpperCase();
    if (action.includes('TASK') || action.includes('CHORE')) {
      return '/tasks';
    }
    if (action.includes('GROCERY') || action.includes('INVENTORY')) {
      return '/groceries';
    }
    if (action.includes('BILL')) {
      return '/bills';
    }
    if (action.includes('EXPENSE') || action.includes('TRANSACTION')) {
      return '/finances';
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">Recent Household Activity</h3>
            <p className="text-xs text-muted-foreground">
              Audited events and updates across this household
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-muted/60 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-1/3 h-3.5 bg-muted/60 rounded" />
                <div className="w-1/4 h-2.5 bg-muted/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center bg-muted/15 border border-dashed border-border/70 rounded-xl space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No recent household activity</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Actions such as task completions, grocery updates, and member changes will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {activities.slice(0, 8).map((act) => {
            const config = getActivityIconConfig(act.action, act.entity);
            const Icon = config.icon;
            const targetRoute = getTargetRoute(act);

            return (
              <div
                key={act.id}
                className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${config.colorClass} border border-border/50`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-foreground font-medium break-words leading-relaxed">
                      {act.performerName ? (
                        <span className="font-semibold text-foreground">{act.performerName} </span>
                      ) : null}
                      <span className="text-muted-foreground">{act.description || act.details}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatRelativeTime(act.timestamp || act.createdAt)}</span>
                      <span>•</span>
                      <span className="uppercase text-[9px] tracking-wider font-semibold opacity-75">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {targetRoute && (
                  <button
                    onClick={() => navigate(targetRoute)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title={`Open related section (${targetRoute})`}
                    aria-label={`Open ${targetRoute}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
