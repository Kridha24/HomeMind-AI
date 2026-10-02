import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowUpRight, UserCheck, AlertCircle } from 'lucide-react';
import { HouseholdMember, Task } from '../../../types';
import { getUserInitials } from '../utils/householdFormatters';

interface HouseholdResponsibilitiesProps {
  members: HouseholdMember[];
  tasks: Task[];
}

export const HouseholdResponsibilities: React.FC<HouseholdResponsibilitiesProps> = ({
  members,
  tasks,
}) => {
  const navigate = useNavigate();

  // Filter only active (non-completed) tasks
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const totalActive = activeTasks.length;

  // Calculate workloads
  const workloadByMember = members.map((member) => {
    const memberTasks = activeTasks.filter(
      (t) =>
        t.assigneeId === member.id ||
        t.assignee?.id === member.id ||
        (t.assignee?.name && t.assignee.name.toLowerCase() === member.name.toLowerCase())
    );
    const count = memberTasks.length;
    const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

    return {
      member,
      count,
      percentage,
    };
  });

  // Calculate unassigned tasks
  const unassignedTasks = activeTasks.filter((t) => !t.assigneeId && !t.assignee);
  const unassignedCount = unassignedTasks.length;
  const unassignedPercentage =
    totalActive > 0 ? Math.round((unassignedCount / totalActive) * 100) : 0;

  const handleMemberClick = (memberId: string) => {
    navigate(`/tasks?assignee=${encodeURIComponent(memberId)}`);
  };

  const handleUnassignedClick = () => {
    navigate('/tasks?filter=unassigned');
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">Household Responsibilities</h3>
            <p className="text-xs text-muted-foreground">
              Workload distribution across pending chores and tasks
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
        >
          <span>Open Tasks Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {totalActive === 0 ? (
        <div className="p-8 text-center bg-muted/20 border border-dashed border-border/70 rounded-xl space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            There are currently no pending tasks or chores in this household.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Active Responsibilities</span>
            <span className="font-semibold text-foreground">{totalActive} total active chores</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {workloadByMember.map(({ member, count, percentage }) => (
              <div
                key={member.id}
                onClick={() => handleMemberClick(member.id)}
                className="group p-3.5 rounded-xl border border-border bg-muted/15 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMemberClick(member.id);
                  }
                }}
                aria-label={`View tasks assigned to ${member.name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                      {getUserInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {member.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {member.role || 'MEMBER'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-foreground">{count}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {count === 1 ? 'task' : 'tasks'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{percentage}% of active chores</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Unassigned Tasks if any */}
            {unassignedCount > 0 && (
              <div
                onClick={handleUnassignedClick}
                className="group p-3.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex flex-col justify-between gap-3"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUnassignedClick();
                  }
                }}
                aria-label="View unassigned tasks"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Unassigned Chores
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Needs a household assignee
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {unassignedCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {unassignedCount === 1 ? 'task' : 'tasks'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-amber-500/20 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${unassignedPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <span>{unassignedPercentage}% unassigned</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
