export interface UserLike {
  firstName?: string;
  displayName?: string;
  name?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  email?: string;
}

export function getGreetingName(user?: UserLike | null): string {
  if (!user) return 'there';
  if (user.firstName && typeof user.firstName === 'string' && user.firstName.trim()) {
    return user.firstName.trim();
  }
  if (user.displayName && typeof user.displayName === 'string' && user.displayName.trim()) {
    return user.displayName.trim().split(/\s+/)[0];
  }
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim().split(/\s+/)[0];
  }
  return 'there';
}

export function getUserFullName(user?: UserLike | null): string {
  if (!user) return 'Household Member';
  return user.displayName || user.name || 'Household Member';
}

export function getUserInitials(user?: UserLike | null): string {
  if (!user) return 'HM';
  const name = (user.displayName || user.name || '').trim();
  if (!name) return 'HM';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getTimeGreeting(date: Date = new Date()): {
  greeting: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
} {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return { greeting: 'Good morning', period: 'morning' };
  }
  if (hours >= 12 && hours < 17) {
    return { greeting: 'Good afternoon', period: 'afternoon' };
  }
  if (hours >= 17 && hours < 22) {
    return { greeting: 'Good evening', period: 'evening' };
  }
  return { greeting: 'Good night', period: 'night' };
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return 'recently';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export interface InsightItem {
  id: string;
  title: string;
  message: string;
  type: 'positive' | 'warning' | 'info';
  actionLabel?: string;
  actionTab?: 'bills' | 'tasks';
}

export function computeDeterministicInsights(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  upcomingBills: any[];
  pendingTasks: any[];
}): InsightItem[] {
  const { monthlyIncome, monthlyExpenses, upcomingBills, pendingTasks } = params;
  const insights: InsightItem[] = [];
  const now = new Date();

  // 1. Bill urgency check (due in next 3 days or overdue)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const urgentBills = upcomingBills.filter((bill) => {
    if (!bill.dueDate) return false;
    const due = new Date(bill.dueDate);
    return due <= threeDaysFromNow;
  });

  if (urgentBills.length > 0) {
    const overdueBills = urgentBills.filter((b) => new Date(b.dueDate) < now);
    if (overdueBills.length > 0) {
      insights.push({
        id: 'bill-overdue',
        title: 'Action Needed: Overdue Bill',
        message: `${overdueBills.length} bill${overdueBills.length > 1 ? 's are' : ' is'} past due date. Settle to avoid late fees.`,
        type: 'warning',
        actionLabel: 'Review Bills',
        actionTab: 'bills',
      });
    } else {
      insights.push({
        id: 'bill-due-soon',
        title: 'Upcoming Bill Due Soon',
        message: `${urgentBills.length} bill${urgentBills.length > 1 ? 's are' : ' is'} due within 3 days.`,
        type: 'warning',
        actionLabel: 'Pay Bills',
        actionTab: 'bills',
      });
    }
  }

  // 2. Urgent / High Priority Task Check
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH');
  if (urgentTasks.length > 0) {
    insights.push({
      id: 'task-urgent',
      title: 'High-Priority Tasks Pending',
      message: `${urgentTasks.length} urgent household chore${urgentTasks.length > 1 ? 's need' : ' needs'} attention.`,
      type: 'warning',
      actionLabel: 'View Tasks',
      actionTab: 'tasks',
    });
  } else if (pendingTasks.length > 3) {
    insights.push({
      id: 'tasks-pending',
      title: 'Household Task Load',
      message: `${pendingTasks.length} pending chores logged for the household.`,
      type: 'info',
      actionLabel: 'Organize',
      actionTab: 'tasks',
    });
  }

  // 3. Financial Snapshot Check
  if (monthlyIncome > 0 && monthlyExpenses === 0) {
    insights.push({
      id: 'finance-no-expense',
      title: 'Clean Monthly Slate',
      message: 'No expenses recorded yet this month. Full monthly income remains intact.',
      type: 'positive',
    });
  } else if (monthlyIncome > 0 && monthlyExpenses > 0) {
    const savingsRatio = Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
    if (savingsRatio >= 40) {
      insights.push({
        id: 'finance-healthy-savings',
        title: 'Strong Household Savings Rate',
        message: `Currently saving ${savingsRatio}% of recorded income this month.`,
        type: 'positive',
      });
    } else if (savingsRatio < 10 && savingsRatio >= 0) {
      insights.push({
        id: 'finance-tight-margin',
        title: 'Narrow Monthly Margin',
        message: `Expenses are tracking at ${100 - savingsRatio}% of total monthly income.`,
        type: 'info',
      });
    } else if (savingsRatio < 0) {
      insights.push({
        id: 'finance-deficit',
        title: 'Expense Exceeds Income',
        message: 'Current month expenses have surpassed recorded income. Review ledger.',
        type: 'warning',
      });
    }
  } else if (monthlyIncome === 0 && monthlyExpenses === 0) {
    insights.push({
      id: 'finance-empty',
      title: 'Ready for Monthly Tracking',
      message: 'Log your first income or expense to activate real-time financial tracking.',
      type: 'info',
    });
  }

  // 4. Default calm reassurance if no warnings
  if (insights.length === 0) {
    insights.push({
      id: 'all-clear',
      title: 'Household Status: In Harmony',
      message: 'All bills are up to date, tasks are on track, and finances are balanced.',
      type: 'positive',
    });
  }

  return insights.slice(0, 2);
}
