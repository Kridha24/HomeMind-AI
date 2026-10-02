import React from 'react';
import { Users, User as UserIcon } from 'lucide-react';
import { TaskSummaryMetrics } from '../hooks/useTaskSummary';

interface MemberWorkloadProps {
  workload: TaskSummaryMetrics['memberWorkload'];
  selectedAssignee: string;
  onSelectAssignee: (id: string) => void;
}

export const MemberWorkload: React.FC<MemberWorkloadProps> = ({
  workload,
  selectedAssignee,
  onSelectAssignee,
}) => {
  if (workload.length <= 1) return null; // Don't show if only unassigned or 1 member

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-panel border border-primary/80 shadow-xs space-y-2.5">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
          Household Chore Distribution
        </h4>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {workload.map((m) => {
          const isSelected =
            (m.memberId === null && selectedAssignee === 'UNASSIGNED') ||
            (m.memberId && selectedAssignee === m.memberId);

          return (
            <button
              key={m.memberId || 'unassigned'}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSelectAssignee('ALL');
                } else {
                  onSelectAssignee(m.memberId || 'UNASSIGNED');
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                isSelected
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold'
                  : 'bg-secondary/60 border-primary/60 text-secondary hover:text-primary hover:bg-secondary'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{m.name}</span>
              <span className="font-mono font-bold px-1.5 py-0.2 rounded-full bg-secondary text-primary text-[10px]">
                {m.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
