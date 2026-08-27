import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemDef {
  name: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  tag?: string;
  tagColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { household } = useAuthStore();

  const primaryNavItems: NavItemDef[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: CreditCard,
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/35',
    },
    {
      name: 'Bills & Utilities',
      path: '/bills',
      icon: FileText,
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      name: 'Grocery Inventory',
      path: '/inventory',
      icon: ShoppingBag,
      gradient: 'from-rose-400 via-pink-500 to-rose-600',
      shadowColor: 'shadow-rose-500/35',
    },
    {
      name: 'Household Tasks',
      path: '/tasks',
      icon: CheckSquare,
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      shadowColor: 'shadow-purple-500/35',
    },
    {
      name: 'Family Workspace',
      path: '/family',
      icon: Users,
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/35',
    },
  ];

  const moreNavItems: NavItemDef[] = [
    {
      name: 'Income & Earnings',
      path: '/income',
      icon: Wallet,
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      shadowColor: 'shadow-green-500/35',
    },
    {
      name: 'Pantry Vision OCR',
      path: '/pantry-vision',
      icon: Camera,
      gradient: 'from-fuchsia-400 via-pink-500 to-purple-600',
      shadowColor: 'shadow-fuchsia-500/35',
      tag: 'AI',
      tagColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30',
    },
    {
      name: 'Appliances',
      path: '/appliances',
      icon: Tv,
      gradient: 'from-sky-400 via-indigo-500 to-blue-600',
      shadowColor: 'shadow-sky-500/35',
    },
    {
      name: 'Medicine Tracker',
      path: '/medicines',
      icon: Pill,
      gradient: 'from-red-400 via-rose-500 to-red-600',
      shadowColor: 'shadow-red-500/35',
    },
    {
      name: 'Sustainability',
      path: '/sustainability',
      icon: Leaf,
      gradient: 'from-lime-400 via-emerald-500 to-green-600',
      shadowColor: 'shadow-lime-500/35',
      tag: 'ECO',
      tagColor: 'bg-lime-500/15 text-lime-600 dark:text-lime-300 border-lime-500/30',
    },
    {
      name: 'Analytics & Trends',
      path: '/analytics',
      icon: BarChart3,
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
      shadowColor: 'shadow-violet-500/35',
    },
    {
      name: 'Financial Reports',
      path: '/reports',
      icon: FileSpreadsheet,
      gradient: 'from-blue-500 via-slate-600 to-slate-700',
      shadowColor: 'shadow-blue-500/35',
    },
    {
      name: 'User Manual',
      path: '/manual',
      icon: BookOpen,
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      shadowColor: 'shadow-amber-500/35',
    },
    {
      name: 'Your Profile',
      path: '/profile',
      icon: User,
      gradient: 'from-indigo-400 via-blue-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/35',
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      gradient: 'from-slate-400 via-zinc-500 to-slate-700',
      shadowColor: 'shadow-slate-500/35',
    },
  ];

  const renderNavLink = (item: NavItemDef) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={({ isActive }) =>
          `group relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
            isActive
              ? 'bg-blue-50/90 text-blue-700 shadow-sm border border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
              : 'text-secondary hover:text-primary hover:bg-secondary/70'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3 min-w-0">
              {/* 3D Elevated Icon Badge */}
              <div
                className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md ${item.shadowColor} border border-white/25 transform transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 flex-shrink-0`}
              >
                <Icon className="w-3.5 h-3.5 drop-shadow-sm" />
              </div>

              {/* Title */}
              <span className="truncate tracking-tight">{item.name}</span>
            </div>

            {/* Right Badges / Active Indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
              {item.tag && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                    item.tagColor || 'bg-blue-500/15 text-blue-600 border-blue-500/30'
                  }`}
                >
                  {item.tag}
                </span>
              )}

              {isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5" />
              )}
            </div>
          </>
        )}
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

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`w-64 bg-panel/95 backdrop-blur-xl border-r border-primary/80 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between p-3.5 sm:p-4 transition-transform duration-300 ease-in-out shadow-sm dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              {/* 3D Glowing App Icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/35 border border-white/20 transform hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 drop-shadow-md animate-pulse" />
              </div>
              <div>
                <h2 className="font-black text-sm text-primary tracking-tight leading-tight">
                  HomeMind AI
                </h2>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase">
                  Household OS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-secondary hover:text-primary bg-secondary/80 border border-primary/80"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-190px)] pr-1 scrollbar-thin pb-8">
            {/* Primary Core Suite */}
            <div className="space-y-1">
              <div className="px-3 pb-1">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest block">
                  Core Management
                </span>
              </div>
              {primaryNavItems.map(renderNavLink)}
            </div>

            {/* Advanced Household Utilities */}
            <div className="space-y-1 pt-2 border-t border-primary/60">
              <div className="px-3 pb-1">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest block">
                  Household Tools
                </span>
              </div>
              {moreNavItems.map(renderNavLink)}
            </div>
          </nav>
        </div>

        {/* Active Household Info Footer */}
        <div className="bg-secondary/70 border border-primary/80 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <div className="truncate">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Active Household
            </span>
            <span className="text-xs font-extrabold text-primary truncate block">
              {household?.name || 'Home Residence'}
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
