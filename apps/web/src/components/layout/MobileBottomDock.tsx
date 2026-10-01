import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  CheckSquare,
  Plus,
  X,
  FileText,
  Sparkles,
  Camera,
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

  const navItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Expenses', path: '/expenses', icon: CreditCard },
    // Center is '+' Hub
    { label: 'Pantry', path: '/inventory', icon: ShoppingBag },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  return (
    <>
      {/* Quick Action Bottom Sheet */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col justify-end p-4 lg:hidden animate-in fade-in duration-150"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-panel border border-primary/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-primary/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-primary">Quick Household Actions</h3>
              </div>
              <button
                onClick={() => setIsActionSheetOpen(false)}
                className="text-muted hover:text-primary p-1.5 rounded-xl bg-secondary/50"
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
                className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-1 hover:bg-blue-500/20 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold text-primary block">Log Expense</span>
                <span className="text-[10px] text-muted block">Add daily spend</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenBillModal();
                }}
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1 hover:bg-amber-500/20 transition-colors"
              >
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-primary block">Add Bill</span>
                <span className="text-[10px] text-muted block">Utility / Subscription</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenGroceryModal();
                }}
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-1 hover:bg-emerald-500/20 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-primary block">Add Pantry</span>
                <span className="text-[10px] text-muted block">Groceries & items</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenTaskModal();
                }}
                className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-left space-y-1 hover:bg-purple-500/20 transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold text-primary block">Assign Task</span>
                <span className="text-[10px] text-muted block">Chores & todo</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onOpenAIChat();
              }}
              className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask HomeMind AI Assistant</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Dock */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-panel/90 backdrop-blur-2xl border-t border-primary/20 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* First 2 Tabs */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-blue-400 font-bold scale-105' : 'text-muted hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Center '+' Action Hub */}
          <div className="relative -top-4 flex items-center justify-center">
            <button
              onClick={() => setIsActionSheetOpen((prev) => !prev)}
              aria-label="Quick Action Hub"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-background active:scale-95 transition-transform"
            >
              <Plus
                className={`w-6 h-6 transition-transform duration-200 ${
                  isActionSheetOpen ? 'rotate-45' : ''
                }`}
              />
            </button>
          </div>

          {/* Last 2 Tabs */}
          {navItems.slice(2, 4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-blue-400 font-bold scale-105' : 'text-muted hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
