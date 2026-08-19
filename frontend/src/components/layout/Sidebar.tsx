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
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { household } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Income & Earnings', path: '/income', icon: Wallet },
    { name: 'Expenses', path: '/expenses', icon: CreditCard },
    { name: 'Bills', path: '/bills', icon: FileText },
    { name: 'Grocery Inventory', path: '/inventory', icon: ShoppingBag },
    { name: 'Pantry Vision OCR', path: '/pantry-vision', icon: Camera },
    { name: 'Appliances', path: '/appliances', icon: Tv },
    { name: 'Medicine Tracker', path: '/medicines', icon: Pill },
    { name: 'Household Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Family Workspace', path: '/family', icon: Users },
    { name: 'Sustainability', path: '/sustainability', icon: Leaf },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`w-64 bg-slate-950 border-r border-slate-800/80 h-screen fixed left-0 top-0 z-50 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-100 tracking-tight leading-none">HomeMind AI</h2>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Web Application</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 scrollbar-thin">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Active Household Info Footer */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Household</span>
            <span className="text-xs font-bold text-slate-200 truncate block">{household?.name || 'Home Residence'}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </aside>
    </>
  );
};
