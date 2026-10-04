import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Utensils, AlertCircle, Zap, ShieldAlert, Check } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';
import { useNavigate } from 'react-router-dom';

interface ActionableAIFeedProps {
  upcomingBills?: any[];
  groceries?: any[];
  pendingTasks?: any[];
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlySavings?: number;
  onOpenAIChatWithPrompt?: (prompt: string) => void;
  onOpenTaskModal?: () => void;
  onOpenExpenseModal?: () => void;
}

interface ActionCard {
  id: string;
  type: 'BILL' | 'GROCERY' | 'TASK' | 'FINANCE';
  title: string;
  description: string;
  impactBadge: string;
  impactColor: 'amber' | 'emerald' | 'purple' | 'blue';
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}

export const ActionableAIFeed: React.FC<ActionableAIFeedProps> = ({
  upcomingBills = [],
  groceries = [],
  pendingTasks = [],
  monthlyIncome = 0,
  monthlyExpenses = 0,
  monthlySavings = 0,
  onOpenAIChatWithPrompt,
  onOpenTaskModal,
  onOpenExpenseModal,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { format, aiSuggestions } = useSettingStore();
  const navigate = useNavigate();

  // 1. Avoid Late Fee (Real upcoming bill)
  const unpaidBills = upcomingBills.filter((b: any) => b.status !== 'PAID');
  const firstBill = unpaidBills[0];

  // 2. Groceries: Check for real expiry data vs low/out-of-stock restock signals
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringSoonGroceries = groceries.filter((g: any) => {
    if (!g.expiryDate) return false;
    const exp = new Date(g.expiryDate);
    return exp.getTime() >= now.getTime() && exp.getTime() <= threeDaysFromNow.getTime();
  });

  const urgentGroceries = groceries.filter(
    (g: any) => g.status === 'LOW_STOCK' || g.status === 'OUT_OF_STOCK'
  );

  // 3. Save Time (Real pending household chores)
  const firstPendingTask = pendingTasks.find((t: any) => t.status !== 'COMPLETED');

  // Build real data action cards
  const realCards: ActionCard[] = [];

  // Card 1: Bill / Avoid Late Fee
  if (firstBill) {
    realCards.push({
      id: `bill-${firstBill.id || firstBill.title}`,
      type: 'BILL',
      title: `Bill Due: ${firstBill.title}`,
      description: `${format(firstBill.amount)} is due on ${new Date(
        firstBill.dueDate
      ).toLocaleDateString([], { month: 'short', day: 'numeric' })}. Avoid late fee penalties.`,
      impactBadge: 'Avoid Late Fee',
      impactColor: 'amber',
      primaryActionLabel: 'View Bill',
      onPrimaryAction: () => {
        navigate('/bills');
      },
    });
  }

  // Card 2A: Real Expiry Date -> Reduce Food Waste
  if (expiringSoonGroceries.length > 0) {
    const itemNames = expiringSoonGroceries.map((g: any) => g.name).slice(0, 3).join(', ');
    realCards.push({
      id: 'grocery-expiry',
      type: 'GROCERY',
      title: 'Pantry Expiry Alert',
      description: `${itemNames} near expiration date. Use soon to minimize food waste.`,
      impactBadge: 'Reduce Food Waste',
      impactColor: 'emerald',
      primaryActionLabel: 'View Grocery',
      onPrimaryAction: () => {
        navigate('/groceries');
      },
    });
  } else if (urgentGroceries.length > 0) {
    // Card 2B: LOW_STOCK / OUT_OF_STOCK -> Restock Soon (NOT food waste)
    const itemNames = urgentGroceries.map((g: any) => g.name).slice(0, 3).join(', ');
    realCards.push({
      id: 'grocery-stock',
      type: 'GROCERY',
      title: 'Pantry Restock Notice',
      description: `${itemNames} marked low or depleted in stock. Restock soon to keep household essentials full.`,
      impactBadge: 'Restock Soon',
      impactColor: 'emerald',
      primaryActionLabel: 'View Grocery',
      onPrimaryAction: () => {
        navigate('/groceries');
      },
    });
  } else if (groceries.length > 0) {
    realCards.push({
      id: 'grocery-check',
      type: 'GROCERY',
      title: 'Grocery Inventory In Sync',
      description: `${groceries.length} household groceries tracked with active stock levels.`,
      impactBadge: 'Kitchen Pantry',
      impactColor: 'emerald',
      primaryActionLabel: 'View Grocery',
      onPrimaryAction: () => {
        navigate('/groceries');
      },
    });
  }

  // Card 3: Save Time / Existing Pending Household Task (Prefer "View Task" to avoid duplicate tasks)
  if (firstPendingTask) {
    realCards.push({
      id: `task-${firstPendingTask.id || firstPendingTask.title}`,
      type: 'TASK',
      title: `Task: ${firstPendingTask.title}`,
      description: firstPendingTask.dueDate
        ? `Scheduled for ${new Date(firstPendingTask.dueDate).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          })}. Complete on time to keep home running smoothly.`
        : 'Pending household chore awaiting member action.',
      impactBadge: 'Save Time',
      impactColor: 'purple',
      primaryActionLabel: 'View Task',
      onPrimaryAction: () => {
        navigate('/tasks');
      },
    });
  }

  // Card 4: Household Finance Observation
  if (monthlyIncome > 0 || monthlyExpenses > 0) {
    const savingsRatio =
      monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;
    realCards.push({
      id: 'finance-summary',
      type: 'FINANCE',
      title: monthlySavings >= 0 ? 'Household Savings On Track' : 'Monthly Spending Alert',
      description: `Spent ${format(monthlyExpenses)} of ${format(
        monthlyIncome
      )} total monthly income (${savingsRatio}% savings rate).`,
      impactBadge: 'Household Finance',
      impactColor: 'blue',
      primaryActionLabel: 'View Expenses',
      onPrimaryAction: () => {
        navigate('/expenses');
      },
    });
  }

  if (!aiSuggestions) {
    return null;
  }

  const activeCards = realCards.filter((c) => !dismissedIds.includes(c.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  if (activeCards.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-primary tracking-tight">
            Smart Home Suggestions
          </h2>
        </div>
        <span className="text-[11px] text-muted font-bold uppercase tracking-wider">Quick Actions</span>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-3 snap-x snap-mandatory pb-1 -mx-1 px-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
        {activeCards.map((card) => {
          const badgeBg =
            card.impactColor === 'amber'
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
              : card.impactColor === 'emerald'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';

          return (
            <div
              key={card.id}
              className="min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-panel border border-primary/80 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-blue-500/60 transition-all shadow-sm hover:shadow-md group flex-shrink-0 md:flex-shrink"
            >
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border uppercase tracking-wider ${badgeBg}`}>
                    {card.impactBadge}
                  </span>
                  <button
                    onClick={() => handleDismiss(card.id)}
                    className="text-muted hover:text-primary text-xs transition-colors p-1 rounded-lg hover:bg-secondary/60"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-secondary leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">{card.description}</p>
              </div>

              <button
                type="button"
                onClick={card.onPrimaryAction}
                className="w-full min-h-[36px] sm:min-h-[42px] bg-secondary hover:bg-blue-600 hover:text-white border border-primary/80 text-primary font-bold py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] shadow-xs"
              >
                <span>{card.primaryActionLabel}</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionableAIFeed;
