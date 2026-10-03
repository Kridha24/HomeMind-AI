import React from 'react';
import { Home, UserPlus, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Badge } from './Badge';

interface HouseholdHeaderProps {
  memberCount?: number;
  onInviteClick?: () => void;
  className?: string;
}

export const HouseholdHeader: React.FC<HouseholdHeaderProps> = ({
  memberCount = 2,
  onInviteClick,
  className = '',
}) => {
  const navigate = useNavigate();
  const { household, user } = useAuthStore();

  const householdName = household?.name || `${user?.name || 'My'}'s Home`;

  return (
    <div
      className={`w-full bg-panel/90 dark:bg-slate-900/90 backdrop-blur-md border border-primary/60 dark:border-white/10 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between gap-3 flex-wrap ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-primary truncate tracking-tight">
            {householdName}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-muted font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {memberCount} {memberCount === 1 ? 'member' : 'members'} · Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onInviteClick && (
          <button
            type="button"
            onClick={onInviteClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/settings?tab=household')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary/80 hover:bg-secondary border border-primary/50 text-secondary transition-all active:scale-95"
          title="Household Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default HouseholdHeader;
