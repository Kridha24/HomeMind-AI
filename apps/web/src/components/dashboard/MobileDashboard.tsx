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
    <div className="w-full min-h-screen bg-gradient-to-b from-[#f8fafd] via-[#f1f5f9] to-[#eef2f6] dark:from-[#080c1b] dark:via-[#0c1228] dark:to-[#090d1c] text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-24">
      {/* ── 1. Clean Atmospheric Header with Menu & Settings ─────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-indigo-100/60 dark:border-indigo-950/60 px-3.5 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-[0_2px_12px_rgba(99,102,241,0.04)]">
        <div className="flex items-center gap-1.5">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open navigation menu"
              className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="HomeMind.AI"
              className="w-7 h-7 rounded-xl shadow-xs object-contain"
            />
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* ── 2. Family Members Card Row with User Name & Family Workshop Status ─────────────── */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 sm:px-4 py-3 border-b border-indigo-100/50 dark:border-indigo-950/60 shadow-2xs">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Family Members ({members.length})
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
            Connected Room
          </span>
        </div>

        <div className="flex items-start gap-3 overflow-x-auto no-scrollbar py-1">
          {members.map((member) => {
            const initials = getMemberInitials(member.name, member.email);
            const colorClass = getPastelInitialsClass(member.name || member.id);
            const photoUrl = member.avatar || member.avatarUrl;
            const role = (member.role || 'MEMBER').toUpperCase();
            const roleLabel =
              role === 'OWNER'
                ? 'Room Owner'
                : role === 'ADMIN'
                ? 'Admin'
                : 'Family Member';

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onMemberClick(member)}
                className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer w-[76px] sm:w-[84px] p-1.5 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
                title={`${member.name} (${roleLabel})`}
                aria-label={`View ${member.name}`}
              >
                {/* Avatar with subtle ring */}
                <div className="relative w-12 h-12 rounded-full ring-2 ring-indigo-500/25 dark:ring-indigo-400/30 p-0.5 bg-white dark:bg-slate-900 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
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
                      className={`w-full h-full rounded-full flex items-center justify-center font-black text-xs border ${colorClass}`}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Active online dot */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-2xs" />
                </div>

                {/* Member Name */}
                <span className="mt-1.5 font-bold text-xs text-slate-900 dark:text-slate-100 truncate w-full text-center">
                  {member.name || 'Member'}
                </span>

                {/* Family Workshop Role Tag */}
                <span
                  className={`mt-0.5 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-full truncate max-w-full text-center ${
                    role === 'OWNER'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : role === 'ADMIN'
                      ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {roleLabel}
                </span>
              </button>
            );
          })}

          {/* Add / Invite Member Control */}
          <button
            type="button"
            onClick={onInviteClick}
            aria-label="Add Family Member"
            className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer w-[76px] sm:w-[84px] p-1.5 rounded-2xl transition-all active:scale-95"
            title="Invite New Family Member"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/50 dark:bg-slate-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-all shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <span className="mt-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400 truncate w-full text-center">
              + Naya Jodein
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
              Invite
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Six Quick-Access Sections in Simple, Clear Language with Colorful Icons ─────────────── */}
      <section className="px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-2" aria-label="Quick Access Modules">
        <div className="flex items-center justify-between pb-2.5 px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daily Household Modules (Rozana Sevayein)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Tile 1: Ghar Ka Kharcha (Expenses & Finance) */}
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                Ghar Kharcha
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Paisa & Hisab
              </span>
            </div>
          </button>

          {/* Tile 2: Rashan & Saman (Groceries & Pantry) */}
          <button
            type="button"
            onClick={() => navigate('/groceries')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                Rashan Saman
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Kitchen & Pantry
              </span>
            </div>
          </button>

          {/* Tile 3: Ghar Ke Bills (Electricity, Water, Wi-Fi) */}
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-800/40 hover:border-blue-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                Ghar Ke Bills
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Bijli, Pani, Wifi
              </span>
            </div>
          </button>

          {/* Tile 4: Roz Ke Kaam (Chores & Tasks) */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-purple-200/60 dark:border-purple-800/40 hover:border-purple-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 text-white shadow-md shadow-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                Roz Ke Kaam
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Daily Tasks & Chores
              </span>
            </div>
          </button>

          {/* Tile 5: Parivaar Sadasya (Family Members) */}
          <button
            type="button"
            onClick={() => navigate('/family')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-rose-200/60 dark:border-rose-800/40 hover:border-rose-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-md shadow-rose-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                Parivaar
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Ghar Ke Sadasya
              </span>
            </div>
          </button>

          {/* Tile 6: Baat-Cheet (Chat & Calls) */}
          <button
            type="button"
            onClick={() => navigate('/family?tab=connect')}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-cyan-200/60 dark:border-cyan-800/40 hover:border-cyan-400/80 transition-all flex items-center gap-2.5 sm:gap-3 text-left group shadow-sm active:scale-98 min-w-0 min-h-[64px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-md shadow-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                Baat-Cheet
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Call & Charcha
              </span>
            </div>
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
