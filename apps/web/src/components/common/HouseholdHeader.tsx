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

  const householdName = household?.name || (user?.name ? `${user.name}'s Home` : "Mihir kridha Shekhar Gupta's Home");

  return (
    <div
      className={`w-full bg-gradient-to-r from-indigo-500/[0.07] via-purple-500/[0.04] to-emerald-500/[0.05] dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/30 backdrop-blur-md border border-indigo-500/25 dark:border-indigo-500/35 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between gap-3 flex-wrap ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xs shadow-indigo-500/25 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
              {householdName}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 uppercase tracking-wider hidden sm:inline-block">
              Smart Home OS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span> · Connected
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onInviteClick && (
          <button
            type="button"
            onClick={onInviteClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/settings?tab=household')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-2xs"
          title="Household Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default HouseholdHeader;
