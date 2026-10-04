import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  FileText,
  ShoppingBag,
  CheckSquare,
  Users,
  BarChart3,
  Camera,
  Leaf,
  Settings as SettingsIcon,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { useI18n } from '../../utils/i18n';
import { SidebarItem, SidebarAccent } from './SidebarItem';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  key: string;
  name: string;
  path: string;
  icon: React.ElementType;
  accent: SidebarAccent;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, household } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useSettingStore();
  const { t } = useI18n();
  const location = useLocation();

  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    badge?: string;
    top: number;
  } | null>(null);

  // Grouped Navigation Items (6 Clean Categories as specified)
  const coreItems: NavItem[] = [
    { key: 'nav.dashboard', name: t('nav.dashboard', 'Dashboard'), path: '/', icon: LayoutDashboard, accent: 'indigo' },
  ];

  const financeItems: NavItem[] = [
    { key: 'nav.expenses', name: t('nav.expenses', 'Expenses & Ledger'), path: '/expenses', icon: CreditCard, accent: 'rose' },
    { key: 'nav.income', name: t('nav.income', 'Income & Earnings'), path: '/income', icon: Wallet, accent: 'emerald' },
    { key: 'nav.bills', name: t('nav.bills', 'Bills & Utilities'), path: '/bills', icon: FileText, accent: 'amber' },
  ];

  const householdItems: NavItem[] = [
    { key: 'nav.inventory', name: t('nav.inventory', 'Grocery Inventory'), path: '/groceries', icon: ShoppingBag, accent: 'teal' },
    { key: 'nav.tasks', name: t('nav.tasks', 'Household Tasks'), path: '/tasks', icon: CheckSquare, accent: 'purple' },
  ];

  const familyItems: NavItem[] = [
    { key: 'nav.family', name: t('nav.family', 'Family Workspace'), path: '/family', icon: Users, accent: 'indigo' },
  ];

  const insightItems: NavItem[] = [
    { key: 'nav.analytics', name: t('nav.analytics', 'Analytics & Trends'), path: '/analytics', icon: BarChart3, accent: 'cyan' },
    { key: 'nav.pantryVision', name: t('nav.pantryVision', 'Pantry Vision'), path: '/pantry-vision', icon: Camera, accent: 'sky', badge: 'AI' },
    { key: 'nav.sustainability', name: t('nav.sustainability', 'Sustainability'), path: '/sustainability', icon: Leaf, accent: 'emerald', badge: 'ECO' },
  ];

  const systemItems: NavItem[] = [
    { key: 'nav.settings', name: t('nav.settings', 'App Settings'), path: '/settings', icon: SettingsIcon, accent: 'neutral' },
  ];

  const handleHover = (e: React.MouseEvent<HTMLElement>, item: NavItem) => {
    if (!sidebarCollapsed) return; // Only show floating tooltip when collapsed
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      name: item.name,
      badge: item.badge,
      top: rect.top + rect.height / 2,
    });
  };

  const handleLeave = () => {
    setHoveredItem(null);
  };

  const isCollapsed = sidebarCollapsed;
  const widthClass = isCollapsed ? 'w-[68px]' : 'w-[220px]';

  const renderNavGroup = (title: string, items: NavItem[], withBorder = true) => (
    <div className={`space-y-0.5 ${withBorder ? 'pt-1.5 border-t border-slate-100 dark:border-slate-800/80' : ''}`}>
      {!isCollapsed && (
        <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block pb-0.5">
          {title}
        </span>
      )}
      {items.map((item) => (
        <SidebarItem
          key={item.path}
          icon={item.icon}
          label={item.name}
          href={item.path}
          active={location.pathname === item.path || (item.path === '/groceries' && location.pathname === '/inventory')}
          accent={item.accent}
          badge={item.badge}
          isCollapsed={isCollapsed}
          onHover={(e) => handleHover(e, item)}
          onLeave={handleLeave}
          onClick={() => {
            setHoveredItem(null);
            if (onClose) onClose();
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`${widthClass} bg-slate-50/90 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-slate-800 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between py-2.5 px-1.5 transition-all duration-200 ease-out shadow-xs dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Household Operating System Navigation"
      >
        {/* Top: Brand Logo + Mobile Close */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200/70 dark:border-slate-800/80 flex-shrink-0">
          <Link
            to="/"
            onClick={onClose}
            aria-label="Go to Dashboard"
            className="flex items-center gap-2.5 overflow-hidden group cursor-pointer p-1 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/25 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block leading-none tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  HomeMind.AI
                </span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block mt-0.5">
                  AI OS for Smarter Homes
                </span>
              </div>
            )}
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <nav
          className="flex-1 overflow-y-auto no-scrollbar py-1 space-y-1.5"
          aria-label="Navigation Sections"
        >
          {renderNavGroup(t('nav.core', 'Core'), coreItems, false)}
          {renderNavGroup(t('nav.finance', 'Finance'), financeItems)}
          {renderNavGroup(t('nav.household', 'Household'), householdItems)}
          {renderNavGroup(t('nav.family', 'Family'), familyItems)}
          {renderNavGroup(t('nav.insights', 'Insights'), insightItems)}
          {renderNavGroup(t('nav.system', 'System'), systemItems)}
        </nav>

        {/* Bottom: Desktop Expand Toggle & Dynamic Household Avatar Status */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center gap-1.5 flex-shrink-0">
          {/* Toggle Expand / Collapse */}
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-full py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-semibold">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </div>
            )}
          </button>

          {/* Household Profile Card */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center w-9 h-9' : 'w-full px-2.5 py-2'
            } rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 relative hover:border-indigo-500/50 transition-all shadow-xs cursor-pointer group`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm shadow-indigo-500/30">
              {user?.name?.charAt(0) || 'M'}
            </div>
            {!isCollapsed && (
              <div className="ml-2.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate group-hover:text-indigo-600 transition-colors">
                  {user?.name || 'Mihir kridha Shekhar Gupta'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Active Household
                  </span>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-1" />
            )}
          </div>
        </div>
      </aside>

      {/* Floating Hover Tooltip (When Collapsed) */}
      {hoveredItem && (
        <SidebarTooltip
          label={hoveredItem.name}
          badge={hoveredItem.badge}
          top={hoveredItem.top}
        />
      )}
    </>
  );
};

export default Sidebar;
