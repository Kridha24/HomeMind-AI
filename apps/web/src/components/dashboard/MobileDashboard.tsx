import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Wallet,
  ShoppingCart,
  FileText,
  CheckSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Menu,
  Settings,
  X,
  Sparkles,
  TrendingUp,
  Send,
  Eye,
  Camera,
} from 'lucide-react';
import { HouseholdMember } from '../../types';
import { getPastelInitialsClass, getMemberInitials } from '../common/FamilyAvatarGroup';

export interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  caption: string;
  timestamp: string;
  color?: string;
}

interface MobileDashboardProps {
  members: HouseholdMember[];
  householdName?: string;
  adminName?: string;
  todayExpenses?: number;
  weeklyExpenses?: number;
  monthlyExpenses?: number;
  currentUser?: any;
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

const DEFAULT_STORY_COLORS = [
  'from-indigo-600 to-purple-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-blue-600 to-cyan-700',
];

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  members = [],
  householdName = 'Family Household',
  adminName = 'Family Leader',
  todayExpenses = 0,
  weeklyExpenses = 0,
  monthlyExpenses = 0,
  currentUser,
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

  // ── Stories State (WhatsApp-style stories for family members) ──────────────
  const [stories, setStories] = useState<UserStory[]>([]);
  const [activeStoryMember, setActiveStoryMember] = useState<{
    member: HouseholdMember;
    story: UserStory;
  } | null>(null);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [storyProgress, setStoryProgress] = useState(0);

