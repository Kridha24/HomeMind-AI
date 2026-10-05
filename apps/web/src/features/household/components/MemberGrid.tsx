import React, { useState, useMemo } from 'react';
import { Search, Users, X, UserPlus } from 'lucide-react';
import { HouseholdMember } from '../../../types';
import { MemberRow } from './MemberRow';
import { MemberCard } from './MemberCard';

interface MemberGridProps {
  members: HouseholdMember[];
  currentUserId?: string;
  currentUserRole?: string;
  memberTaskCounts: Record<string, number>;
  onSelectMember: (member: HouseholdMember) => void;
  onOpenRoleChange: (member: HouseholdMember) => void;
  onOpenTransferOwnership: (member: HouseholdMember) => void;
  onOpenRemoveMember: (member: HouseholdMember) => void;
  onViewMemberTasks: (member: HouseholdMember) => void;
  onInvite: () => void;
}

export const MemberGrid: React.FC<MemberGridProps> = ({
  members,
  currentUserId,
  currentUserRole,
  memberTaskCounts,
  onSelectMember,
  onOpenRoleChange,
  onOpenTransferOwnership,
  onOpenRemoveMember,
  onViewMemberTasks,
  onInvite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort members: OWNER -> CO-OWNER -> ADMIN -> MEMBER -> GUEST, then alphabetical
  const rolePriority: Record<string, number> = {
    OWNER: 5,
    'CO-OWNER': 4,
    ADMIN: 3,
    MEMBER: 2,
    GUEST: 1,
  };

  const filteredAndSortedMembers = useMemo(() => {
    return [...members]
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesEmail = m.email?.toLowerCase().includes(q) || false;
        return matchesName || matchesEmail;
      })
      .sort((a, b) => {
        const pA = rolePriority[a.role?.toUpperCase()] || 0;
        const pB = rolePriority[b.role?.toUpperCase()] || 0;
        if (pA !== pB) return pB - pA;
        return a.name.localeCompare(b.name);
      });
  }, [members, searchQuery]);

  return (
    <div className="bg-panel border border-primary/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-primary text-base">Household Members</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary border border-primary/60">
              {filteredAndSortedMembers.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[180px] sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-secondary/50 border border-primary/80 text-xs text-primary placeholder-muted focus:outline-none focus:border-violet-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Invite Member Button */}
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-xs font-bold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Member Items */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-secondary/30 border border-dashed border-primary/60 space-y-2">
          <p className="text-xs text-secondary font-medium">
            No members found matching "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table / Rows */}
          <div className="hidden sm:flex flex-col gap-2">
            {filteredAndSortedMembers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                activeTasksCount={memberTaskCounts[m.id] || 0}
                onSelectMember={onSelectMember}
                onOpenRoleChange={onOpenRoleChange}
                onOpenTransferOwnership={onOpenTransferOwnership}
                onOpenRemoveMember={onOpenRemoveMember}
                onViewMemberTasks={onViewMemberTasks}
              />
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="flex sm:hidden flex-col gap-2">
            {filteredAndSortedMembers.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                activeTasksCount={memberTaskCounts[m.id] || 0}
                onSelectMember={onSelectMember}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
