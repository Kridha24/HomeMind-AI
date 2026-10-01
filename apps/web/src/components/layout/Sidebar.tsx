import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  FileText,
  ShoppingBag,
  CheckSquare,
  Users,
  BookOpen,
  Pill,
  Tv,
  Leaf,
  BarChart3,
  Camera,
  FileSpreadsheet,
  Settings as SettingsIcon,
  User,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { SidebarItem } from './SidebarItem';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  accent: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'neutral';
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { household } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useSettingStore();
  const location = useLocation();

  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    badge?: string;
    top: number;
  } | null>(null);

  // Grouped Navigation Items (Using only existing routes)
  const coreItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, accent: 'blue' },
    { name: 'Expenses', path: '/expenses', icon: CreditCard, accent: 'emerald' },
    { name: 'Income', path: '/income', icon: Wallet, accent: 'emerald' },
    { name: 'Bills', path: '/bills', icon: FileText, accent: 'amber' },
    { name: 'Groceries', path: '/inventory', icon: ShoppingBag, accent: 'emerald' },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, accent: 'purple' },
  ];

  const householdItems: NavItem[] = [
    { name: 'Family Workspace', path: '/family', icon: Users, accent: 'cyan' },
    { name: 'User Manual', path: '/manual', icon: BookOpen, accent: 'amber' },
    { name: 'Medicines', path: '/medicines', icon: Pill, accent: 'purple' },
    { name: 'Appliances', path: '/appliances', icon: Tv, accent: 'cyan' },
    { name: 'Sustainability', path: '/sustainability', icon: Leaf, accent: 'emerald', badge: 'ECO' },
  ];

  const insightItems: NavItem[] = [
    { name: 'Analytics', path: '/analytics', icon: BarChart3, accent: 'blue' },
    { name: 'Vision OCR', path: '/pantry-vision', icon: Camera, accent: 'purple', badge: 'AI' },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet, accent: 'neutral' },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, accent: 'neutral' },
    { name: 'Profile', path: '/profile', icon: User, accent: 'blue' },
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
  const widthClass = isCollapsed ? 'w-[72px]' : 'w-[220px]';

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
        className={`${widthClass} bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between py-3 px-1 transition-all duration-200 ease-out shadow-xs dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Household Operating System Navigation"
      >
        {/* Top: Brand Logo + Mobile Close */}
        <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-black text-sm text-slate-900 dark:text-white block leading-none tracking-tight">
                  HomeMind
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block mt-0.5">
                  AI OS
                </span>
              </div>
            )}
          </div>

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
          className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-3"
          aria-label="Navigation Sections"
        >
          {/* Section 1: CORE */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block pb-1">
                Core
              </span>
            )}
            {coreItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.name}
                href={item.path}
                active={location.pathname === item.path}
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

          {/* Section 2: HOUSEHOLD */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block pb-1">
                Household
              </span>
            )}
            {householdItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.name}
                href={item.path}
                active={location.pathname === item.path}
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

          {/* Section 3: INSIGHTS & UTILITIES */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block pb-1">
                Insights
              </span>
            )}
            {insightItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.name}
                href={item.path}
                active={location.pathname === item.path}
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
        </nav>

        {/* Bottom: Desktop Expand Toggle & Dynamic Household Avatar Status */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-1.5 flex-shrink-0">
          {/* Toggle Expand / Collapse */}
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-full py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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

          {/* Household Status Pill */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center w-10 h-10' : 'w-full px-2 py-1.5'
            } rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 relative hover:border-blue-500/40 transition-colors`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {household?.name?.charAt(0) || 'H'}
            </div>
            {!isCollapsed && (
              <div className="ml-2 min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {household?.name || 'Home Residence'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                  Active Household
                </span>
              </div>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 shadow-[0_0_6px_#10b981]" />
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
