import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  FileText,
  ShoppingBag,
  Camera,
  Tv,
  Pill,
  CheckSquare,
  Users,
  Leaf,
  BarChart3,
  FileSpreadsheet,
  Settings as SettingsIcon,
  User,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useI18n } from '../../utils/i18n';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemDef {
  key: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  tag?: string;
  tagColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { household } = useAuthStore();
  const location = useLocation();
  const { t } = useI18n();

  // Floating Hover State (Guaranteed zero clipping)
  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    tag?: string;
    top: number;
  } | null>(null);

  const primaryNavItems: NavItemDef[] = [
    {
      key: 'nav.dashboard',
      name: t('nav.dashboard', 'Dashboard'),
      shortName: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      key: 'nav.expenses',
      name: t('nav.expenses', 'Expenses & Ledger'),
      shortName: 'Expenses',
      path: '/expenses',
      icon: CreditCard,
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/35',
    },
    {
      key: 'nav.bills',
      name: t('nav.bills', 'Bills & Utilities'),
      shortName: 'Bills',
      path: '/bills',
      icon: FileText,
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      key: 'nav.inventory',
      name: t('nav.inventory', 'Grocery Inventory'),
      shortName: 'Inventory',
      path: '/inventory',
      icon: ShoppingBag,
      gradient: 'from-rose-400 via-pink-500 to-rose-600',
      shadowColor: 'shadow-rose-500/35',
    },
    {
      key: 'nav.tasks',
      name: t('nav.tasks', 'Household Tasks'),
      shortName: 'Tasks',
      path: '/tasks',
      icon: CheckSquare,
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      shadowColor: 'shadow-purple-500/35',
    },
    {
      key: 'nav.family',
      name: t('nav.family', 'Family Workspace'),
      shortName: 'Family',
      path: '/family',
      icon: Users,
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/35',
    },
  ];

  const moreNavItems: NavItemDef[] = [
    {
      key: 'nav.income',
      name: t('nav.income', 'Income & Earnings'),
      shortName: 'Income',
      path: '/income',
      icon: Wallet,
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      shadowColor: 'shadow-green-500/35',
    },
    {
      key: 'nav.pantryVision',
      name: t('nav.pantryVision', 'Pantry Vision OCR'),
      shortName: 'Vision OCR',
      path: '/pantry-vision',
      icon: Camera,
      gradient: 'from-fuchsia-400 via-pink-500 to-purple-600',
      shadowColor: 'shadow-fuchsia-500/35',
      tag: 'AI',
      tagColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30',
    },
    {
      key: 'nav.appliances',
      name: t('nav.appliances', 'Home Appliances'),
      shortName: 'Appliances',
      path: '/appliances',
      icon: Tv,
      gradient: 'from-sky-400 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-sky-500/35',
    },
    {
      key: 'nav.medicines',
      name: t('nav.medicines', 'Medicine Tracker'),
      shortName: 'Medicines',
      path: '/medicines',
      icon: Pill,
      gradient: 'from-red-400 via-rose-500 to-red-600',
      shadowColor: 'shadow-red-500/35',
    },
    {
      key: 'nav.sustainability',
      name: t('nav.sustainability', 'Sustainability & Eco'),
      shortName: 'Eco Score',
      path: '/sustainability',
      icon: Leaf,
      gradient: 'from-lime-400 via-emerald-500 to-green-600',
      shadowColor: 'shadow-lime-500/35',
      tag: 'ECO',
      tagColor: 'bg-lime-500/15 text-lime-600 dark:text-lime-300 border-lime-500/30',
    },
    {
      key: 'nav.analytics',
      name: t('nav.analytics', 'Analytics & Trends'),
      shortName: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
      shadowColor: 'shadow-violet-500/35',
    },
    {
      key: 'nav.reports',
      name: t('nav.reports', 'Financial Reports'),
      shortName: 'Reports',
      path: '/reports',
      icon: FileSpreadsheet,
      gradient: 'from-blue-500 via-slate-600 to-slate-700',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      key: 'nav.manual',
      name: t('nav.manual', 'User Manual'),
      shortName: 'Manual',
      path: '/manual',
      icon: BookOpen,
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      key: 'nav.profile',
      name: t('nav.profile', 'Your Profile'),
      shortName: 'Profile',
      path: '/profile',
      icon: User,
      gradient: 'from-indigo-400 via-blue-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/35',
    },
    {
      key: 'nav.settings',
      name: t('nav.settings', 'App Settings'),
      shortName: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      gradient: 'from-slate-400 via-zinc-500 to-slate-700',
      shadowColor: 'shadow-slate-500/35',
    },
  ];

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, item: NavItemDef) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      name: item.name,
      tag: item.tag,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const renderNavItem = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        aria-label={item.name}
        onClick={() => {
          setHoveredItem(null);
          if (onClose) onClose();
        }}
        onMouseEnter={(e) => handleMouseEnter(e, item)}
        onMouseLeave={handleMouseLeave}
        className="group relative flex items-center justify-center p-1 rounded-2xl transition-all duration-150"
      >
        <div
          className={`relative flex items-center justify-center transition-all duration-200 ${
            isActive ? 'scale-105' : 'hover:scale-105 active:scale-95'
          }`}
        >
          {/* 3D Elevated Vibrant Icon Badge */}
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md ${
              item.shadowColor
            } border ${
              isActive
                ? 'border-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 shadow-blue-500/50'
                : 'border-white/25 hover:border-white/60'
            } transform transition-all duration-200`}
          >
            <Icon className="w-5 h-5 drop-shadow-sm" />
          </div>

          {/* Active Glowing Indicator Pill on Left */}
          {isActive && (
            <div className="absolute -left-3 w-1.5 h-6 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_10px_#3b82f6]" />
          )}
        </div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Slim 3D Icon Dock (80px width) */}
      <aside
        className={`w-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between py-3 px-1 transition-transform duration-300 ease-in-out shadow-sm dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Logo */}
        <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredItem({
                name: 'HomeMind AI OS',
                tag: 'PRO',
                top: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={handleMouseLeave}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/35 border border-white/20 transform hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Sparkles className="w-5 h-5 drop-shadow-md animate-pulse" />
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden mt-2 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable 3D Icon Dock */}
        <nav className="flex-1 overflow-y-auto pr-0.5 scrollbar-thin my-2 space-y-2" aria-label="Sidebar Navigation">
          {/* Core Modules */}
          <div className="space-y-1.5">{primaryNavItems.map(renderNavItem)}</div>

          {/* Advanced Utilities */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {moreNavItems.map(renderNavItem)}
          </div>
        </nav>

        {/* Bottom Household Status */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center flex-shrink-0">
          <div
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredItem({
                name: household?.name || t('dash.household', 'Home Residence'),
                tag: 'ACTIVE',
                top: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={handleMouseLeave}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs relative cursor-pointer hover:border-blue-500/50 transition-colors"
          >
            <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
              {household?.name?.charAt(0) || 'H'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Floating Hover Tooltip (Fixed coordinate portal - 100% unclipped) */}
      {hoveredItem && (
        <div
          style={{ top: `${hoveredItem.top}px` }}
          className="fixed left-[86px] -translate-y-1/2 flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 dark:bg-slate-900/95 text-white text-xs font-bold rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-xl z-[99999] pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
        >
          <span>{hoveredItem.name}</span>
          {hoveredItem.tag && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
              {hoveredItem.tag}
            </span>
          )}
          {/* Arrow pointer towards icon */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 border-l border-b border-slate-700/80 transform rotate-45" />
        </div>
      )}
    </>
  );
};

export default Sidebar;
