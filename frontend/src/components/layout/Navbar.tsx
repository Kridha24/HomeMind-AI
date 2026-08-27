import React from 'react';
import { Bell, Search, Sparkles, Menu } from 'lucide-react';
import { ProfileMenu } from '../common/ProfileMenu';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';

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
  const { sidebarCollapsed } = useSettingStore();

  const marginClass = sidebarCollapsed ? 'lg:ml-20 ml-0' : 'lg:ml-64 ml-0';

  return (
    <header className={`h-16 bg-panel/85 backdrop-blur-xl border-b border-primary/80 sticky top-0 z-30 ${marginClass} transition-all duration-300 flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 shadow-sm dark:shadow-none`}>
      {/* Left: Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile Hamburger Toggle Button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-secondary hover:text-primary bg-secondary/80 border border-primary/80 rounded-xl hover:border-secondary transition-colors flex-shrink-0"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses, groceries, chores (or press ⌘K)..."
            className="w-full bg-secondary/60 border border-primary/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-primary placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-panel transition-all"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Household & User Info (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-2 bg-secondary/60 border border-primary/60 px-3.5 py-1.5 rounded-xl text-xs text-secondary font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {household?.name || 'My Home'} • {user?.name?.split(' ')[0] || 'User'}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-secondary hover:text-primary bg-secondary/60 hover:bg-secondary border border-primary/80 rounded-xl hover:border-secondary transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <ProfileMenu />
      </div>
    </header>
  );
};
