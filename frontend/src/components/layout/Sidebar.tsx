import React from 'react';
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemDef {
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

  const primaryNavItems: NavItemDef[] = [
    {
      name: 'Dashboard',
      shortName: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      name: 'Expenses & Ledger',
      shortName: 'Expenses',
      path: '/expenses',
      icon: CreditCard,
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/35',
    },
    {
      name: 'Bills & Utilities',
      shortName: 'Bills',
      path: '/bills',
      icon: FileText,
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      name: 'Grocery Inventory',
      shortName: 'Inventory',
      path: '/inventory',
      icon: ShoppingBag,
      gradient: 'from-rose-400 via-pink-500 to-rose-600',
      shadowColor: 'shadow-rose-500/35',
    },
    {
      name: 'Household Tasks',
      shortName: 'Tasks',
      path: '/tasks',
      icon: CheckSquare,
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      shadowColor: 'shadow-purple-500/35',
    },
    {
      name: 'Family Workspace',
      shortName: 'Family',
      path: '/family',
      icon: Users,
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/35',
    },
  ];

  const moreNavItems: NavItemDef[] = [
    {
      name: 'Income & Earnings',
      shortName: 'Income',
      path: '/income',
      icon: Wallet,
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      shadowColor: 'shadow-green-500/35',
    },
    {
      name: 'Pantry Vision OCR',
      shortName: 'Vision OCR',
      path: '/pantry-vision',
      icon: Camera,
      gradient: 'from-fuchsia-400 via-pink-500 to-purple-600',
      shadowColor: 'shadow-fuchsia-500/35',
      tag: 'AI',
      tagColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30',
    },
    {
      name: 'Home Appliances',
      shortName: 'Appliances',
      path: '/appliances',
      icon: Tv,
      gradient: 'from-sky-400 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-sky-500/35',
    },
    {
      name: 'Medicine Tracker',
      shortName: 'Medicines',
      path: '/medicines',
      icon: Pill,
      gradient: 'from-red-400 via-rose-500 to-red-600',
      shadowColor: 'shadow-red-500/35',
    },
    {
      name: 'Sustainability',
      shortName: 'Eco Score',
      path: '/sustainability',
      icon: Leaf,
      gradient: 'from-lime-400 via-emerald-500 to-green-600',
      shadowColor: 'shadow-lime-500/35',
      tag: 'ECO',
      tagColor: 'bg-lime-500/15 text-lime-600 dark:text-lime-300 border-lime-500/30',
    },
    {
      name: 'Analytics & Trends',
      shortName: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
      shadowColor: 'shadow-violet-500/35',
    },
    {
      name: 'Financial Reports',
      shortName: 'Reports',
      path: '/reports',
      icon: FileSpreadsheet,
      gradient: 'from-blue-500 via-slate-600 to-slate-700',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      name: 'User Manual',
      shortName: 'Manual',
      path: '/manual',
      icon: BookOpen,
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      name: 'Your Profile',
      shortName: 'Profile',
      path: '/profile',
      icon: User,
      gradient: 'from-indigo-400 via-blue-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/35',
    },
    {
      name: 'Settings',
      shortName: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      gradient: 'from-slate-400 via-zinc-500 to-slate-700',
      shadowColor: 'shadow-slate-500/35',
    },
  ];

  const renderNavItem = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        className="group relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all duration-200"
      >
        <div
          className={`flex flex-col items-center justify-center transition-all duration-200 ${
            isActive ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          {/* 3D Elevated Vibrant Icon Badge */}
          <div
            className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md ${
              item.shadowColor
            } border ${
              isActive ? 'border-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'border-white/25'
            } transform transition-transform duration-200 group-hover:-rotate-3`}
          >
            <Icon className="w-5 h-5 drop-shadow-sm" />
          </div>

          {/* Name Displayed When Active / Clicked */}
          {isActive && (
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-1 text-center leading-tight tracking-tight max-w-[72px] truncate animate-in fade-in duration-200">
              {item.shortName}
            </span>
          )}

          {/* Active Accent Dot */}
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#3b82f6] mt-0.5" />
          )}
        </div>

        {/* WhatsApp-Style Floating Hover Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 dark:bg-slate-900/95 text-white text-xs font-bold rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-xl z-[9999] pointer-events-none whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-150">
          <span>{item.name}</span>
          {item.tag && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
              {item.tag}
            </span>
          )}
          {/* Arrow pointing to icon */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/80 transform rotate-45" />
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
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* WhatsApp-Style Slim Icon Rail (80px width) */}
      <aside
        className={`w-20 bg-panel/95 backdrop-blur-xl border-r border-primary/80 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between py-3 px-1 transition-transform duration-300 ease-in-out shadow-sm dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Logo */}
        <div className="flex flex-col items-center justify-center pb-2 border-b border-primary/60 flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/35 border border-white/20 transform hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 drop-shadow-md animate-pulse" />
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden mt-2 p-1.5 rounded-xl text-secondary hover:text-primary bg-secondary/80 border border-primary/80"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Icon Dock (Smooth, compact) */}
        <nav className="flex-1 overflow-y-auto pr-0.5 scrollbar-thin my-2 space-y-2">
          {/* Core Modules */}
          <div className="space-y-1.5">{primaryNavItems.map(renderNavItem)}</div>

          {/* Advanced Utilities */}
          <div className="space-y-1.5 pt-2 border-t border-primary/60">
            {moreNavItems.map(renderNavItem)}
          </div>
        </nav>

        {/* Bottom Household Status */}
        <div className="pt-2 border-t border-primary/60 flex flex-col items-center justify-center flex-shrink-0">
          <div
            className="w-10 h-10 rounded-2xl bg-secondary/80 border border-primary/80 flex items-center justify-center text-primary shadow-xs relative group cursor-pointer"
            title={household?.name || 'Home Residence'}
          >
            <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
              {household?.name?.charAt(0) || 'H'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] absolute -top-0.5 -right-0.5 animate-pulse" />

            {/* Hover Tooltip for Household */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-slate-700/80 whitespace-nowrap z-[9999] pointer-events-none">
              <span>{household?.name || 'Home Residence'}</span>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/80 transform rotate-45" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
