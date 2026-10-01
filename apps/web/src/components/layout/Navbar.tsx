import React, { useState } from 'react';
import {
  Bell,
  Search,
  Sparkles,
  Menu,
  ChevronDown,
  Command,
  Home,
  Copy,
  Check,
} from 'lucide-react';
import { ProfileMenu } from '../common/ProfileMenu';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { useI18n } from '../../utils/i18n';

interface NavbarProps {
  onOpenAIChat: () => void;
  onOpenNotifications: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenSearch?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAIChat,
  onOpenNotifications,
  onToggleMobileSidebar,
  onOpenSearch,
  unreadCount = 0,
}) => {
  const { household } = useAuthStore();
  const { sidebarCollapsed } = useSettingStore();
  const { t } = useI18n();
  const [searchFocused, setSearchFocused] = useState(false);
  const [isHouseholdMenuOpen, setIsHouseholdMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const householdName = household?.name || 'Home Residence';
  const marginClass = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[220px]';

  React.useEffect(() => {
    if (!isHouseholdMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHouseholdMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHouseholdMenuOpen]);

  const handleCopyInvite = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <header
      className={`
        min-h-[56px] pt-[env(safe-area-inset-top,0px)]
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
        border-b border-slate-200/80 dark:border-slate-800
        sticky top-0 z-30 ${marginClass}
        flex items-center justify-between
        px-3 sm:px-5 gap-2 sm:gap-4
        shadow-[0_1px_8px_rgba(0,0,0,0.03)] dark:shadow-none
        transition-all duration-200
      `}
      aria-label="Top Command Bar"
    >
      {/* Left: Mobile Menu + Command Palette Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md lg:max-w-lg">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Command Search Bar */}
        <div
          onClick={onOpenSearch}
          className={`relative flex-1 cursor-pointer transition-all duration-180 ease-out ${
            searchFocused ? 'max-w-xl ring-2 ring-blue-500/20 shadow-md' : 'max-w-md'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search HomeMind... (Expenses, bills, groceries, tasks)"
            onFocus={() => {
              setSearchFocused(true);
              if (onOpenSearch) onOpenSearch();
            }}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl pl-8 pr-16 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 cursor-pointer outline-none transition-all duration-180"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-2xs">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Dynamic Household Selector Dropdown */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsHouseholdMenuOpen(!isHouseholdMenuOpen)}
            aria-label="Household selector"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 font-semibold max-w-[200px] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_6px_#10b981]" />
            <span className="truncate">{householdName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </button>

          {isHouseholdMenuOpen && (
            <div
              onMouseLeave={() => setIsHouseholdMenuOpen(false)}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {householdName}
                  </h4>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Current Active Household
                  </span>
                </div>
              </div>

              {household?.inviteCode && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Invite Code
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {household.inviteCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyInvite}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                    title="Copy Invite Code"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Copilot Signature Button */}
        <button
          onClick={onOpenAIChat}
          aria-label={t('ai.copilot', 'AI Copilot')}
          className="
            group flex items-center gap-1.5 px-3 py-1.5 rounded-xl
            bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600
            hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500
            text-white text-[12px] font-bold
            shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30
            hover:-translate-y-px active:scale-[0.98] transition-all duration-180
          "
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
          <span className="hidden sm:inline">{t('ai.copilot', 'AI Copilot')}</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          aria-label={t('common.notifications', 'Notifications')}
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95 transition-all duration-150"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Dynamic Profile Menu */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Navbar;
