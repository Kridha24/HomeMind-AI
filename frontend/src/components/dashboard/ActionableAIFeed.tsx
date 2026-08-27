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
            title: `Upcoming Bill: ${firstBill.title}`,
            description: `Amount of ${format(firstBill.amount)} is due on ${new Date(
              firstBill.dueDate
            ).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`,
            impactBadge: 'Prevents Late Fee',
            impactColor: 'amber' as const,
            primaryActionLabel: 'Log Payment',
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
      title: 'Zero-Waste Chef Recommendation',
      description: 'Tomatoes, Bell Peppers & Milk are approaching shelf life. Cook a quick Paneer Butter Masala tonight.',
      impactBadge: 'Saves ₹350 Waste',
      impactColor: 'emerald' as const,
      primaryActionLabel: 'View 15-Min Recipe',
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
      title: 'Proactive Appliance Care',
      description: 'Air Conditioner has logged 120+ operational hours this month. Clean dust filters to improve cooling efficiency.',
      impactBadge: 'Conserves 12% Energy',
      impactColor: 'blue' as const,
      primaryActionLabel: 'Create Maintenance Task',
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
            Proactive AI Recommendations
          </h2>
        </div>
        <span className="text-[11px] text-muted font-bold uppercase tracking-wider">1-Click Actionable</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="p-5 rounded-3xl bg-panel border border-primary/80 flex flex-col justify-between space-y-4 hover:border-blue-500/60 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeBg}`}>
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
                <h3 className="text-sm font-bold text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-secondary leading-relaxed font-medium">{card.description}</p>
              </div>

              <button
                type="button"
                onClick={card.onPrimaryAction}
                className="w-full min-h-[42px] bg-secondary hover:bg-blue-600 hover:text-white border border-primary/80 text-primary font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs"
              >
                <span>{card.primaryActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
