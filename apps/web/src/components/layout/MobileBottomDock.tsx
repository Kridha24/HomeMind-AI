import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Wallet,
  ShoppingCart,
  CheckSquare,
  Users,
  Plus,
  X,
  FileText,
  Sparkles,
  PieChart,
  ArrowRight,
} from 'lucide-react';

interface MobileBottomDockProps {
  onOpenExpenseModal: () => void;
  onOpenBillModal: () => void;
  onOpenGroceryModal: () => void;
  onOpenTaskModal: () => void;
  onOpenAIChat: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  onOpenExpenseModal,
  onOpenBillModal,
  onOpenGroceryModal,
  onOpenTaskModal,
  onOpenAIChat,
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 5 Main Sections on Bottom Dock: Home, Finance, Add (+ in center), Groceries, Tasks
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Finance', path: '/expenses', icon: Wallet },
    { label: 'Add', path: 'add_action', icon: Plus, isAction: true },
    { label: 'Groceries', path: '/groceries', icon: ShoppingCart },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  // Remaining sections accessible inside + Action Sheet
  const workspaceSections = [
    {
      label: 'Groceries',
      subtitle: 'Pantry & shopping list',
      path: '/groceries',
      icon: ShoppingCart,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Tasks',
      subtitle: 'Chores & assignments',
      path: '/tasks',
      icon: CheckSquare,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Family',
      subtitle: 'Members & household room',
      path: '/family',
      icon: Users,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Bills',
      subtitle: 'Utilities & dues',
      path: '/bills',
      icon: FileText,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Analytics',
      subtitle: 'Household reports',
      path: '/analytics',
      icon: PieChart,
      color: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <>
      {/* ── + Action Sheet Modal (Houses Groceries, Tasks, Bills, Quick Actions, AI) ── */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-3 sm:p-4 md:hidden animate-in fade-in duration-150"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Quick Hub & Sections</h3>
                  <p className="text-[11px] text-slate-500">Jump to workspace or create entry</p>
                </div>
              </div>
              <button
                onClick={() => setIsActionSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Assistant Banner */}
            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onOpenAIChat();
              }}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-between shadow-lg shadow-purple-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-xs">Ask HomeMind AI</span>
                  <span className="block text-[10px] text-white/80 font-normal">Instant advice, tasks & finance insights</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            {/* Workspaces / Sections Grid (Groceries, Tasks, Bills, Analytics) */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                More Workspaces
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {workspaceSections.map((sec) => {
                  const SecIcon = sec.icon;
                  return (
                    <button
                      key={sec.path}
                      onClick={() => {
                        setIsActionSheetOpen(false);
                        navigate(sec.path);
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer ${sec.bgColor}`}
                    >
                      <div className={`p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs ${sec.color}`}>
                        <SecIcon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {sec.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {sec.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Create Actions */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                Quick Create
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenExpenseModal();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Log Expense</span>
                </button>

                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenGroceryModal();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Add Pantry</span>
                </button>

                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenTaskModal();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Assign Task</span>
                </button>

                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenBillModal();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Add Bill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Navigation Dock (5 Sections: Home, Finance, +, Groceries, Tasks) ── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-t border-slate-100/90 dark:border-slate-800/80 px-2 sm:px-3 pt-1.5 pb-[calc(0.55rem+env(safe-area-inset-bottom,0px))] md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] transition-colors"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 items-end w-full max-w-sm sm:max-w-md mx-auto">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key="add_action" className="col-span-1 flex flex-col items-center justify-end relative">
                  <button
                    type="button"
                    onClick={() => setIsActionSheetOpen((prev) => !prev)}
                    className="flex flex-col items-center justify-center -translate-y-3 active:scale-95 transition-all duration-200 cursor-pointer group focus:outline-none"
                    aria-label="Create or Open Sections"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-[0_8px_22px_rgba(147,51,234,0.4)] group-hover:scale-105 group-hover:shadow-[0_10px_26px_rgba(147,51,234,0.55)] transition-all ${
                      isActionSheetOpen ? 'rotate-45' : 'rotate-0'
                    }`}>
                      <Plus className="w-6 h-6 stroke-[2.3] text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 tracking-tight mt-1 font-sans">
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            }

            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path) ||
                  (item.path === '/expenses' && (location.pathname.startsWith('/finance') || location.pathname.startsWith('/income')));

            const Icon = item.icon;

            return (
              <div key={item.path} className="col-span-1 flex flex-col items-center justify-end">
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-full flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none ${
                    isActive
                      ? 'text-purple-600 dark:text-purple-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                  aria-label={item.label}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.6]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight mt-1 font-sans">
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
