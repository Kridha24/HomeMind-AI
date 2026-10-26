import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { SettingsNav, SettingsTabId, SETTINGS_NAV_ITEMS } from '../components/settings/SettingsNav';

// Section Components
import { ProfileSettings } from '../components/settings/sections/ProfileSettings';
import { HouseholdSettings } from '../components/settings/sections/HouseholdSettings';
import { SecuritySettings } from '../components/settings/sections/SecuritySettings';
import { NotificationSettings } from '../components/settings/sections/NotificationSettings';
import { PreferencesSettings } from '../components/settings/sections/PreferencesSettings';
import { AppearanceSettings } from '../components/settings/sections/AppearanceSettings';
import { AISettings } from '../components/settings/sections/AISettings';
import { PrivacySettings } from '../components/settings/sections/PrivacySettings';
import { IntegrationSettings } from '../components/settings/sections/IntegrationSettings';
import { AboutSettings } from '../components/settings/sections/AboutSettings';

export const Settings: React.FC = () => {
  const { user, household } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTabId | null;

  // Active Tab with URL synchronization
  const [activeTab, setActiveTab] = useState<SettingsTabId>(tabParam || 'profile');
  // Mobile Master-Detail view state (WhatsApp style)
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(!!tabParam);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tabParam && SETTINGS_NAV_ITEMS.some((i) => i.id === tabParam)) {
      setActiveTab(tabParam);
      setMobileDetailOpen(true);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: SettingsTabId) => {
    setActiveTab(tab);
    setMobileDetailOpen(true);
    setSearchParams({ tab });
  };

  const handleBackToSettingsMenu = () => {
    setMobileDetailOpen(false);
    setSearchParams({});
  };

  const handleMobileBack = () => {
    if (mobileDetailOpen) {
      handleBackToSettingsMenu();
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const currentTabConfig = SETTINGS_NAV_ITEMS.find((i) => i.id === activeTab) || SETTINGS_NAV_ITEMS[0];

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'household':
        return <HouseholdSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'ai':
        return <AISettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'integrations':
        return <IntegrationSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-6 animate-in fade-in duration-200">
      {/* ─── MOBILE NAVIGATION HEADER (WhatsApp Style) ─── */}
      <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={handleMobileBack}
          aria-label={mobileDetailOpen ? 'Back to Settings' : 'Back to Home'}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 p-1 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{mobileDetailOpen ? 'Settings' : 'Home'}</span>
        </button>
        <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
          {mobileDetailOpen ? currentTabConfig.label : 'Settings'}
        </span>
        <div className="w-12" />
      </div>

      {/* ─── DESKTOP & TABLET HEADER ─── */}
      <div className="hidden lg:flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your HomeMind.AI account, household, security and preferences.
          </p>
        </div>

        {/* Real Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {user && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Account Protected
            </span>
          )}
          {household?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Home className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{household.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── MAIN SETTINGS BODY ─── */}
      <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-6 lg:gap-8 items-start">
        {/* Navigation Sidebar (Always visible on Desktop, shown as WhatsApp vertical list on Mobile when !mobileDetailOpen) */}
        <aside
          className={`w-full lg:w-[260px] flex-shrink-0 lg:sticky lg:top-20 space-y-3 ${
            mobileDetailOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* WhatsApp-Style User Profile Header Card (on Mobile) */}
          <div
            onClick={() => handleSelectTab('profile')}
            role="button"
            tabIndex={0}
            className="lg:hidden flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 shadow-xs cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 border border-white/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {user?.name || 'HomeMind User'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.phoneNumber || user?.email || 'Tap to edit profile'}
                </p>
                {user?.role && (
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <div className="p-2 sm:p-4 rounded-xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <SettingsNav
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </aside>

        {/* Right Active Panel Content Area (Always visible on Desktop, visible on Mobile when mobileDetailOpen) */}
        <main
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`settings-nav-${activeTab}`}
          className={`flex-1 min-w-0 w-full ${
            !mobileDetailOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="transition-all duration-200 animate-in fade-in slide-in-from-bottom-1">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
