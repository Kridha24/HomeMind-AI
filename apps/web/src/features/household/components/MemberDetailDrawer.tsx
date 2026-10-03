import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Shield,
  Crown,
  Trash2,
  CheckSquare,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  History,
  Activity,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { HouseholdMember } from '../../../types';
import { MemberRoleBadge } from './MemberRoleBadge';
import { getUserInitials, getRoleConfig } from '../utils/householdFormatters';
import {
  canManageRoles,
  canRemoveMember,
  canTransferOwnership,
  canViewOtherMemberFinancials,
} from '../utils/householdPermissions';
import { useSettingStore } from '../../../stores/useSettingStore';

interface MemberDetailDrawerProps {
  member: HouseholdMember | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserRole?: string;
  activeTasksCount: number;
  onOpenRoleChange: (member: HouseholdMember) => void;
  onOpenTransferOwnership: (member: HouseholdMember) => void;
  onOpenRemoveMember: (member: HouseholdMember) => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  member,
  isOpen,
  onClose,
  currentUserId,
  currentUserRole,
  activeTasksCount: propActiveTasksCount,
  onOpenRoleChange,
  onOpenTransferOwnership,
  onOpenRemoveMember,
}) => {
  const navigate = useNavigate();
  const { reducedMotion, format } = useSettingStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'responsibilities' | 'finance' | 'activity'>('profile');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch authorized Member Overview from backend
  const { data: overview, isLoading } = useQuery({
    queryKey: ['memberOverview', member?.id],
    queryFn: async () => {
      if (!member?.id) return null;
      const res = await apiClient.get(`/family/members/${member.id}/overview`);
      return res.data;
    },
    enabled: Boolean(isOpen && member?.id),
    staleTime: 1000 * 20,
  });

  if (!isOpen || !member) return null;

  const isMe = member.id === currentUserId;
  const initials = getUserInitials(member.name, member.email);
  const roleConfig = getRoleConfig(member.role);

  const allowManageRole = canManageRoles(currentUserRole, member.role) && !isMe;
  const allowRemove = canRemoveMember(currentUserRole, member.role, isMe);
  const allowTransfer = canTransferOwnership(currentUserRole) && !isMe;

  // Financial visibility: Strictly OWNER, CO-OWNER, or viewing self
  const canSeeFinance = canViewOtherMemberFinancials(currentUserRole) || isMe;
  const finance = overview?.finance;

  const activeTasks = overview?.responsibilities?.activeTasks || [];
  const completedTasksCount = overview?.responsibilities?.completedTasksCount ?? 0;
  const memberActivities = overview?.activity || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen max-w-md bg-panel border-l border-primary/80 shadow-2xl flex flex-col justify-between ${
            reducedMotion ? '' : 'animate-in slide-in-from-right duration-200'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-primary/60 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-primary">Member Intelligence</h3>
              <p className="text-[11px] text-secondary">Household profile & operational intelligence</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member Banner & Tabs */}
          <div className="px-5 pt-4 pb-2 border-b border-primary/50 bg-secondary/15">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-13 h-13 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-black text-lg flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-primary truncate">{member.name}</h4>
                  {isMe && (
                    <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/25 px-1.5 py-0.2 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MemberRoleBadge role={member.role} />
                  <span className="text-[10px] text-muted flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-t border-primary/40 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-secondary/50'
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('responsibilities')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'responsibilities'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-secondary/50'
                }`}
              >
                Tasks ({activeTasks.length || propActiveTasksCount})
              </button>
              {canSeeFinance && (
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'finance'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-secondary hover:text-primary hover:bg-secondary/50'
                  }`}
                >
                  Finance
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'activity'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-secondary/50'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="space-y-3 animate-pulse pt-4">
                <div className="h-12 bg-secondary/50 rounded-xl" />
                <div className="h-20 bg-secondary/50 rounded-xl" />
                <div className="h-32 bg-secondary/50 rounded-xl" />
              </div>
            ) : activeTab === 'profile' ? (
              /* TAB 1: PROFILE */
              <div className="space-y-4">
                <div className="divide-y divide-primary/50 border border-primary/50 rounded-2xl bg-panel p-3 text-xs space-y-1">
                  {member.email && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-secondary font-medium flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email</span>
                      </span>
                      <span className="font-semibold text-primary truncate max-w-[200px]">{member.email}</span>
                    </div>
                  )}

                  {member.phoneNumber && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-secondary font-medium flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone</span>
                      </span>
                      <span className="font-semibold text-primary">{member.phoneNumber}</span>
                    </div>
                  )}

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-secondary font-medium flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined</span>
                    </span>
                    <span className="font-semibold text-primary">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Permissions Info Box */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-primary/60 space-y-1.5">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Role Permissions: {roleConfig.label}</span>
                  </span>
                  <p className="text-xs text-secondary leading-relaxed">{roleConfig.description}</p>
                </div>
              </div>
            ) : activeTab === 'responsibilities' ? (
              /* TAB 2: RESPONSIBILITIES */
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400 block font-mono">
                      {activeTasks.length}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                      Active Tasks
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                      {completedTasksCount}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-primary block">Assigned Chores & Tasks</span>
                  {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                      {activeTasks.map((t: any) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl border border-primary/60 bg-panel flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold text-primary block truncate">{t.title}</span>
                            <span className="text-[10px] text-muted flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {t.dueDate
                                ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : 'No due date'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              t.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                                : 'bg-slate-500/15 text-slate-600 border border-slate-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-primary/60 text-center text-xs text-muted">
                      No active tasks assigned currently.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/tasks?assignee=${member.id}`);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-primary/80 text-xs font-bold text-primary flex items-center justify-between transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-500" />
                    <span>View in Tasks Workspace</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </button>
              </div>
            ) : activeTab === 'finance' && canSeeFinance ? (
              /* TAB 3: FINANCE (OWNER, CO-OWNER, SELF ONLY) */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
                      +{format(finance?.totalIncome || 0)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Income
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono block">
                      -{format(finance?.totalExpenses || 0)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      Spend
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span
                      className={`text-xs sm:text-sm font-extrabold font-mono block ${
                        (finance?.netBalance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'
                      }`}
                    >
                      {format(finance?.netBalance || 0)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Net
                    </span>
                  </div>
                </div>

                {/* Recent Member Transactions */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-primary block">Recent Transactions</span>
                  {finance?.recentTransactions && finance.recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {finance.recentTransactions.slice(0, 6).map((tx: any) => (
                        <div
                          key={tx.id}
                          className="p-2.5 rounded-xl border border-primary/60 bg-panel flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold text-primary block truncate">{tx.title}</span>
                            <span className="text-[10px] text-muted">
                              {new Date(tx.occurredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {tx.category || 'General'}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}{format(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-primary/60 text-center text-xs text-muted">
                      No attributed transaction records for this member.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TAB 4: ACTIVITY */
              <div className="space-y-3">
                <span className="text-xs font-bold text-primary block">Recent Member Activity</span>
                {memberActivities.length > 0 ? (
                  <div className="space-y-2">
                    {memberActivities.map((act: any) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl border border-primary/60 bg-panel text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary text-[11px] uppercase tracking-wider">
                            {act.action}
                          </span>
                          <span className="text-[10px] text-muted">
                            {new Date(act.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-secondary text-xs">{act.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-primary/60 text-center text-xs text-muted">
                    No recent logged actions recorded.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-primary/60 bg-secondary/20 space-y-2">
            {allowManageRole && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoleChange(member);
                }}
                className="w-full py-2 rounded-xl border border-primary/80 bg-panel hover:bg-secondary/70 text-xs font-bold text-primary flex items-center justify-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Change Member Role</span>
              </button>
            )}

            {allowTransfer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransferOwnership(member);
                }}
                className="w-full py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-2 transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span>Transfer Household Ownership</span>
              </button>
            )}

            {allowRemove && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRemoveMember(member);
                }}
                className="w-full py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove From Household</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
