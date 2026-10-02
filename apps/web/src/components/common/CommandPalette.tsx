import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  CreditCard,
  FileText,
  ShoppingBag,
  Tv,
  Pill,
  CheckSquare,
  Users,
  Leaf,
  BarChart3,
  FileSpreadsheet,
  Settings,
  User,
  Sparkles,
  Plus,
  ArrowRight,
  Command,
  X,
  Bell,
  Camera,
  Wallet,
  Smartphone,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExpenseModal: () => void;
  onOpenBillModal: () => void;
  onOpenGroceryModal: () => void;
  onOpenTaskModal: () => void;
  onOpenApplianceModal: () => void;
  onOpenMedicineModal: () => void;
  onOpenAIChat: () => void;
  onOpenNotifications: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Navigation' | 'AI & System';
  shortcut?: string;
  icon: React.ElementType;
  keywords?: string[];
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenExpenseModal,
  onOpenBillModal,
  onOpenGroceryModal,
  onOpenTaskModal,
  onOpenApplianceModal,
  onOpenMedicineModal,
  onOpenAIChat,
  onOpenNotifications,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    // ── Quick Actions ──
    {
      id: 'act-expense',
      title: 'Log New Expense',
      category: 'Actions',
      shortcut: 'E',
      icon: CreditCard,
      keywords: ['spend', 'money', 'payment', 'cost', 'buy'],
      action: () => {
        onClose();
        onOpenExpenseModal();
      },
    },
    {
      id: 'act-bill',
      title: 'Add Utility / Subscription Bill',
      category: 'Actions',
      shortcut: 'B',
      icon: FileText,
      keywords: ['electricity', 'wifi', 'rent', 'netflix', 'water'],
      action: () => {
        onClose();
        onOpenBillModal();
      },
    },
    {
      id: 'act-grocery',
      title: 'Add Pantry / Grocery Item',
      category: 'Actions',
      shortcut: 'G',
      icon: ShoppingBag,
      keywords: ['food', 'milk', 'vegetables', 'fridge', 'pantry'],
      action: () => {
        onClose();
        onOpenGroceryModal();
      },
    },
    {
      id: 'act-task',
      title: 'Create Household Task / Chore',
      category: 'Actions',
      shortcut: 'T',
      icon: CheckSquare,
      keywords: ['chore', 'todo', 'clean', 'assign'],
      action: () => {
        onClose();
        onOpenTaskModal();
      },
    },
    {
      id: 'act-medicine',
      title: 'Add Medicine Reminder',
      category: 'Actions',
      shortcut: 'M',
      icon: Pill,
      keywords: ['pill', 'prescription', 'health', 'dose'],
      action: () => {
        onClose();
        onOpenMedicineModal();
      },
    },
    {
      id: 'act-appliance',
      title: 'Register Home Appliance',
      category: 'Actions',
      shortcut: 'A',
      icon: Tv,
      keywords: ['device', 'ac', 'fridge', 'warranty', 'washing machine'],
      action: () => {
        onClose();
        onOpenApplianceModal();
      },
    },

    // ── AI & System ──
    {
      id: 'sys-ai',
      title: 'Ask HomeMind.AI Assistant',
      category: 'AI & System',
      shortcut: '⌘J',
      icon: Sparkles,
      keywords: ['ask', 'chat', 'recipe', 'help', 'insights'],
      action: () => {
        onClose();
        onOpenAIChat();
      },
    },
    {
      id: 'sys-scan',
      title: 'Pantry Vision AI Scanner',
      category: 'AI & System',
      shortcut: 'V',
      icon: Camera,
      keywords: ['camera', 'ocr', 'fridge scan', 'vision', 'photo'],
      action: () => {
        onClose();
        navigate('/pantry-vision');
      },
    },
    {
      id: 'sys-notifications',
      title: 'View Household Notifications',
      category: 'AI & System',
      shortcut: 'N',
      icon: Bell,
      keywords: ['alerts', 'reminders', 'updates'],
      action: () => {
        onClose();
        onOpenNotifications();
      },
    },

    // ── Navigation ──
    {
      id: 'nav-dashboard',
      title: 'Dashboard Overview',
      category: 'Navigation',
      shortcut: '1',
      icon: LayoutDashboard,
      keywords: ['home', 'metrics', 'vitals'],
      action: () => {
        onClose();
        navigate('/');
      },
    },
    {
      id: 'act-uncategorized',
      title: 'Filter Uncategorized Transactions',
      category: 'Actions',
      icon: CreditCard,
      keywords: ['review', 'categorize', 'pending', 'unknown'],
      action: () => {
        onClose();
        navigate('/expenses?category=Uncategorized');
      },
    },
    {
      id: 'nav-expenses',
      title: 'Expenses & Transactions',
      category: 'Navigation',
      shortcut: '2',
      icon: CreditCard,
      keywords: ['transactions', 'spendings', 'history', 'ledger', 'activity'],
      action: () => {
        onClose();
        navigate('/expenses');
      },
    },
    {
      id: 'nav-sms',
      title: 'Bank & UPI Auto-Detected SMS',
      category: 'Navigation',
      icon: Smartphone,
      keywords: ['sms', 'upi', 'bank', 'auto-detected', 'detection'],
      action: () => {
        onClose();
        navigate('/expenses?tab=sms');
      },
    },
    {
      id: 'nav-income',
      title: 'Income & Earnings',
      category: 'Navigation',
      icon: Wallet,
      keywords: ['salary', 'revenue', 'deposit'],
      action: () => {
        onClose();
        navigate('/income');
      },
    },
    {
      id: 'nav-bills',
      title: 'Bills & Recurring Payments',
      category: 'Navigation',
      shortcut: '3',
      icon: FileText,
      keywords: ['bills', 'recurring', 'subscriptions', 'due dates', 'rent', 'utilities'],
      action: () => {
        onClose();
        navigate('/bills');
      },
    },
    {
      id: 'nav-bills-due-soon',
      title: 'Show Bills Due Soon',
      category: 'Navigation',
      icon: Clock,
      keywords: ['bills due soon', 'upcoming bills', 'due this week'],
      action: () => {
        onClose();
        navigate('/bills?filter=due-soon');
      },
    },
    {
      id: 'nav-bills-overdue',
      title: 'Show Overdue Bills',
      category: 'Navigation',
      icon: AlertTriangle,
      keywords: ['overdue bills', 'unpaid bills', 'late bills'],
      action: () => {
        onClose();
        navigate('/bills?filter=overdue');
      },
    },
    {
      id: 'nav-inventory',
      title: 'Pantry & Food Inventory',
      category: 'Navigation',
      shortcut: '4',
      icon: ShoppingBag,
      keywords: ['groceries', 'fridge', 'expiry', 'items'],
      action: () => {
        onClose();
        navigate('/inventory');
      },
    },
    {
      id: 'nav-appliances',
      title: 'Appliances & Maintenance',
      category: 'Navigation',
      icon: Tv,
      keywords: ['warranty', 'repairs', 'assets'],
      action: () => {
        onClose();
        navigate('/appliances');
      },
    },
    {
      id: 'nav-medicines',
      title: 'Medicine Schedule & Cabinet',
      category: 'Navigation',
      icon: Pill,
      keywords: ['pills', 'dosages', 'doctor'],
      action: () => {
        onClose();
        navigate('/medicines');
      },
    },
    {
      id: 'nav-tasks',
      title: 'Tasks & Chores Board',
      category: 'Navigation',
      icon: CheckSquare,
      keywords: ['kanban', 'chores', 'family tasks'],
      action: () => {
        onClose();
        navigate('/tasks');
      },
    },
    {
      id: 'nav-family',
      title: 'Family Workspace & Members',
      category: 'Navigation',
      icon: Users,
      keywords: ['invite', 'roles', 'permissions', 'housemates'],
      action: () => {
        onClose();
        navigate('/family');
      },
    },
    {
      id: 'nav-sustainability',
      title: 'Sustainability & Green Score',
      category: 'Navigation',
      icon: Leaf,
      keywords: ['carbon', 'waste', 'solar', 'eco'],
      action: () => {
        onClose();
        navigate('/sustainability');
      },
    },
    {
      id: 'nav-analytics',
      title: 'Analytics & Trends',
      category: 'Navigation',
      icon: BarChart3,
      keywords: ['charts', 'spending rate', 'graphs'],
      action: () => {
        onClose();
        navigate('/analytics');
      },
    },
    {
      id: 'nav-reports',
      title: 'Financial & Monthly Reports',
      category: 'Navigation',
      icon: FileSpreadsheet,
      keywords: ['pdf', 'export', 'tax', 'summary'],
      action: () => {
        onClose();
        navigate('/reports');
      },
    },
    {
      id: 'nav-settings',
      title: 'Settings & Household Preferences',
      category: 'Navigation',
      icon: Settings,
      keywords: ['currency', 'dark mode', 'theme', 'account'],
      action: () => {
        onClose();
        navigate('/settings');
      },
    },
    {
      id: 'nav-profile',
      title: 'Your User Profile',
      category: 'Navigation',
      icon: User,
      keywords: ['avatar', 'phone', 'email', 'name'],
      action: () => {
        onClose();
        navigate('/profile');
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-start justify-center pt-[10vh] sm:pt-[15vh] p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-primary/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-primary/20 flex items-center gap-3 bg-secondary/30">
          <Search className="w-5 h-5 text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search pages, or log an item..."
            className="flex-1 bg-transparent border-none text-base sm:text-lg text-primary placeholder-slate-500 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-muted hover:text-primary p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] font-mono text-muted bg-background/70 px-2 py-1 rounded-lg border border-primary/20">
            <span className="text-xs">ESC</span>
          </div>
        </div>

        {/* Command List */}
        <div ref={listRef} className="overflow-y-auto p-2 sm:p-3 space-y-1 flex-1">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm space-y-1">
              <p className="font-semibold text-primary">No commands found</p>
              <p className="text-xs">Try searching for "expense", "bill", "pantry", or "settings"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              const Icon = cmd.icon;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.008]'
                      : 'text-secondary hover:bg-secondary/60 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-background/80 text-blue-400 border border-primary/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-sm block truncate">{cmd.title}</span>
                      <span
                        className={`text-[10px] block uppercase tracking-wider ${
                          isSelected ? 'text-blue-100' : 'text-muted'
                        }`}
                      >
                        {cmd.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {cmd.shortcut && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-background/60 text-muted border border-primary/20'
                        }`}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-white opacity-100' : 'text-muted opacity-0'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-primary/20 bg-secondary/20 flex items-center justify-between text-[11px] text-muted px-4">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            HomeMind Universal Palette
          </span>
        </div>
      </div>
    </div>
  );
};
