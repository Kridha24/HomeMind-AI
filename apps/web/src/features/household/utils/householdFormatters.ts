import {
  Crown,
  Shield,
  User,
  Eye,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  ShoppingBasket,
  Key,
  LogOut,
  UserPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React from 'react';

export interface RoleConfig {
  role: string;
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  OWNER: {
    role: 'OWNER',
    label: 'Owner',
    badgeBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-500/30 dark:border-violet-500/40',
    icon: Crown,
    description: 'Full administrative access and ownership of household data',
  },
  'CO-OWNER': {
    role: 'CO-OWNER',
    label: 'Co-Owner',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500/30 dark:border-indigo-500/40',
    icon: Shield,
    description: 'High administrative permissions and management capability',
  },
  ADMIN: {
    role: 'ADMIN',
    label: 'Admin',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30 dark:border-blue-500/40',
    icon: Shield,
    description: 'Can manage members, chores, bills, and groceries',
  },
  MEMBER: {
    role: 'MEMBER',
    label: 'Member',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30 dark:border-blue-500/40',
    icon: User,
    description: 'Can view and collaborate on tasks, groceries, and bills',
  },
  GUEST: {
    role: 'GUEST',
    label: 'Guest',
    badgeBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-500/30 dark:border-slate-500/40',
    icon: Eye,
    description: 'Limited read-only access to household records',
  },
};

export function getRoleConfig(role: string = 'MEMBER'): RoleConfig {
  return ROLE_CONFIGS[role.toUpperCase()] || ROLE_CONFIGS.MEMBER;
}

export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recently';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getUserInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

export interface ActivityIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  colorClass: string;
}

export function getActivityIconConfig(action: string = '', entity: string = ''): ActivityIconConfig {
  const a = (action || '').toUpperCase();
  const e = (entity || '').toUpperCase();

  if (a.includes('JOIN') || a.includes('INVITE')) {
    return {
      icon: UserPlus,
      color: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-500/10',
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    };
  }
  if (a.includes('LEAVE') || a.includes('REMOVE')) {
    return {
      icon: LogOut,
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10',
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    };
  }
  if (a.includes('ROLE') || a.includes('OWNERSHIP')) {
    return {
      icon: Crown,
      color: 'text-violet-600 dark:text-violet-400',
      badgeBg: 'bg-violet-500/10',
      colorClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    };
  }
  if (e.includes('INCOME') || a.includes('INCOME')) {
    return {
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    };
  }
  if (e.includes('EXPENSE') || e.includes('TRANSACTION') || a.includes('EXPENSE')) {
    return {
      icon: CreditCard,
      color: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-500/10',
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    };
  }
  if (e.includes('GROCERY') || e.includes('INVENTORY') || a.includes('GROCERY')) {
    return {
      icon: ShoppingBasket,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10',
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    };
  }
  if (e.includes('TASK') || a.includes('TASK')) {
    return {
      icon: CheckCircle2,
      color: 'text-teal-600 dark:text-teal-400',
      badgeBg: 'bg-teal-500/10',
      colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    };
  }
  if (a.includes('CODE')) {
    return {
      icon: Key,
      color: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-500/10',
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    };
  }

  return {
    icon: Sparkles,
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-secondary',
    colorClass: 'text-slate-600 dark:text-slate-400 bg-secondary',
  };
}
