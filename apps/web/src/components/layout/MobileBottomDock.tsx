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
  CreditCard,
  FileText,
  ShoppingBag,
  Sparkles,
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

  // 6 tabs: Home, Finance, Groceries, AI Chat, Tasks, Family
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Finance', path: '/expenses', icon: Wallet },
    { label: 'Groceries', path: '/groceries', icon: ShoppingCart },
    { label: 'AI Chat', path: 'ai_action', icon: Sparkles, isAction: true },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Family', path: '/family', icon: Users },
  ];

  return (
    <>
      {/* Quick Action Bottom Sheet (available on demand) */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 md:hidden animate-in fade-in duration-150"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Quick Actions</h3>
              </div>
              <button
                onClick={() => setIsActionSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenExpenseModal();
                }}
                className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-left space-y-1 hover:bg-teal-500/20 transition-colors"
              >
                <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Log Expense</span>
                <span className="text-[10px] text-slate-500 block">Add daily spend</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenBillModal();
                }}
                className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-1 hover:bg-blue-500/20 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Add Bill</span>
                <span className="text-[10px] text-slate-500 block">Utility / Subscription</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenGroceryModal();
                }}
                className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-left space-y-1 hover:bg-orange-500/20 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Add Pantry</span>
                <span className="text-[10px] text-slate-500 block">Groceries & items</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenTaskModal();
                }}
                className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-left space-y-1 hover:bg-purple-500/20 transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Assign Task</span>
                <span className="text-[10px] text-slate-500 block">Chores & todo</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onOpenAIChat();
              }}
              className="w-full min-h-[44px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask HomeMind AI Assistant</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 7. Fixed Bottom Navigation Dock with AI ─────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-1.5 py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.04)]"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key="ai_action"
                  type="button"
                  onClick={onOpenAIChat}
                  className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-0.5 px-1 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer group"
                  aria-label="Ask HomeMind AI"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/35 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-[9.5px] font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            }

            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path) ||
                  (item.path === '/expenses' && location.pathname.startsWith('/finance')) ||
                  (item.path === '/groceries' && location.pathname.startsWith('/inventory'));

            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-0.5 px-1 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className={`text-[9.5px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
