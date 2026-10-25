import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Wallet,
  ShoppingCart,
  FileText,
  CheckSquare,
  Users,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  Check,
  ShoppingBag,
  CreditCard,
  Menu,
  Settings,
} from 'lucide-react';
import { HouseholdMember } from '../../types';
import { getPastelInitialsClass, getMemberInitials } from '../common/FamilyAvatarGroup';

interface MobileDashboardProps {
  members: HouseholdMember[];
  onInviteClick: () => void;
  onMemberClick: (member: HouseholdMember) => void;
  onOpenNotifications: () => void;
  onToggleSidebar?: () => void;
  unreadCount?: number;
  pendingTasks: any[];
  upcomingBills: any[];
  recentHistory: any[];
  groceriesList: any[];
  format: (amount: number) => string;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  members = [],
  onInviteClick,
  onMemberClick,
  onOpenNotifications,
  onToggleSidebar,
  unreadCount = 0,
  pendingTasks = [],
  upcomingBills = [],
  recentHistory = [],
  groceriesList = [],
  format,
}) => {
  const navigate = useNavigate();

  // 1. Build unified "Today" items list from real data
  const todayItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: 'task' | 'bill' | 'grocery' | 'activity';
      timeStr: string;
      completed?: boolean;
      member?: HouseholdMember;
      onClick: () => void;
    }> = [];

    // Pending tasks (priority to today/upcoming)
    pendingTasks.slice(0, 3).forEach((task, index) => {
      // Find assigned member
      const assigned = members.find(
        (m) => m.id === task.assignedTo || m.name?.toLowerCase() === task.assignedTo?.toLowerCase()
      ) || members[index % Math.max(1, members.length)];

      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      let timeStr = 'Today';
      if (dueDate && !isNaN(dueDate.getTime())) {
        timeStr = dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } else {
        const defaultTimes = ['9:00 AM', '12:00 PM', '4:00 PM'];
        timeStr = defaultTimes[index % defaultTimes.length];
      }

      items.push({
        id: `task-${task.id || index}`,
        title: task.title,
        type: 'task',
        timeStr,
        completed: task.status === 'COMPLETED',
        member: assigned,
        onClick: () => navigate('/tasks'),
      });
    });

    // Upcoming urgent bills
    upcomingBills.slice(0, 2).forEach((bill, index) => {
      const assigned = members[(index + 1) % Math.max(1, members.length)];
      items.push({
        id: `bill-${bill.id || index}`,
        title: `Pay ${bill.title} (${format(bill.amount)})`,
        type: 'bill',
        timeStr: bill.dueDate
          ? new Date(bill.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : 'Due soon',
        completed: bill.status === 'PAID',
        member: assigned,
        onClick: () => navigate('/bills'),
      });
    });

    // Groceries needing restock
    const urgentGroceries = groceriesList.filter(
      (g) => g.status === 'LOW_STOCK' || g.status === 'OUT_OF_STOCK'
    );
    urgentGroceries.slice(0, 1).forEach((item, index) => {
      const assigned = members[(index + 2) % Math.max(1, members.length)];
      items.push({
        id: `grocery-${item.id || index}`,
        title: `Buy ${item.name || item.title}`,
        type: 'grocery',
        timeStr: 'Pantry restock',
        completed: false,
        member: assigned,
        onClick: () => navigate('/groceries'),
      });
    });

    // Recent activities fallback if todayItems is sparse
    if (items.length < 3 && recentHistory.length > 0) {
      recentHistory.slice(0, 3 - items.length).forEach((hist, index) => {
        const assigned = members.find((m) => m.name === hist.user?.name) || members[0];
        items.push({
          id: `hist-${hist.id || index}`,
          title: hist.title || hist.description || 'Household activity',
          type: 'activity',
          timeStr: hist.date
            ? new Date(hist.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : 'Recent',
          completed: true,
          member: assigned,
          onClick: () => navigate('/expenses'),
        });
      });
    }

    return items;
  }, [pendingTasks, upcomingBills, groceriesList, recentHistory, members, format, navigate]);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-24">
      {/* ── 1. Clean White Header with Menu & Settings ─────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-3 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1.5">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open navigation menu"
              className="p-1.5 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/25">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                HomeMind
              </span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight ml-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* ── 2. Horizontal Family Avatar Row with (+) Control ─────────────── */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {members.map((member) => {
            const initials = getMemberInitials(member.name, member.email);
            const colorClass = getPastelInitialsClass(member.name || member.id);
            const photoUrl = member.avatar || member.avatarUrl;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onMemberClick(member)}
                className="relative flex-shrink-0 group focus:outline-none cursor-pointer"
                title={`${member.name} (${member.role || 'Member'})`}
                aria-label={`View ${member.name}`}
              >
                <div className="w-11 h-11 rounded-full ring-2 ring-slate-200/90 dark:ring-slate-700/80 p-0.5 bg-white dark:bg-slate-900 shadow-2xs group-hover:scale-105 active:scale-95 transition-transform overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs border ${colorClass}`}
                    >
                      {initials}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Circular Add Member (+) Control */}
          <button
            type="button"
            onClick={onInviteClick}
            aria-label="Add Family Member"
            className="w-11 h-11 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all active:scale-95 shadow-2xs flex-shrink-0"
            title="Invite New Family Member"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── 3. Six Quick-Access Tiles in 2-Column, 3-Row Grid ─────────────── */}
      {/* ── 3. Six Quick-Access Tiles in 2-Column, 3-Row Grid ─────────────── */}
      <section className="px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-2" aria-label="Quick Access Modules">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Tile 1: Finance (Teal Wallet) */}
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-teal-300/60 dark:hover:border-teal-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
              Finance
            </span>
          </button>

          {/* Tile 2: Groceries (Orange Cart) */}
          <button
            type="button"
            onClick={() => navigate('/groceries')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-orange-300/60 dark:hover:border-orange-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
              Groceries
            </span>
          </button>

          {/* Tile 3: Bills (Blue Receipt) */}
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-blue-300/60 dark:hover:border-blue-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
              Bills
            </span>
          </button>

          {/* Tile 4: Tasks (Purple Check) */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-purple-300/60 dark:hover:border-purple-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
              Tasks
            </span>
          </button>

          {/* Tile 5: Family (Violet Family) */}
          <button
            type="button"
            onClick={() => navigate('/family')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-violet-300/60 dark:hover:border-violet-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
              Family
            </span>
          </button>

          {/* Tile 6: Connect (Cyan Phone) */}
          <button
            type="button"
            onClick={() => navigate('/family?tab=connect')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-cyan-300/60 dark:hover:border-cyan-700/60 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-2xs active:scale-98 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
              Connect
            </span>
          </button>
        </div>
      </section>

      {/* ── 4. Today Section Heading & View All Link ─────────────────────── */}
      <section className="px-4 pt-4 pb-2" aria-label="Today Activities">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Today
          </h2>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group active:scale-95 transition-all"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* ── 5. Compact Real Activity / Task List ───────────────────────── */}
        {todayItems.length > 0 ? (
          <div className="space-y-2.5">
            {todayItems.map((item) => {
              // Status icon styling based on item type
              let iconNode = <Check className="w-3.5 h-3.5" />;
              let iconBg = 'bg-blue-500/15 text-blue-600 dark:text-blue-400';

              if (item.type === 'task') {
                iconNode = <Check className="w-3.5 h-3.5" />;
                iconBg = item.completed
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-purple-500/15 text-purple-600 dark:text-purple-400';
              } else if (item.type === 'bill') {
                iconNode = <FileText className="w-3.5 h-3.5" />;
                iconBg = 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
              } else if (item.type === 'grocery') {
                iconNode = <ShoppingCart className="w-3.5 h-3.5" />;
                iconBg = 'bg-orange-500/15 text-orange-500 dark:text-orange-400';
              } else {
                iconNode = <Phone className="w-3.5 h-3.5" />;
                iconBg = 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400';
              }

              // Assigned member details
              const memberName = item.member?.name || 'Member';
              const memberInitials = getMemberInitials(item.member?.name, item.member?.email);
              const memberColorClass = getPastelInitialsClass(item.member?.name || item.id);
              const memberPhoto = item.member?.avatar || item.member?.avatarUrl;

              return (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
                    >
                      {iconNode}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {item.timeStr}
                    </span>

                    {/* Member Avatar */}
                    <div
                      className="w-6 h-6 rounded-full ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden flex-shrink-0 shadow-2xs"
                      title={`Assigned: ${memberName}`}
                    >
                      {memberPhoto ? (
                        <img
                          src={memberPhoto}
                          alt={memberName}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-[9px] font-bold ${memberColorClass}`}
                        >
                          {memberInitials}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              All caught up for today!
            </p>
            <p className="text-[11px] text-slate-400">
              No urgent tasks or overdue bills pending.
            </p>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add a new chore
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default MobileDashboard;
