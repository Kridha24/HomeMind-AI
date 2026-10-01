import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Sparkles, Menu, ChevronDown, Command } from 'lucide-react';
import { ProfileMenu } from '../common/ProfileMenu';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAuthStore } from '../../stores/useAuthStore';
import { useI18n } from '../../utils/i18n';

interface NavbarProps {
  onOpenAIChat: () => void;
  onOpenNotifications: () => void;
  onToggleMobileSidebar?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAIChat,
  onOpenNotifications,
  onToggleMobileSidebar,
  unreadCount = 0,
}) => {
  const { household, user } = useAuthStore();
  const { t } = useI18n();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="
      min-h-[56px] pt-[env(safe-area-inset-top,0px)]
      bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
      border-b border-slate-200/80 dark:border-slate-800
      sticky top-0 z-30 lg:ml-20
      flex items-center justify-between
      px-3 sm:px-5 gap-2 sm:gap-3
      shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none
      transition-all duration-250
    ">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-lg">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation"
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-[14px] h-[14px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('common.search', 'Search expenses, bills, groceries, tasks...')}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={[
              'w-full bg-slate-50 dark:bg-slate-800/60',
              'border rounded-xl',
              'pl-8 pr-16 py-2',
              'text-[12px] text-slate-700 dark:text-slate-200 placeholder-slate-400',
              'transition-all duration-200 outline-none',
              searchFocused
                ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
            ].join(' ')}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Language */}
        <LanguageSelector />

        {/* Household pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium max-w-[180px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="truncate">{household?.name ?? 'My Home'}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
        </div>

        {/* AI Copilot */}
        <button
          onClick={onOpenAIChat}
          aria-label={t('ai.copilot', 'AI Copilot')}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-500 hover:to-indigo-500
            hover:shadow-md hover:shadow-blue-500/20 hover:-translate-y-px
            text-white text-[12px] font-bold
            shadow-sm shadow-blue-500/15
            active:scale-95 transition-all duration-150
          "
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('ai.copilot', 'AI Copilot')}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          aria-label={t('common.notifications', 'Notifications')}
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-150"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Profile */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Navbar;
