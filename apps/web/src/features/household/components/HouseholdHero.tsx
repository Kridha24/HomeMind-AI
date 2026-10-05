import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ArrowLeftRight,
  RotateCw,
  Home,
  Calendar,
  Edit2,
  Check,
  Crown,
  Sparkles,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Household, HouseholdMember } from '../../../types';
import { canRenameHousehold } from '../utils/householdPermissions';
import { MemberRoleBadge } from './MemberRoleBadge';

interface HouseholdHeroProps {
  household?: Household | null;
  members: HouseholdMember[];
  memberCount: number;
  currentUserRole?: string;
  onInvite: () => void;
  onOpenSwitcher: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeView: 'workspace' | 'communication';
  onToggleView: (view: 'workspace' | 'communication') => void;
  onRename: (newName: string) => Promise<void>;
}

export const HouseholdHero: React.FC<HouseholdHeroProps> = ({
  household,
  members,
  memberCount,
  currentUserRole,
  onInvite,
  onOpenSwitcher,
  onRefresh,
  isRefreshing = false,
  activeView,
  onToggleView,
  onRename,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(household?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const allowRename = canRenameHousehold(currentUserRole);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === household?.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await onRename(nameInput.trim());
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const formattedEstDate = household?.createdAt
    ? new Date(household.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Aug 2026';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c132c] via-[#090e24] to-[#050816] text-white border border-indigo-500/20 shadow-xl shadow-indigo-950/30">
      {/* Ambient Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-400 to-sky-400 opacity-80" />

      {/* Subtle Background Radial Highlights */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Decorative Subtle Home Ambient Pattern (Far Right) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex items-center opacity-[0.07] pointer-events-none select-none">
        <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 140V70L120 15L220 70V140H150V95H90V140H20Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="55" r="14" stroke="currentColor" strokeWidth="2.5" />
          <path d="M10 140H230" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 p-5 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Left Side: Active Badge, Household Name, Subtext & Supporting Details */}
        <div className="space-y-3 max-w-2xl">
          {/* Active Household Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Household
            </span>

            {/* User Role Badge */}
            {currentUserRole && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300">
                <span>Role:</span>
                <span className="font-semibold text-white capitalize">{currentUserRole.toLowerCase()}</span>
              </span>
            )}
          </div>

          {/* Household Title */}
          <div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1 flex-wrap">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  aria-label="Household Name"
                  className="bg-slate-900/90 border border-indigo-400 text-white text-xl sm:text-2xl font-black px-3.5 py-1.5 rounded-xl outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !nameInput.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSavingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(household?.name || '');
                    setIsEditingName(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {household?.name || 'Household Workspace'}
                </h1>
                {allowRename && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(household?.name || '');
                      setIsEditingName(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Rename household"
                    aria-label="Rename household"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subtext */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Manage your household, members, and shared responsibilities — all in one place.
          </p>

          {/* Small Supporting Details */}
          <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Est. {formattedEstDate}
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <strong className="text-slate-200 font-semibold">{memberCount}</strong>{' '}
              {memberCount === 1 ? 'member' : 'members'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        {/* Right Side Actions: Workspace, Chat & Calls, Switch, Invite */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Workspace Tab Button */}
          <button
            type="button"
            onClick={() => onToggleView('workspace')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
              activeView === 'workspace'
                ? 'bg-white/15 text-white border border-white/20 shadow-inner'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
            aria-label="Open Workspace view"
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Workspace</span>
          </button>

          {/* SPECIAL CHAT & CALLS BUTTON (Section 3) */}
          <button
            type="button"
            onClick={() => onToggleView('communication')}
            aria-label="Open Chat and Calls"
            className={`group relative overflow-hidden flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 ${
              activeView === 'communication'
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40 ring-2 ring-violet-400/30'
                : 'bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-violet-950/80 hover:from-indigo-600 hover:to-violet-600 text-white border border-violet-500/30 hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-600/25'
            }`}
          >
            {/* Expressive Soft-3D Style Icon Set */}
            <div className="relative flex items-center shrink-0">
              {/* Glowing Chat Bubble with tiny float */}
              <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:-translate-y-0.5">
                <MessageCircle className="w-3.5 h-3.5 text-white fill-white/20" />
              </div>
              {/* Little Phone Handset Accent */}
              <div className="w-4 h-4 -ml-1.5 -mb-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xs border border-[#090e24] transition-transform duration-200 group-hover:scale-110">
                <Phone className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            </div>

            <span className="tracking-wide">Chat & Calls</span>
          </button>

          {/* Switch Household Button */}
          <button
            type="button"
            onClick={onOpenSwitcher}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 text-xs font-bold transition-all shadow-2xs"
            title="Switch household"
            aria-label="Switch household"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Switch</span>
          </button>

          {/* Invite Member Button */}
          <button
            type="button"
            onClick={onInvite}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 border border-violet-400/30 transition-all active:scale-95"
            aria-label="Invite new member to household"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors disabled:opacity-50 self-center hidden sm:flex items-center justify-center"
            title="Refresh household data"
            aria-label="Refresh household data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
