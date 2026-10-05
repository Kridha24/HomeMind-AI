import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Clock,
  ArrowRight,
  Receipt,
  ShoppingCart,
  CheckSquare,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import { HouseholdActivity as HouseholdActivityType } from '../../../types';
import { formatRelativeTime } from '../utils/householdFormatters';

interface HouseholdActivityProps {
  activities: HouseholdActivityType[];
  isLoading?: boolean;
}

interface FormattedEvent {
  title: string;
  subtitle: string;
  performer?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  badgeBg: string;
  targetRoute?: string;
}

/**
 * Humanizes raw audit log events and JSON strings into clean, calm, human-readable descriptions.
 * STRICT RULE: Never expose raw JSON strings (e.g. {"id":"...", "amount":500...}) to users.
 */
function humanizeActivity(act: HouseholdActivityType): FormattedEvent {
  let parsed: any = null;

  // Try parsing details if present
  if (act.details) {
    if (typeof act.details === 'object') {
      parsed = act.details;
    } else if (typeof act.details === 'string') {
      const trimmed = act.details.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          parsed = null;
        }
      }
    }
  }

  // Also check if description contains raw JSON
  if (!parsed && act.description && typeof act.description === 'string') {
    const trimmed = act.description.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    }
  }

  const action = (act.action || '').toUpperCase();
  const entity = (act.entity || '').toUpperCase();
  const performer = act.performerName || '';

  // 1. COMPLETED TASK
  if (
    action.includes('COMPLETE') &&
    (action.includes('TASK') || entity.includes('TASK') || parsed?.status === 'COMPLETED')
  ) {
    const taskTitle = parsed?.title || parsed?.name || 'Household task';
    return {
      title: 'Completed a task',
      subtitle: `“${taskTitle}”`,
      performer,
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
      targetRoute: '/tasks',
    };
  }

  // 2. CREATED / UPDATED TASK
  if (action.includes('TASK') || entity.includes('TASK')) {
    const isUpdate = action.includes('UPDATE') || action.includes('EDIT');
    const taskTitle = parsed?.title || parsed?.name || 'Household task';
    return {
      title: isUpdate ? 'Updated a task' : 'Created a task',
      subtitle: `“${taskTitle}”`,
      performer,
      icon: CheckSquare,
      iconClass: 'text-blue-500',
      badgeBg: 'bg-blue-500/10 border-blue-500/20',
      targetRoute: '/tasks',
    };
  }

  // 3. EXPENSE
  if (
    action.includes('EXPENSE') ||
    entity.includes('EXPENSE') ||
    entity.includes('TRANSACTION') ||
    parsed?.amount !== undefined
  ) {
    const isUpdate = action.includes('UPDATE');
    let amountStr = '';
    if (parsed?.amount !== undefined) {
      amountStr = `₹${Number(parsed.amount).toLocaleString('en-IN')}`;
    }
    const category = parsed?.category || parsed?.title || 'General';
    const subtitle = amountStr ? `${amountStr} • ${category}` : category;

    return {
      title: isUpdate ? 'Updated an expense' : 'Added an expense',
      subtitle,
      performer,
      icon: Receipt,
      iconClass: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 border-rose-500/20',
      targetRoute: '/bills',
    };
  }

  // 4. BILL
  if (action.includes('BILL') || entity.includes('BILL')) {
    const isPaid = action.includes('PAY');
    let amountStr = '';
    if (parsed?.amount !== undefined) {
      amountStr = `₹${Number(parsed.amount).toLocaleString('en-IN')}`;
    }
    const billTitle = parsed?.title || parsed?.billerName || 'Household bill';
    const subtitle = amountStr ? `${amountStr} • ${billTitle}` : billTitle;

    return {
      title: isPaid ? 'Paid a bill' : 'Added a bill',
      subtitle,
      performer,
      icon: Receipt,
      iconClass: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      targetRoute: '/bills',
    };
  }

  // 5. GROCERY
  if (action.includes('GROCERY') || entity.includes('GROCERY') || entity.includes('INVENTORY')) {
    const isPurchased = action.includes('PURCHASE') || action.includes('BUY');
    const itemName =
      parsed?.name ||
      parsed?.items ||
      parsed?.title ||
      (typeof act.description === 'string' && !act.description.startsWith('{')
        ? act.description
        : 'Groceries');

    return {
      title: isPurchased ? 'Purchased grocery item' : 'Added grocery item',
      subtitle: `“${itemName}”`,
      performer,
      icon: ShoppingCart,
      iconClass: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
      targetRoute: '/groceries',
    };
  }

  // 6. MEMBER JOINED / ROLE UPDATE
  if (
    action.includes('JOIN') ||
    action.includes('INVITE') ||
    action.includes('MEMBER') ||
    entity.includes('MEMBER') ||
    entity.includes('USER')
  ) {
    const isRole = action.includes('ROLE');
    const isLeave = action.includes('LEAVE') || action.includes('REMOVE');
    const memberName = parsed?.name || parsed?.userName || performer || 'Household Member';

    return {
      title: isRole
        ? 'Updated member role'
        : isLeave
        ? 'Member left household'
        : 'Member joined household',
      subtitle: memberName,
      performer: isLeave || isRole ? performer : undefined,
      icon: Users,
      iconClass: 'text-violet-500',
      badgeBg: 'bg-violet-500/10 border-violet-500/20',
      targetRoute: undefined,
    };
  }

  // 7. SAFE FALLBACK (NO RAW JSON DUMP)
  let cleanDesc = '';
  if (act.description && !act.description.startsWith('{')) {
    cleanDesc = act.description;
  } else if (parsed?.title || parsed?.name) {
    cleanDesc = parsed.title || parsed.name;
  } else {
    cleanDesc = `${action.replace(/_/g, ' ').toLowerCase() || 'Activity'} recorded`;
  }

  return {
    title: 'Household update',
    subtitle: cleanDesc,
    performer,
    icon: Sparkles,
    iconClass: 'text-slate-400',
    badgeBg: 'bg-slate-500/10 border-slate-500/20',
    targetRoute: undefined,
  };
}

