import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  Tv,
  Pill,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useRealtimeNotifications, DrawerMessageNotification } from '../../contexts/RealtimeNotificationContext';
import { socketService } from '../../services/socketService';
import apiClient from '../../services/apiClient';
import { NotificationItem } from '../../types';
import { EmptyState } from './EmptyState';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

type TabFilter = 'ALL' | 'MESSAGES' | 'HOUSEHOLD';

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications: initialHouseholdAlerts = [],
}) => {
  const navigate = useNavigate();
  const { drawerMessageNotifications, markConversationRead, totalUnread } = useRealtimeNotifications();

  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [householdAlerts, setHouseholdAlerts] = useState<NotificationItem[]>(initialHouseholdAlerts);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Fetch persistent household notifications from API
  const fetchHouseholdNotifications = useCallback(async () => {
    try {
      setLoadingAlerts(true);
      const res = await apiClient.get('/notifications');
      if (res.data?.notifications && Array.isArray(res.data.notifications)) {
        setHouseholdAlerts(res.data.notifications);
      }
    } catch {
      // Degrade gracefully
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHouseholdNotifications();
    }
  }, [isOpen, fetchHouseholdNotifications]);

  // Real-time socket listener for incoming household alerts
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewAlert = (alert: NotificationItem) => {
      if (alert && alert.id) {
        setHouseholdAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      }
    };

    socket.on('new_notification', handleNewAlert);
    return () => {
      socket.off('new_notification', handleNewAlert);
    };
  }, []);

  if (!isOpen) return null;

  const handleOpenConversation = (conversationId: string) => {
    markConversationRead(conversationId);
    onClose();
    navigate(`/family?conversation=${conversationId}&tab=communication`);
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      setHouseholdAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      await apiClient.post(`/notifications/${alertId}/read`);
    } catch {
      // Ignore background receipt failure
    }
  };

  const handleMarkAllRead = async () => {
    // 1. Mark all unread conversations read
    const activeConvs = Array.from(new Set(drawerMessageNotifications.map((m) => m.conversationId)));
    for (const convId of activeConvs) {
      await markConversationRead(convId);
    }

    // 2. Mark unread household alerts read
    const unreadAlerts = householdAlerts.filter((a) => !a.isRead);
    setHouseholdAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    for (const alert of unreadAlerts) {
      apiClient.post(`/notifications/${alert.id}/read`).catch(() => {});
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'BILL_DUE':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'GROCERY_EXPIRING':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'LOW_STOCK':
        return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'MEDICINE_REMINDER':
        return <Pill className="w-4 h-4 text-pink-400" />;
      case 'MAINTENANCE_DUE':
        return <Tv className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Just now';
    }
  };

  const unreadAlertsCount = householdAlerts.filter((a) => !a.isRead).length;
  const messageCount = drawerMessageNotifications.length;
  const totalCombinedUnread = totalUnread + unreadAlertsCount;

  // Filter items based on active tab
  const showMessages = activeTab === 'ALL' || activeTab === 'MESSAGES';
  const showAlerts = activeTab === 'ALL' || activeTab === 'HOUSEHOLD';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-panel border-l border-primary h-full p-5 sm:p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-primary/80 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-primary">Household Notifications</h2>
                  {totalCombinedUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-sm">
                      {totalCombinedUnread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted">Real-time alerts & family communication</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-primary p-1.5 rounded-xl hover:bg-secondary transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs & Mark All Read */}
          <div className="flex items-center justify-between gap-1 pb-1">
            <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-xl border border-primary/50 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-primary text-secondary shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MESSAGES')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'MESSAGES'
                    ? 'bg-primary text-secondary shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <span>Messages</span>
                {messageCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono">
                    {messageCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HOUSEHOLD')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'HOUSEHOLD'
                    ? 'bg-primary text-secondary shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <span>Alerts</span>
                {unreadAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-mono">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
            </div>

            {totalCombinedUnread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Main Feed Container */}
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {/* 1. COMMUNICATION MESSAGES SECTION */}
            {showMessages && drawerMessageNotifications.length > 0 && (
              <div className="space-y-2">
                {activeTab === 'ALL' && (
                  <div className="flex items-center gap-1.5 px-1 pt-1 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Direct Messages</span>
                  </div>
                )}
                {drawerMessageNotifications.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-indigo-500/[0.07] border border-indigo-500/25 hover:border-indigo-500/40 transition-all space-y-2 shadow-xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
                          {msg.senderAvatar ? (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            msg.senderName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-primary truncate">
                            {msg.senderName} sent you a message
                          </h4>
                          <span className="text-[10px] text-muted block">
                            {formatTimeAgo(msg.timestamp)}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold flex-shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Direct</span>
                      </span>
                    </div>

                    {/* Decrypted Preview Text (E2EE Client Decrypted) */}
                    <p className="text-xs text-muted leading-relaxed pl-10 pr-2 line-clamp-2">
                      "{msg.previewText}"
                    </p>

                    {/* Action Bar */}
                    <div className="pt-1 pl-10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenConversation(msg.conversationId)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <span>Open Chat</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => markConversationRead(msg.conversationId)}
                        className="text-[11px] font-semibold text-muted hover:text-primary transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. HOUSEHOLD ALERTS SECTION */}
            {showAlerts && householdAlerts.length > 0 && (
              <div className="space-y-2">
                {activeTab === 'ALL' && drawerMessageNotifications.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1 pt-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Household Alerts</span>
                  </div>
                )}
                {householdAlerts.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                      !n.isRead
                        ? 'bg-background/80 border-primary/90 shadow-xs'
                        : 'bg-background/40 border-primary/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-bold text-xs text-primary truncate">
                        {getAlertIcon(n.type)}
                        <span className="truncate">{n.title}</span>
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted font-mono">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAlertRead(n.id)}
                            className="p-1 rounded-lg text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted pl-6 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY STATE */}
            {((showMessages && drawerMessageNotifications.length === 0) || !showMessages) &&
              ((showAlerts && householdAlerts.length === 0) || !showAlerts) && (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description={
                    activeTab === 'MESSAGES'
                      ? 'You have no unread messages. Direct and group messages from family members will appear here.'
                      : activeTab === 'HOUSEHOLD'
                      ? 'No active household alerts. Automated reminders for bills, groceries, and medicine will appear here.'
                      : 'Your household notification feed is empty. Automated alerts for due bills, pantry stock, medicine reminders, and new direct messages will appear here.'
                  }
                  secondaryText="Notifications sync automatically across all family devices."
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
