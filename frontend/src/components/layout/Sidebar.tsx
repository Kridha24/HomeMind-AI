import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ShoppingBag,
  Camera,
  UtensilsCrossed,
  Tv,
  Pill,
  CheckSquare,
  Users,
  BarChart3,
  Leaf,
  FileSpreadsheet,
  Bot,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/bills', label: 'Bills', icon: Receipt },
  { path: '/inventory', label: 'Inventory', icon: ShoppingBag },
  { path: '/pantry-vision', label: 'Pantry Vision', icon: Camera, badge: 'AI OCR' },
  { path: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { path: '/appliances', label: 'Appliances', icon: Tv },
  { path: '/medicines', label: 'Medicines', icon: Pill },
  { path: '/tasks', label: 'Family Tasks', icon: CheckSquare },
  { path: '/family', label: 'Family Workspace', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/sustainability', label: 'Sustainability', icon: Leaf },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
];

export const Sidebar: React.FC = () => {
  const { logout, user, household } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
            HomeMind <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">AI</span>
          </h1>
          <p className="text-xs text-slate-400 truncate max-w-[140px]">{household?.name || 'Household OS'}</p>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Operating Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <img
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Alex')}&background=3b82f6&color=fff`}
            alt="Avatar"
            className="w-8 h-8 rounded-full border border-blue-500/30 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Alex Rivera'}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
