import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Utensils, AlertCircle, Zap, ShieldAlert, Check } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';
import { useNavigate } from 'react-router-dom';

interface ActionableAIFeedProps {
  upcomingBills?: any[];
  onOpenAIChatWithPrompt?: (prompt: string) => void;
  onOpenTaskModal?: () => void;
  onOpenExpenseModal?: () => void;
}

interface ActionCard {
  id: string;
  type: 'BILL' | 'RECIPE' | 'MAINTENANCE' | 'SAVINGS';
  title: string;
  description: string;
  impactBadge: string;
  impactColor: 'amber' | 'emerald' | 'blue' | 'purple';
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}

export const ActionableAIFeed: React.FC<ActionableAIFeedProps> = ({
  upcomingBills = [],
  onOpenAIChatWithPrompt,
  onOpenTaskModal,
  onOpenExpenseModal,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { format, currencySymbol } = useSettingStore();
  const navigate = useNavigate();

  const firstBill = upcomingBills[0];

  const defaultCards: ActionCard[] = [
    ...(firstBill
      ? [
          {
            id: 'bill-1',
            type: 'BILL' as const,
            title: `Bill Due: ${firstBill.title}`,
            description: `${format(firstBill.amount)} is due on ${new Date(
              firstBill.dueDate
            ).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`,
            impactBadge: 'Avoid Late Fee',
            impactColor: 'amber' as const,
            primaryActionLabel: 'Log Bill Payment',
            onPrimaryAction: () => {
              if (onOpenExpenseModal) onOpenExpenseModal();
              else navigate('/bills');
            },
          },
        ]
      : []),
    {
      id: 'pantry-recipe',
      type: 'RECIPE' as const,
      title: 'Quick Recipe Idea',
      description: 'Tomatoes, Bell Peppers & Milk need to be used soon. Make a quick 15-min Paneer dish tonight.',
      impactBadge: 'Save Food Waste',
      impactColor: 'emerald' as const,
      primaryActionLabel: 'View Recipe',
      onPrimaryAction: () => {
        if (onOpenAIChatWithPrompt) {
          onOpenAIChatWithPrompt(
            'Suggest a quick 15-minute healthy dinner recipe using tomatoes, bell peppers, and milk before they expire.'
          );
        } else {
          navigate('/pantry-vision');
        }
      },
    },
    {
      id: 'appliance-service',
      type: 'MAINTENANCE' as const,
      title: 'Appliance Care Tip',
      description: 'Air Conditioner has been running a lot this month. Clean dust filters to improve cooling.',
      impactBadge: 'Saves Power',
      impactColor: 'blue' as const,
      primaryActionLabel: 'Create Reminder Task',
      onPrimaryAction: () => {
        if (onOpenTaskModal) onOpenTaskModal();
        else navigate('/appliances');
      },
    },
  ];

  const activeCards = defaultCards.filter((c) => !dismissedIds.includes(c.id));

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
