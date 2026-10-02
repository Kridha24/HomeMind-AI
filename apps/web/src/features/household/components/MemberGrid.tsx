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
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-extrabold text-primary">Household Members</h3>
          <span className="text-xs font-mono font-bold text-muted">
            ({filteredAndSortedMembers.length})
          </span>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-secondary/60 border border-primary/80 text-xs text-primary placeholder-muted focus:outline-none focus:border-blue-500/80 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Member Items */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-panel border border-primary/80 space-y-2">
          <p className="text-xs text-secondary font-medium">No members found matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table / Rows */}
          <div className="hidden sm:flex flex-col gap-2.5">
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
          <div className="flex sm:hidden flex-col gap-2.5">
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
