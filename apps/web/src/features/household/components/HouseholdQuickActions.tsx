import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, PlusCircle, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { canInviteMember } from '../utils/householdPermissions';

interface HouseholdQuickActionsProps {
  currentUserRole?: string;
  onOpenInviteModal: () => void;
}

export const HouseholdQuickActions: React.FC<HouseholdQuickActionsProps> = ({
  currentUserRole,
  onOpenInviteModal,
}) => {
  const navigate = useNavigate();
  const canInvite = canInviteMember(currentUserRole);

  const actions = [
    {
      label: 'Invite Member',
      description: 'Share household access code',
      icon: UserPlus,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/15 border-violet-500/20 dark:border-violet-500/30',
      iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
      onClick: onOpenInviteModal,
      visible: canInvite,
    },
    {
      label: 'Add Task / Chore',
      description: 'Assign a new responsibility',
      icon: PlusCircle,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20 dark:border-blue-500/30',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/tasks?action=new'),
      visible: true,
    },
    {
      label: 'Add Grocery Item',
      description: 'Update the shared shopping list',
      icon: ShoppingBag,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/groceries?action=new'),
      visible: true,
    },
    {
      label: 'Add Bill or Expense',
      description: 'Record a shared household expense',
      icon: Receipt,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 dark:border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      onClick: () => navigate('/bills'),
      visible: true,
    },
  ].filter((a) => a.visible);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            className={`h-full p-3.5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between group shadow-xs hover:shadow-md bg-panel ${act.color}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${act.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary group-hover:text-primary transition-colors truncate">
                  {act.label}
                </p>
                <p className="text-[11px] text-muted truncate">{act.description}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        );
      })}
    </div>
  );
};
