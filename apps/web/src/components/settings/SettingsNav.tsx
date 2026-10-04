import React, { useMemo } from 'react';
import {
  UserRound,
  Home,
  ShieldCheck,
  Bell,
  SlidersHorizontal,
  Palette,
  Sparkles,
  LockKeyhole,
  Plug,
  Info,
  Search,
  X,
} from 'lucide-react';
import { SettingsNavItem } from './primitives/SettingsNavItem';

import { SemanticColor } from '../common/IconTile';

export type SettingsTabId =
  | 'profile'
  | 'household'
  | 'security'
  | 'notifications'
  | 'preferences'
  | 'appearance'
  | 'ai'
  | 'privacy'
  | 'integrations'
  | 'about';

export interface NavItemConfig {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ElementType;
  keywords: string[];
  badge?: string;
  accent: SemanticColor;
}

export const SETTINGS_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal details, avatar & contact',
    icon: UserRound,
    keywords: ['profile', 'avatar', 'name', 'email', 'phone', 'contact', 'timezone', 'identity'],
    accent: 'blue',
  },
  {
    id: 'household',
    label: 'Household',
    description: 'Residence info, members & invites',
    icon: Home,
    keywords: ['household', 'residence', 'family', 'members', 'invite', 'code', 'roles', 'owner', 'admin'],
    accent: 'violet',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Active sessions & authentication',
    icon: ShieldCheck,
    keywords: ['security', 'password', 'sessions', 'devices', 'auth', 'google', 'phone', 'otp', 'logout', '2fa'],
    accent: 'slate',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alert channels & bill reminders',
    icon: Bell,
    keywords: ['notifications', 'alerts', 'bills', 'reminders', 'finance', 'push', 'chores', 'tasks'],
    accent: 'amber',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Language, currency & timezone',
    icon: SlidersHorizontal,
    keywords: ['preferences', 'language', 'currency', 'inr', 'timezone', 'date', 'regional', 'formats'],
    accent: 'sky',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme style & display mode',
    icon: Palette,
    keywords: ['appearance', 'theme', 'dark', 'light', 'system', 'mode', 'motion', 'compact', 'display'],
    accent: 'purple',
  },
  {
    id: 'ai',
    label: 'AI Copilot',
    description: 'Predictive intelligence & oversight',
    icon: Sparkles,
    keywords: ['ai', 'copilot', 'smart', 'predictions', 'insights', 'recipes', 'gemini', 'categorization'],
    badge: 'PRO',
    accent: 'cyan',
  },
  {
    id: 'privacy',
    label: 'Privacy & Data',
    description: 'SMS parser status & data controls',
    icon: LockKeyhole,
    keywords: ['privacy', 'data', 'sms', 'export', 'retention', 'telemetry', 'danger', 'delete'],
    accent: 'emerald',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Google, Firebase & Android bridge',
    icon: Plug,
    keywords: ['integrations', 'google', 'firebase', 'android', 'sms', 'fcm', 'plugins', 'sync'],
    accent: 'indigo',
  },
  {
    id: 'about',
    label: 'System & About',
    description: 'HomeMind.AI version & runtime',
    icon: Info,
    keywords: ['about', 'version', 'system', 'homemind.ai', 'environment', 'build', 'license'],
    accent: 'slate',
  },
];

interface SettingsNavProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const SettingsNav: React.FC<SettingsNavProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return SETTINGS_NAV_ITEMS;
    const q = searchQuery.toLowerCase().trim();
    return SETTINGS_NAV_ITEMS.filter((item) => {
      return (
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      e.preventDefault();
      onSelectTab(filteredItems[0].id);
    }
  };

  return (
    <nav className="space-y-3" aria-label="Settings Categories">
      {/* Search Input for Settings Navigation */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search settings (e.g. password, theme, SMS)..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Desktop List Navigation */}
      <div className="hidden lg:flex flex-col space-y-1" role="tablist" aria-orientation="vertical">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <SettingsNavItem
              key={item.id}
              id={item.id}
              label={item.label}
              description={item.description}
              icon={item.icon}
              isActive={activeTab === item.id}
              badge={item.badge}
              accent={item.accent}
              onClick={() => onSelectTab(item.id)}
            />
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No matching settings section found.
          </div>
        )}
      </div>

      {/* Mobile / Tablet Horizontal Scrollable Pills */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1" role="tablist">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default SettingsNav;
