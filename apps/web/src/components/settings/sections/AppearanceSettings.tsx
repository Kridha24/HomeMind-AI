import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Check,
  Sliders,
  PanelLeftClose,
  Eye,
  CheckCircle2,
  Monitor,
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';

interface ThemeOption {
  id: 'dark' | 'light' | 'glass';
  title: string;
  description: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  textColor: string;
  icon: React.ReactNode;
}

const THEMES: ThemeOption[] = [
  {
    id: 'light',
    title: 'Pure Studio (Light)',
    description: 'Crisp radiant surface aesthetic tailored for daytime clarity and clean readability',
    previewBg: 'bg-slate-100',
    previewCard: 'bg-white border-slate-200 shadow-2xs',
    previewAccent: 'bg-blue-600',
    textColor: 'text-slate-900',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'dark',
    title: 'Obsidian Night (Dark)',
    description: 'High-contrast dark theme optimized for low-light environments and OLED displays',
    previewBg: 'bg-[#0f172a]',
    previewCard: 'bg-[#1e293b] border-slate-700',
    previewAccent: 'bg-blue-500',
    textColor: 'text-slate-100',
    icon: <Moon className="w-4 h-4 text-blue-400" />,
  },
  {
    id: 'glass',
    title: 'Aurora Glass (System)',
    description: 'Dynamic translucent styling with backdrop blur and ambient lighting cues',
    previewBg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
    previewCard: 'bg-white/10 backdrop-blur-md border-white/15',
    previewAccent: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    textColor: 'text-white',
    icon: <Sparkles className="w-4 h-4 text-violet-400" />,
  },
];

export const AppearanceSettings: React.FC = () => {
  const {
    theme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useSettingStore();

  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem('hm_compactMode') === 'true'
  );

  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleThemeSelect = (selectedTheme: 'dark' | 'light' | 'glass') => {
    setTheme(selectedTheme);
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-glass');
    document.documentElement.classList.add(`theme-${selectedTheme}`);
    showNotification(`Theme updated to ${THEMES.find((t) => t.id === selectedTheme)?.title}`);
  };

  const handleReducedMotionToggle = (checked: boolean) => {
    setReducedMotion(checked);
    if (checked) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    showNotification(checked ? 'Reduced motion enabled' : 'Smooth animations restored');
  };

  const handleCompactModeToggle = (checked: boolean) => {
    setCompactMode(checked);
    localStorage.setItem('hm_compactMode', String(checked));
    if (checked) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
    showNotification(checked ? 'Compact density activated' : 'Standard spacious density restored');
  };

  const handleSidebarCollapseToggle = (checked: boolean) => {
    setSidebarCollapsed(checked);
    showNotification(checked ? 'Sidebar collapsed by default' : 'Full sidebar restored');
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-2xl flex items-center gap-2 border text-xs font-semibold bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Visual Theme Selection Cards */}
      <SettingsCard
        id="theme-selection"
        title="Visual Theme"
        description="Choose your preferred surface theme and contrast mode for HomeMind.AI."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeSelect(t.id)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 relative group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-500/5 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                {/* Visual Preview Box */}
                <div
                  className={`w-full h-20 rounded-xl ${t.previewBg} p-2.5 flex flex-col justify-between mb-3 border border-black/5 dark:border-white/10`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2 h-2 rounded-full bg-slate-400/40" />
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                    </div>
                  </div>
                  <div
                    className={`w-3/4 h-7 rounded-lg ${t.previewCard} p-1.5 flex items-center justify-between`}
                  >
                    <div className={`w-8 h-2 rounded-sm ${t.previewAccent}`} />
                    <div className="w-2 h-2 rounded-full bg-slate-400/30" />
                  </div>
                </div>

                {/* Theme Details */}
                <div className="flex items-start justify-between gap-2 flex-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {t.icon}
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {t.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* UI Density & Motion Preferences */}
      <SettingsCard
        id="ui-preferences"
        title="Interface & Motion Preferences"
        description="Fine-tune typography density, navigation behavior, and animation smoothness."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Reduced Motion Mode"
            description="Replaces dynamic page transitions and floating physics with instant switches"
            icon={Eye}
          >
            <SettingsToggle
              checked={reducedMotion}
              onChange={handleReducedMotionToggle}
              ariaLabel="Enable reduced motion mode"
            />
          </SettingsRow>

          <SettingsRow
            label="Compact Information Density"
            description="Reduces card margins and paddings to display more telemetry per screen"
            icon={Sliders}
          >
            <SettingsToggle
              checked={compactMode}
              onChange={handleCompactModeToggle}
              ariaLabel="Enable compact information density"
            />
          </SettingsRow>

          <SettingsRow
            label="Collapse Navigation Sidebar"
            description="Minimizes the left main navigation bar to compact icon pills by default"
            icon={PanelLeftClose}
          >
            <SettingsToggle
              checked={sidebarCollapsed}
              onChange={handleSidebarCollapseToggle}
              ariaLabel="Enable collapsed navigation sidebar"
            />
          </SettingsRow>
        </div>
      </SettingsCard>
    </div>
  );
};

export default AppearanceSettings;
