import React from 'react';
import {
  User,
  Home,
  Shield,
  Bell,
  Globe,
  Palette,
  Sparkles,
  Lock,
  Layers,
  Info,
  Search,
} from 'lucide-react';

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
  badge?: string;
}

export const SETTINGS_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal details, avatar & contact',
    icon: User,
  },
  {
    id: 'household',
    label: 'Household',
    description: 'Residence info, members & invites',
    icon: Home,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Active sessions & authentication',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alert channels & bill reminders',
    icon: Bell,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Language, currency & timezone',
    icon: Globe,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme style & reduced motion',
    icon: Palette,
  },
  {
    id: 'ai',
    label: 'AI Copilot',
    description: 'Predictive intelligence & recipes',
    icon: Sparkles,
    badge: 'PRO',
  },
  {
    id: 'privacy',
    label: 'Privacy & Data',
    description: 'SMS parser status & danger zone',
    icon: Lock,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Google, Firebase & Android bridge',
    icon: Layers,
  },
  {
    id: 'about',
    label: 'System & About',
    description: 'Platform version & legal notices',
    icon: Info,
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
  const filteredItems = SETTINGS_NAV_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <nav className="space-y-3" aria-label="Settings Categories">
      {/* Search Input for Settings Navigation */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search settings..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Desktop List Navigation */}
      <div className="hidden lg:flex flex-col space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 relative ${
                isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs block truncate">{item.label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                  {item.description}
                </span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile / Tablet Horizontal Scrollable Pills */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
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
