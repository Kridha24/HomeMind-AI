import React from 'react';
import { Plus } from 'lucide-react';
import { HouseholdMember } from '../../types';

interface FamilyAvatarGroupProps {
  members: HouseholdMember[];
  onInviteClick?: () => void;
  onMemberClick?: (member: HouseholdMember) => void;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showAddButton?: boolean;
  className?: string;
  loading?: boolean;
}

// Tasteful pastel colors for avatar initials fallback
const PASTEL_COLOR_MAP = [
  'bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700/60',
  'bg-sky-100 text-sky-800 border-sky-300/80 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-700/60',
  'bg-violet-100 text-violet-800 border-violet-300/80 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-700/60',
  'bg-amber-100 text-amber-800 border-amber-300/80 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700/60',
  'bg-rose-100 text-rose-800 border-rose-300/80 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700/60',
  'bg-indigo-100 text-indigo-800 border-indigo-300/80 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700/60',
  'bg-teal-100 text-teal-800 border-teal-300/80 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-700/60',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300/80 dark:bg-fuchsia-950/70 dark:text-fuchsia-200 dark:border-fuchsia-700/60',
];

export function getPastelInitialsClass(seed: string = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_COLOR_MAP.length;
  return PASTEL_COLOR_MAP[index];
}

export function getMemberInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

export const FamilyAvatarGroup: React.FC<FamilyAvatarGroupProps> = ({
  members = [],
  onInviteClick,
  onMemberClick,
  maxVisible = 5,
  size = 'md',
  showAddButton = true,
  className = '',
  loading = false,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-xs',
    lg: 'w-10 h-10 sm:w-11 sm:h-11 text-sm',
  }[size];

  const plusSizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-sm',
    lg: 'w-10 h-10 sm:w-11 sm:h-11 text-base',
  }[size];

  if (loading) {
    return (
      <div className={`flex items-center -space-x-1.5 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${sizeClasses} rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse border-2 border-white dark:border-slate-900`}
          />
        ))}
      </div>
    );
  }

  const safeMembers = Array.isArray(members) ? members : [];
  const visibleMembers = safeMembers.slice(0, maxVisible);
  const overflowCount = safeMembers.length - maxVisible;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Overlapping/Adjacent Avatars */}
      <div className="flex items-center -space-x-1.5 hover:space-x-0.5 transition-all duration-200">
        {visibleMembers.map((member) => {
          const initials = getMemberInitials(member.name, member.email);
          const colorClass = getPastelInitialsClass(member.name || member.id);
          const photoUrl = member.avatar || member.avatarUrl;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onMemberClick?.(member)}
              className={`relative ${sizeClasses} rounded-full border-2 border-white dark:border-slate-900 shadow-2xs hover:z-20 hover:scale-110 focus:z-20 focus:outline-none transition-all duration-150 group overflow-hidden flex-shrink-0 cursor-pointer`}
              title={`${member.name} (${member.role || 'Member'})`}
              aria-label={`View details for ${member.name}`}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center font-bold tracking-tight border ${colorClass}`}
                >
                  {initials}
                </div>
              )}
            </button>
          );
        })}

        {/* Overflow Indicator (+N) */}
        {overflowCount > 0 && (
          <div
            className={`relative ${sizeClasses} rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center shadow-2xs flex-shrink-0 z-10`}
            title={`${overflowCount} more household members`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Circular (+) Add Member Button */}
      {showAddButton && onInviteClick && (
        <button
          type="button"
          onClick={onInviteClick}
          className={`${plusSizeClasses} rounded-full border-2 border-dashed border-slate-300 hover:border-indigo-500 dark:border-slate-600 dark:hover:border-indigo-400 bg-white/90 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 flex items-center justify-center transition-all duration-150 active:scale-95 shadow-2xs flex-shrink-0`}
          title="Invite New Family Member"
          aria-label="Invite New Family Member"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FamilyAvatarGroup;
