import React from 'react';
import { ChevronRight, CheckSquare } from 'lucide-react';
import { HouseholdMember } from '../../../types';
import { MemberRoleBadge } from './MemberRoleBadge';
import { getUserInitials } from '../utils/householdFormatters';

interface MemberCardProps {
  member: HouseholdMember;
  currentUserId?: string;
  activeTasksCount: number;
  onSelectMember: (member: HouseholdMember) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserId,
  activeTasksCount,
  onSelectMember,
}) => {
  const isMe = member.id === currentUserId;
  const initials = getUserInitials(member.name, member.email);

  return (
    <div
      onClick={() => onSelectMember(member)}
      className="p-4 rounded-2xl bg-panel border border-primary/80 active:border-blue-500/40 active:bg-secondary/40 transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3 min-h-[56px]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
          {initials}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary truncate block">
              {member.name}
            </span>
            {isMe && (
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/25 px-1.5 py-0.2 rounded-full">
                You
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <MemberRoleBadge role={member.role} />
            {activeTasksCount > 0 && (
              <span className="text-[11px] text-muted font-medium flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-purple-500" />
                <span>{activeTasksCount} tasks</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
    </div>
  );
};
