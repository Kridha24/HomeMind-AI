import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Wallet,
  CreditCard,
  FileText,
  ShoppingBag,
  Camera,
  UtensilsCrossed,
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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { household } = useAuthStore();

  const primaryNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: CreditCard },
    { name: 'Bills', path: '/bills', icon: FileText },
    { name: 'Grocery Inventory', path: '/inventory', icon: ShoppingBag },
    { name: 'Household Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Family Workspace', path: '/family', icon: Users },
  ];

  const moreNavItems = [
    { name: 'Income & Earnings', path: '/income', icon: Wallet },
    { name: 'Pantry Vision OCR', path: '/pantry-vision', icon: Camera },
    { name: 'Appliances', path: '/appliances', icon: Tv },
    { name: 'Medicine Tracker', path: '/medicines', icon: Pill },
    { name: 'Sustainability', path: '/sustainability', icon: Leaf },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'User Manual', path: '/manual', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const navItems = [...primaryNavItems, ...moreNavItems];

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
        className={`w-64 bg-panel/95 backdrop-blur-xl border-r border-primary/80 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shadow-sm dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-primary tracking-tight leading-none">HomeMind AI</h2>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase">
                  Household OS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-secondary hover:text-primary bg-secondary/60 border border-primary/80"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 scrollbar-thin pb-10">
            {/* Desktop: Show all items sequentially */}
            <div className="hidden lg:block space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30'
                        : 'text-secondary hover:text-primary hover:bg-secondary/70'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Mobile: Grouped Navigation */}
            <div className="lg:hidden space-y-4">
              {/* Primary Group */}
              <div className="space-y-1">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30'
                          : 'text-secondary hover:text-primary hover:bg-secondary/70'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>

              {/* Secondary (More) Group */}
              <div className="pt-2 border-t border-primary/40 space-y-1">
                <p className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider mb-2">More Tools</p>
                {moreNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30'
                          : 'text-secondary hover:text-primary hover:bg-secondary/70'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* Active Household Info Footer */}
        <div className="bg-secondary/60 border border-primary/80 rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <div className="truncate">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Household</span>
            <span className="text-xs font-bold text-primary truncate block">{household?.name || 'Home Residence'}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </aside>
    </>
  );
};
