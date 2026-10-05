import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
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
    <div className="bg-panel border border-primary/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header and Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-primary text-base">Household Responsibilities</h3>
            <p className="text-xs text-muted">
              Workload distribution across household chores and tasks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto"
        >
          <span>Open Tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {totalActive === 0 ? (
        <div className="p-8 text-center bg-secondary/30 border border-dashed border-primary/60 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-primary">All caught up!</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            There are currently no pending tasks or chores in this household.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workloadByMember.map(({ member, count, percentage }) => {
              const initials = getUserInitials(member.name, member.email);
              const isOwner = member.role === 'OWNER';

              return (
                <div
                  key={member.id}
                  onClick={() => handleMemberClick(member.id)}
                  className="group p-3.5 rounded-2xl border border-primary/50 bg-secondary/25 hover:bg-secondary/55 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs"
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isOwner
                            ? 'bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400'
                            : 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {member.name}
                        </p>
                        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                          {member.role || 'MEMBER'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-primary">{count}</span>{' '}
                      <span className="text-[11px] text-muted">{count === 1 ? 'task' : 'tasks'}</span>
                    </div>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted font-medium">
                      <span>{percentage}% of active chores</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unassigned Chores Warning State */}
            {unassignedCount > 0 && (
              <div
                onClick={handleUnassignedClick}
                className="group p-3.5 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs"
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Unassigned Chores
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Needs assignee
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {unassignedCount}
                    </span>{' '}
                    <span className="text-[11px] text-muted">
                      {unassignedCount === 1 ? 'task' : 'tasks'}
                    </span>
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
