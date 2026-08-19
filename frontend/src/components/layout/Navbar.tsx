import React from 'react';
import { Bell, Bot, CloudSun, Search, Sparkles, Menu } from 'lucide-react';
import { ProfileMenu } from '../common/ProfileMenu';
import { useSettingStore } from '../../stores/useSettingStore';
import { COUNTRY_DEFAULTS } from '../../utils/currency';

interface NavbarProps {
  onOpenAIChat: () => void;
  onOpenNotifications: () => void;
  onToggleMobileSidebar?: () => void;
  unreadCount?: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  JP: '🇯🇵',
  CA: '🇨🇦',
  AU: '🇦🇺',
  SG: '🇸🇬',
  AE: '🇦🇪',
  SA: '🇸🇦',
  CH: '🇨🇭',
  CN: '🇨🇳',
};

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAIChat,
  onOpenNotifications,
  onToggleMobileSidebar,
  unreadCount = 0,
}) => {
  const { country } = useSettingStore();
  const defaults = COUNTRY_DEFAULTS[country] || COUNTRY_DEFAULTS['US'];
  const flag = COUNTRY_FLAGS[country] || '🌐';
  const isCelsius = country === 'IN' || country === 'DE' || country === 'FR' || country === 'JP' || country === 'CA' || country === 'AU';
  const tempStr = isCelsius ? '28°C Partly Sunny' : '74°F Clear Sky';

  return (
    <header className="h-16 bg-panel/40 backdrop-blur-xl border-b border-primary/60 sticky top-0 z-30 lg:ml-64 ml-0 flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile Hamburger Toggle Button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-secondary hover:text-white bg-panel border border-primary/80 rounded-xl hover:border-secondary transition-colors flex-shrink-0"
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
            placeholder="Search expenses, groceries..."
            className="w-full bg-background/60 border border-primary/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-primary placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Live Location Weather Widget (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-2 bg-background/40 border border-primary/60 px-3 py-1.5 rounded-xl text-xs text-secondary">
          <CloudSun className="w-4 h-4 text-amber-400" />
          <span>
            {tempStr} • {flag} {defaults.countryName}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-secondary hover:text-white bg-panel border border-primary/80 rounded-xl hover:border-secondary transition-colors"
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
