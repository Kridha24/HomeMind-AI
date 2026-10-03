import React from 'react';
import {
  Users,
  UserPlus,
  ArrowLeftRight,
  RotateCw,
  Home,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Household } from '../../../types';

interface HouseholdHeaderProps {
  household?: Household | null;
  memberCount: number;
  onInvite: () => void;
  onOpenSwitcher: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeView: 'workspace' | 'communication';
  onToggleView: (view: 'workspace' | 'communication') => void;
}

export const HouseholdHeader: React.FC<HouseholdHeaderProps> = ({
  household,
  memberCount,
  onInvite,
  onOpenSwitcher,
  onRefresh,
  isRefreshing = false,
  activeView,
  onToggleView,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-panel border border-primary/80 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-xs">
          <Users className="w-5 h-5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold text-primary truncate max-w-md">
              {household?.name || 'Family Workspace'}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {memberCount} {memberCount === 1 ? 'member' : 'members'} • Active
            </span>
          </div>
          <p className="text-xs text-secondary">
            Manage your household, members, and shared responsibilities.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
        {/* Workspace vs Chat & Calls Toggle */}
        <div className="flex items-center bg-secondary/70 border border-primary/80 p-0.5 rounded-2xl">
          <button
            type="button"
            onClick={() => onToggleView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'workspace'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleView('communication')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'communication'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Calls</span>
          </button>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-panel border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/60 transition-colors disabled:opacity-50"
          title="Refresh household"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Household Switcher Button */}
        <button
          type="button"
          onClick={onOpenSwitcher}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-panel border border-primary/80 text-secondary hover:text-primary hover:bg-secondary/60 text-xs font-bold transition-colors shadow-2xs"
          title="Switch household or personal residence"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Switch</span>
        </button>

        {/* Invite Member Button */}
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-blue-600/25 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>
    </div>
  );
};