export const HouseholdActivity: React.FC<HouseholdActivityProps> = ({
  activities,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  // Limit dashboard feed to around 5 recent events as required by spec
  const recentEvents = activities.slice(0, 5);

  return (
    <div className="bg-panel border border-primary/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header with Title and "View All ->" */}
      <div className="flex items-center justify-between border-b border-primary/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-primary text-base">Recent Household Activity</h3>
            <p className="text-xs text-muted">Audited events and updates across this household</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 animate-pulse"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary/80 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-1/3 h-3.5 bg-secondary/80 rounded" />
                <div className="w-1/2 h-2.5 bg-secondary/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recentEvents.length === 0 ? (
        <div className="py-8 text-center bg-secondary/30 border border-dashed border-primary/60 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-full bg-secondary text-muted flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-primary">No recent household activity</p>
          <p className="text-xs text-muted max-w-xs mx-auto">
            Actions such as task completions, grocery updates, and member changes will appear here in
            real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentEvents.map((act) => {
            const event = humanizeActivity(act);
            const Icon = event.icon;
            const timeAgo = formatRelativeTime(act.timestamp || act.createdAt);

            return (
              <div
                key={act.id}
                onClick={() => event.targetRoute && navigate(event.targetRoute)}
                className={`group flex items-start justify-between gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-primary/40 transition-all ${
                  event.targetRoute ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border mt-0.5 shadow-2xs ${event.badgeBg} ${event.iconClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-primary truncate">{event.title}</p>
                    <p className="text-xs text-secondary font-medium truncate">{event.subtitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted pt-0.5">
                      {event.performer && (
                        <>
                          <span>by {event.performer}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {event.targetRoute && (
                  <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
