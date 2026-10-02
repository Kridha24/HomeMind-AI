import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  ChevronLeft,
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tabParam && SETTINGS_NAV_ITEMS.some((i) => i.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: SettingsTabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleMobileBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Mobile Top Navigation Header */}
      <div className="flex items-center justify-between sm:hidden pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={handleMobileBack}
          aria-label="Back to previous page"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-sm font-extrabold text-slate-900 dark:text-white">Settings</span>
        <div className="w-8" />
      </div>

      {/* Desktop & Tablet Settings Page Header */}
      <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
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

      {/* Main Settings Body: Two-Column Desktop Layout (240px nav + fluid content) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Navigation: Sticky on Desktop, 240px width */}
        <aside className="w-full lg:w-[240px] flex-shrink-0 lg:sticky lg:top-20">
          <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <SettingsNav
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </aside>

        {/* Right Active Panel Content Area: Fluid max width */}
        <main
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`settings-nav-${activeTab}`}
          className="flex-1 min-w-0 w-full"
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
