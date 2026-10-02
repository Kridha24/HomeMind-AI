import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Check, 
  Sliders, 
  PanelLeftClose, 
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsSection } from '../primitives/SettingsSection';
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
    id: 'dark',
    title: 'Obsidian Night',
    description: 'High-contrast dark mode tailored for low-light environments and OLED displays',
    previewBg: 'bg-[#0b0f19]',
    previewCard: 'bg-[#151c2e] border-slate-800',
    previewAccent: 'bg-indigo-500',
    textColor: 'text-slate-100',
    icon: <Moon className="w-4 h-4 text-indigo-400" />
  },
  {
    id: 'light',
    title: 'Pure Studio',
    description: 'Clean, radiant surface aesthetic designed for bright workspaces and daytime clarity',
    previewBg: 'bg-slate-100',
    previewCard: 'bg-white border-slate-200 shadow-sm',
    previewAccent: 'bg-indigo-600',
    textColor: 'text-slate-900',
    icon: <Sun className="w-4 h-4 text-amber-500" />
  },
  {
    id: 'glass',
    title: 'Aurora Glass',
    description: 'Translucent glassmorphism with subtle backdrop blur and soft ambient lighting',
    previewBg: 'bg-gradient-to-br from-[#0c1222] via-[#101b38] to-[#0c1222]',
    previewCard: 'bg-white/[0.07] backdrop-blur-md border-white/10 shadow-lg',
    previewAccent: 'bg-gradient-to-r from-violet-500 to-indigo-500',
    textColor: 'text-white',
    icon: <Sparkles className="w-4 h-4 text-violet-400" />
  }
];

export const AppearanceSettings: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    reducedMotion, 
    setReducedMotion, 
    sidebarCollapsed, 
    setSidebarCollapsed 
  } = useSettingStore();

  const [compactMode, setCompactMode] = useState(() => 
    localStorage.getItem('hm_compactMode') === 'true'
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
    showNotification(`Theme updated to ${THEMES.find(t => t.id === selectedTheme)?.title}`);
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
      document.documentElement.classList.add('compact-ui');
    } else {
      document.documentElement.classList.remove('compact-ui');
    }
    showNotification(checked ? 'Compact interface density enabled' : 'Comfortable density restored');
  };

  const handleSidebarToggle = (checked: boolean) => {
    setSidebarCollapsed(checked);
    showNotification(checked ? 'Sidebar collapsed by default' : 'Sidebar expanded by default');
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div 
          role="status"
          className="p-4 rounded-xl flex items-center gap-3 border text-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* Visual Theme Selection */}
      <SettingsSection
        title="Interface Theme"
        description="Choose your preferred color aesthetic and ambient contrast"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {THEMES.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleThemeSelect(opt.id)}
                className={`flex flex-col text-left rounded-2xl p-4 transition-all duration-200 border relative group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/[0.04] shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                {/* Visual Mini Preview Window */}
                <div className={`w-full h-24 rounded-xl p-3 mb-3 border ${opt.previewBg} overflow-hidden flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className={`w-12 h-2 rounded-full ${opt.previewAccent} opacity-70`} />
                  </div>
                  <div className={`p-2 rounded-lg border ${opt.previewCard} flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${opt.previewAccent}`} />
                    <div className="w-16 h-1.5 rounded-full bg-slate-500/30" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span className="text-sm font-semibold text-white">{opt.title}</span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* Motion & Interface Ergonomics */}
      <SettingsSection
        title="Motion & Layout Ergonomics"
        description="Adapt interface animations, density, and navigation behavior to your personal workflow"
      >
        <div className="space-y-1">
          {/* Reduced Motion */}
          <SettingsRow
            label="Reduce Animations"
            description="Minimizes sliding, bouncing, and non-essential UI transitions for faster perceived performance and vestibular accessibility"
            icon={<Sliders className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={reducedMotion}
              onChange={handleReducedMotionToggle}
              ariaLabel="Toggle reduced motion"
            />
          </SettingsRow>

          {/* Compact Density Mode */}
          <SettingsRow
            label="Compact Interface Density"
            description="Tighten margins, padding, and list item heights to maximize screen information density"
            icon={<Eye className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={compactMode}
              onChange={handleCompactModeToggle}
              ariaLabel="Toggle compact UI density"
            />
          </SettingsRow>

          {/* Sidebar default state */}
          <SettingsRow
            label="Default Collapsed Sidebar"
            description="Collapse the primary navigation into icon-only mode to expand dashboard canvas area"
            icon={<PanelLeftClose className="w-5 h-5" />}
          >
            <SettingsToggle
              checked={sidebarCollapsed}
              onChange={handleSidebarToggle}
              ariaLabel="Toggle default collapsed sidebar"
            />
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
};
