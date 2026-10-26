import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  LogIn,
  LogOut,
  Trash2,
  ShieldAlert,
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
  onOpenJoin?: () => void;
  onOpenLeave?: () => void;
  onOpenDelete?: () => void;
  onOpenTransfer?: () => void;
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
  onOpenJoin,
  onOpenLeave,
  onOpenDelete,
  onOpenTransfer,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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
    <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0c132c] via-[#090e24] to-[#050816] text-white border border-indigo-500/20 shadow-xl shadow-indigo-950/30">
      {/* Contained Glow & Ambient Elements inside inner overflow-hidden wrapper */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-400 to-sky-400 opacity-80" />

        {/* Subtle Background Radial Highlights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Decorative Subtle Home Ambient Pattern (Far Right) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex items-center opacity-[0.07] select-none">
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
      </div>

      <div className="relative z-10 p-3.5 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Active Badge, Household Name, Subtext & Supporting Details */}
        <div className="space-y-1.5 sm:space-y-3 max-w-2xl">
          {/* Active Household Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs backdrop-blur-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Household
            </span>

            {/* User Role Badge */}
            {currentUserRole && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300">
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
                  className="bg-slate-900/90 border border-indigo-400 text-white text-lg sm:text-2xl font-black px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !nameInput.trim()}
                  className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {isSavingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(household?.name || '');
                    setIsEditingName(false);
                  }}
                  className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {household?.name || 'Household Workspace'}
                </h1>
                {allowRename && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(household?.name || '');
                      setIsEditingName(true);
                    }}
                    className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
          <p className="hidden xs:block text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Manage your household, members, and shared responsibilities — all in one place.
          </p>

          {/* Small Supporting Details */}
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400 pt-0.5 sm:pt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 font-mono">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
              Est. {formattedEstDate}
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" />
              <strong className="text-slate-200 font-semibold">{memberCount}</strong>{' '}
              {memberCount === 1 ? 'member' : 'members'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        {/* Right Side Actions: Workspace, Chat & Calls, and 3-Dot Room Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Workspace Tab Button */}
          <button
            type="button"
            onClick={() => onToggleView('workspace')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all min-h-[44px] ${
              activeView === 'workspace'
                ? 'bg-white/15 text-white border border-white/20 shadow-inner'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
            aria-label="Open Workspace view"
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Workspace</span>
          </button>

          {/* Chat & Calls Button */}
          <button
            type="button"
            onClick={() => onToggleView('communication')}
            aria-label="Open Chat and Calls"
            className={`group relative overflow-hidden flex items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 min-h-[44px] ${
              activeView === 'communication'
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40 ring-2 ring-violet-400/30'
                : 'bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-violet-950/80 hover:from-indigo-600 hover:to-violet-600 text-white border border-violet-500/30 hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-600/25'
            }`}
          >
            <div className="relative flex items-center shrink-0">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:-translate-y-0.5">
                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white/20" />
              </div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-1 sm:-ml-1.5 -mb-1.5 sm:-mb-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xs border border-[#090e24] transition-transform duration-200 group-hover:scale-110">
                <Phone className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white fill-white" />
              </div>
            </div>
            <span className="tracking-wide">Chat & Calls</span>
          </button>

          {/* Refresh Button (Desktop) */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors disabled:opacity-50 hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Refresh household data"
            aria-label="Refresh household data"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* 3-Dot Options Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center active:scale-95 shadow-md min-h-[44px] min-w-[44px]"
              title="Room options"
              aria-label="Room options"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {/* Desktop / Large Screen Dropdown */}
            {isMenuOpen && (
              <div className="hidden sm:block absolute right-0 top-full mt-2 w-60 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                {/* 1. Invite */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onInvite();
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 font-bold transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  <span>Invite Family Member</span>
                </button>

                {/* 2. Switch Household */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSwitcher();
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 font-bold transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                  <span>Switch Household</span>
                </button>

                {/* 3. Join Household */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenJoin) onOpenJoin();
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 font-bold transition-colors"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Join Another Household</span>
                </button>

                <div className="my-1.5 border-t border-slate-700/60" />

                {/* 4. Transfer Ownership (Owner only) */}
                {currentUserRole === 'OWNER' && onOpenTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenTransfer();
                    }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 font-bold transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Transfer Ownership</span>
                  </button>
                )}

                {/* 5. Leave Household */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenLeave) onOpenLeave();
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Leave Household</span>
                </button>

                {/* 6. Delete Household (Owner only) */}
                {currentUserRole === 'OWNER' && onOpenDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenDelete();
                    }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Household</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Full-Overlay Bottom Sheet for 3-Dot (Never gets clipped by containers!) */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 space-y-2 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Household Options
              </span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 font-bold"
              >
                Close
              </button>
            </div>

            {/* 1. Invite */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onInvite();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 active:bg-white/10 text-left text-white font-bold text-sm min-h-[48px]"
            >
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <span>Invite Family Member</span>
            </button>

            {/* 2. Switch Household */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSwitcher();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 active:bg-white/10 text-left text-white font-bold text-sm min-h-[48px]"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span>Switch Household</span>
            </button>

            {/* 3. Join Household */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                if (onOpenJoin) onOpenJoin();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 active:bg-white/10 text-left text-white font-bold text-sm min-h-[48px]"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <LogIn className="w-4 h-4" />
              </div>
              <span>Join Another Household</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* 4. Transfer Ownership (Owner only) */}
            {currentUserRole === 'OWNER' && onOpenTransfer && (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenTransfer();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-amber-500/10 active:bg-amber-500/20 text-left text-amber-300 font-bold text-sm min-h-[48px]"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span>Transfer Ownership</span>
              </button>
            )}

            {/* 5. Leave Household */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                if (onOpenLeave) onOpenLeave();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-rose-500/15 active:bg-rose-500/25 text-left text-rose-300 font-bold text-sm min-h-[48px]"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Leave Household</span>
            </button>

            {/* 6. Delete Household (Owner only) */}
            {currentUserRole === 'OWNER' && onOpenDelete && (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDelete();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-rose-600/20 active:bg-rose-600/30 text-left text-rose-400 font-bold text-sm min-h-[48px]"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span>Delete Household</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