  // Initialize or fetch stories from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('homemind_family_stories_v1');
      if (stored) {
        setStories(JSON.parse(stored));
      } else {
        // Seed default initial stories for realism
        const initialStories: UserStory[] = [];
        if (members.length > 0) {
          const firstMember = members[0];
          initialStories.push({
            id: 'story-seed-1',
            userId: firstMember.id,
            userName: firstMember.name,
            userAvatar: firstMember.avatar || firstMember.avatarUrl,
            caption: 'Bought fresh fruits & groceries for the kitchen! 🍎🥦',
            timestamp: 'Today, 10:30 AM',
            color: DEFAULT_STORY_COLORS[0],
          });
        }
        if (members.length > 1) {
          const secondMember = members[1];
          initialStories.push({
            id: 'story-seed-2',
            userId: secondMember.id,
            userName: secondMember.name,
            userAvatar: secondMember.avatar || secondMember.avatarUrl,
            caption: 'Electricity bill is settled for this month. All clear! ⚡',
            timestamp: 'Today, 1:15 PM',
            color: DEFAULT_STORY_COLORS[1],
          });
        }
        setStories(initialStories);
        localStorage.setItem('homemind_family_stories_v1', JSON.stringify(initialStories));
      }
    } catch {
      // Fallback gracefully
    }
  }, [members]);

  // Story Viewer Timer (auto-advance & close after 6 seconds)
  useEffect(() => {
    if (!activeStoryMember) {
      setStoryProgress(0);
      return;
    }

    setStoryProgress(0);
    const interval = 50; // update every 50ms
    const totalTime = 5500; // 5.5s
    const step = (interval / totalTime) * 100;

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setActiveStoryMember(null);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryMember]);

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryCaption.trim()) return;

    const newStory: UserStory = {
      id: `story-${Date.now()}`,
      userId: currentUser?.id || 'current-user',
      userName: currentUser?.name || 'You',
      userAvatar: currentUser?.avatar || currentUser?.avatarUrl,
      caption: newStoryCaption.trim(),
      timestamp: 'Just now',
      color: DEFAULT_STORY_COLORS[Math.floor(Math.random() * DEFAULT_STORY_COLORS.length)],
    };

    const updated = [newStory, ...stories.filter((s) => s.userId !== newStory.userId)];
    setStories(updated);
    try {
      localStorage.setItem('homemind_family_stories_v1', JSON.stringify(updated));
    } catch {}

    setNewStoryCaption('');
    setIsAddingStory(false);
  };

  // Find story for a member
  const getMemberStory = (memberId: string) => {
    return stories.find((s) => s.userId === memberId);
  };

  // ── Unified "Today" items list ───────────────────────────────────────────
  const todayItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: 'task' | 'bill' | 'grocery' | 'activity';
      timeStr: string;
      completed?: boolean;
      member?: HouseholdMember;
      onClick: () => void;
    }> = [];

    // Pending tasks
    pendingTasks.slice(0, 3).forEach((task, index) => {
      const assigned =
        members.find(
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

    // Fallback recent history
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
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-24 selection:bg-indigo-500/20">
      {/* ── 1. Minimal Sleek Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
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
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                HomeMind
              </span>
              <span className="font-black text-sm tracking-tight ml-1 text-indigo-600 dark:text-indigo-400">
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

      {/* ── 2. Family Household Header & WhatsApp-style Story Row ───────────── */}
      <div className="bg-white dark:bg-[#0E131F] px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Household Name & Leader Header */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="min-w-0 pr-2">
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
              {householdName}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Led by {adminName}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>

        {/* WhatsApp-Style Stories Row */}
        <div className="flex items-start gap-3 overflow-x-auto no-scrollbar py-1">
          {/* + Add Story / My Status */}
          <button
            type="button"
            onClick={() => setIsAddingStory(true)}
            className="flex flex-col items-center shrink-0 group cursor-pointer w-[72px] text-center"
            title="Add your status / story"
          >
            <div className="relative w-12 h-12 rounded-full p-0.5 border-2 border-dashed border-indigo-400/80 dark:border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-slate-900 shadow-xs">
                +
              </span>
            </div>
            <span className="mt-1.5 font-bold text-[11px] text-indigo-600 dark:text-indigo-400 truncate w-full">
              My Status
            </span>
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500">
              Add story
            </span>
          </button>

          {/* Existing Family Members with Story Ring */}
          {members.map((member) => {
            const initials = getMemberInitials(member.name, member.email);
            const colorClass = getPastelInitialsClass(member.name || member.id);
            const photoUrl = member.avatar || member.avatarUrl;
            const story = getMemberStory(member.id);
            const hasStory = Boolean(story);

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  if (hasStory && story) {
                    setActiveStoryMember({ member, story });
                  } else {
                    onMemberClick(member);
                  }
                }}
                className="flex flex-col items-center shrink-0 group cursor-pointer w-[72px] text-center"
                title={hasStory ? `View ${member.name}'s story` : member.name}
              >
                {/* Avatar with WhatsApp green ring if has story */}
                <div
                  className={`relative w-12 h-12 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                    hasStory
                      ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0E131F] shadow-xs'
                      : 'ring-1 ring-slate-200 dark:ring-slate-800'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center font-black text-xs border ${colorClass}`}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  {/* Status dot or Story indicator */}
                  {hasStory ? (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                <span className="mt-1.5 font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate w-full">
                  {member.name || 'Member'}
                </span>
                <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 truncate w-full">
                  {hasStory ? 'View status' : member.role?.toLowerCase() || 'member'}
                </span>
              </button>
            );
          })}

          {/* + Invite Member Button */}
          <button
            type="button"
            onClick={onInviteClick}
            className="flex flex-col items-center shrink-0 group cursor-pointer w-[72px] text-center"
            title="Invite new member"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:scale-105 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="mt-1.5 font-bold text-[11px] text-slate-600 dark:text-slate-400 truncate w-full">
              + Invite
            </span>
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500">
              Add user
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Dedicated Expenses Overview Card (Today, Weekly, Monthly) ──────── */}
      <section className="px-4 pt-3.5 pb-2" aria-label="Expenses Overview">
        <button
          type="button"
          onClick={() => navigate('/expenses')}
          className="w-full text-left rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-indigo-500/40 transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Expenses Overview
              </span>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Details <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center divide-x divide-slate-100 dark:divide-slate-800/80">
            {/* Today */}
            <div className="px-1">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                Today
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight block mt-0.5 truncate">
                {format(todayExpenses)}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                Daily spend
              </span>
            </div>

            {/* This Week */}
            <div className="px-1">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                This Week
              </span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight block mt-0.5 truncate">
                {format(weeklyExpenses)}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                Last 7 days
              </span>
            </div>

            {/* This Month */}
            <div className="px-1">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                This Month
              </span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight block mt-0.5 truncate">
                {format(monthlyExpenses)}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                Month total
              </span>
            </div>
          </div>
        </button>
      </section>

      {/* ── 4. Core 4 Modules in Simple English (2x2 Grid) ────────────────────── */}
      <section className="px-4 pt-1.5 pb-2" aria-label="Core Modules">
        <div className="flex items-center justify-between pb-2 px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Household Modules
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Tile 1: Expenses */}
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-center gap-3 text-left group shadow-xs active:scale-98 min-h-[64px]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                Expenses
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Money & Accounts
              </span>
            </div>
          </button>

          {/* Tile 2: Groceries */}
          <button
            type="button"
            onClick={() => navigate('/groceries')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center gap-3 text-left group shadow-xs active:scale-98 min-h-[64px]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                Groceries
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Pantry & Shopping
              </span>
            </div>
          </button>

          {/* Tile 3: Bills */}
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center gap-3 text-left group shadow-xs active:scale-98 min-h-[64px]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                Bills
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Utilities & Dues
              </span>
            </div>
          </button>

          {/* Tile 4: Tasks */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40 transition-all flex items-center gap-3 text-left group shadow-xs active:scale-98 min-h-[64px]"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                Tasks
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                Daily Chores & Todos
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ── 5. Today's Schedule & Chores ─────────────────────────────────────── */}
      <section className="px-4 pt-3 pb-2" aria-label="Today Activities">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            Today's Schedule & Chores
          </h2>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group active:scale-95 transition-all"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="space-y-2">
          {todayItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                All caught up for today!
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                No overdue bills or pending chores.
              </p>
            </div>
          ) : (
            todayItems.map((item) => (
              <div
                key={item.id}
                onClick={item.onClick}
                className="p-3 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between gap-3 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'bill'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : item.type === 'grocery'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {item.type === 'bill' ? (
                      <FileText className="w-4 h-4" />
                    ) : item.type === 'grocery' ? (
                      <ShoppingCart className="w-4 h-4" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timeStr}
                      </span>
                      {item.member && (
                        <span className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          • {item.member.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.completed ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── WhatsApp-Style Story Viewer Modal ─────────────────────────────────── */}
      {activeStoryMember && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setActiveStoryMember(null)}
        >
          {/* Top Progress Bar & Header */}
          <div
            className="w-full max-w-md mx-auto space-y-3 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${storyProgress}%` }}
              />
            </div>

            {/* Story Header */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full ring-2 ring-emerald-400 overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-xs">
                  {activeStoryMember.story.userAvatar ? (
                    <img
                      src={activeStoryMember.story.userAvatar}
                      alt={activeStoryMember.story.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getMemberInitials(activeStoryMember.story.userName)
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold leading-tight">
                    {activeStoryMember.story.userName}
                  </h4>
                  <p className="text-[10px] text-white/60">
                    {activeStoryMember.story.timestamp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStoryMember(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Story Content Card */}
          <div
            className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-white/10 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{activeStoryMember.story.caption}"
            </p>
            <div className="pt-2 text-xs text-white/40 font-mono">
              Family Status Update
            </div>
          </div>

          {/* Bottom Tap Indicator */}
          <div className="w-full max-w-md mx-auto pb-4 text-center">
            <span className="text-[11px] text-white/50 bg-white/10 px-3 py-1 rounded-full">
              Tap anywhere to close
            </span>
          </div>
        </div>
      )}

      {/* ── WhatsApp-Style Story Composer Modal ───────────────────────────────── */}
      {isAddingStory && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddingStory(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl max-w-md w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Share Status / Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingStory(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-3">
              <textarea
                value={newStoryCaption}
                onChange={(e) => setNewStoryCaption(e.target.value)}
                placeholder="What's happening? (e.g. Bought vegetables for dinner 🥦, bills paid ⚡)"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              {/* Quick suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  'Groceries bought 🛒',
                  'Cooked lunch 🍲',
                  'Electricity bill paid ⚡',
                  'Home clean & tidy ✨',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStoryCaption(s)}
                    className="text-[10.5px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStory(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStoryCaption.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  Post Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
