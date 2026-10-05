import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../services/socketService';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingStore } from '../stores/useSettingStore';
import { E2EEMessagingEngine } from '../services/e2ee/e2eeCrypto';

export interface InAppToastNotification {
  id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  previewText: string;
  timestamp: string;
}

export interface DrawerMessageNotification {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  previewText: string;
  timestamp: string;
  isRead: boolean;
  type: 'DIRECT' | 'GROUP';
}

interface RealtimeNotificationContextType {
  totalUnread: number;
  unreadByConversation: Record<string, number>;
  drawerMessageNotifications: DrawerMessageNotification[];
  clearDrawerMessageNotification: (messageId: string) => void;
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  markConversationRead: (conversationId: string) => Promise<void>;
  requestBrowserPermission: () => Promise<NotificationPermission>;
  browserPermission: NotificationPermission;
  refreshUnreadCounts: () => Promise<void>;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | undefined>(undefined);

// Web Audio API soft chime for optional notification sounds
function playSubtleNotificationChime() {
  if (typeof window === 'undefined') return;
  const isSoundEnabled = localStorage.getItem('hm_notif_sound') === 'true';
  if (!isSoundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Soft two-tone warm chime (E5 -> G5)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // AudioContext autoplay restrictions: degrade silently
  }
}

// Client-side zero-server-knowledge E2EE preview decrypter
async function decryptPreviewSafe(envelope: any, convId: string): Promise<string> {
  try {
    let recipientWrappedKeys = envelope.recipientWrappedKeys || {};
    if (typeof recipientWrappedKeys === 'string') {
      try {
        recipientWrappedKeys = JSON.parse(recipientWrappedKeys);
      } catch {}
    }

    const decrypted = await E2EEMessagingEngine.decryptMessage({
      conversationId: convId,
      clientMessageId: envelope.clientMessageId || envelope.id,
      senderDeviceId: envelope.senderDeviceId,
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      ephemeralPublicKey: envelope.ephemeralPublicKey,
      recipientWrappedKeys,
      aad: envelope.aad,
      encryptionVersion: envelope.encryptionVersion || 'v1',
    });

    if (decrypted && !decrypted.startsWith('Unable to decrypt')) {
      return decrypted.length > 70 ? `${decrypted.slice(0, 70)}…` : decrypted;
    }
  } catch {
    // Degrade gracefully without exposing cryptographic errors
  }
  return 'Sent you a new message';
}

export const RealtimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, household } = useAuthStore();
  const { pushNotifications } = useSettingStore();
  const navigate = useNavigate();

  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [drawerMessageNotifications, setDrawerMessageNotifications] = useState<DrawerMessageNotification[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inAppToasts, setInAppToasts] = useState<InAppToastNotification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Track processed message IDs to block duplicate notifications on socket reconnects
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;

  // Refresh unread counts & message list from API
  const refreshUnreadCounts = useCallback(async () => {
    if (!user?.id || !household?.id) return;
    try {
      const res = await apiClient.get('/communication/unread');
      if (res.data) {
        setTotalUnread(res.data.totalUnread || 0);
        setUnreadByConversation(res.data.byConversation || {});

        // Populate drawer notifications from persistent receipts
        if (res.data.unreadMessages && Array.isArray(res.data.unreadMessages)) {
          const items: DrawerMessageNotification[] = [];
          for (const msg of res.data.unreadMessages) {
            const preview = await decryptPreviewSafe(msg, msg.conversationId);
            items.push({
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar,
              previewText: preview,
              timestamp: msg.createdAt,
              isRead: false,
              type: msg.conversationType === 'GROUP' ? 'GROUP' : 'DIRECT',
            });
          }
          setDrawerMessageNotifications(items);
        }
      }
    } catch (err) {
      // Degrade gracefully if offline
    }
  }, [user?.id, household?.id]);

  // Initial fetch on login / mount
  useEffect(() => {
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Request browser notification permission explicitly upon user action
  const requestBrowserPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission;
    } catch {
      return 'denied';
    }
  };

  // Mark a conversation read
  const markConversationRead = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    // Optimistically update local unread state
    setUnreadByConversation((prev) => {
      const currentCount = prev[conversationId] || 0;
      if (currentCount === 0) return prev;
      const next = { ...prev };
      delete next[conversationId];
      setTotalUnread((tot) => Math.max(0, tot - currentCount));
      return next;
    });

    // Remove drawer message notifications for this conversation
    setDrawerMessageNotifications((prev) => prev.filter((item) => item.conversationId !== conversationId));

    // Dismiss any active toast for this conversation
    setInAppToasts((prev) => prev.filter((t) => t.conversationId !== conversationId));

    try {
      const deviceId = E2EEMessagingEngine.getDeviceId();
      await apiClient.post(`/communication/conversation/${conversationId}/read`, { deviceId });
    } catch {
      // Ignore background receipt failure
    }
  }, []);

  const clearDrawerMessageNotification = useCallback((messageId: string) => {
    setDrawerMessageNotifications((prev) => prev.filter((item) => item.id !== messageId));
  }, []);

  // Main Socket Listener mounted at app root
  useEffect(() => {
    if (!user?.id) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = async (envelope: any) => {
      if (!envelope || !envelope.id) return;

      // 1. Ignore messages sent by self
      if (envelope.senderId === user.id) {
        if (envelope.id) processedMessageIdsRef.current.add(envelope.id);
        return;
      }

      // 2. Deduplication check: prevent replay loops on reconnects
      if (processedMessageIdsRef.current.has(envelope.id)) {
        return;
      }
      processedMessageIdsRef.current.add(envelope.id);

      const senderName = envelope.sender?.name || 'Family Member';
      const convId = envelope.conversationId;

      // 3. Active Chat Suppression:
      // If user is currently looking at this exact conversation AND tab is visible and focused:
      const isViewingCurrent = activeConversationIdRef.current === convId;
      const isPageFocused = typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus();

      if (isViewingCurrent && isPageFocused) {
        // Do NOT show toast or browser notification. Just acknowledge delivery & read!
        const myDeviceId = E2EEMessagingEngine.getDeviceId();
        socket.emit('message:delivered', { messageId: envelope.id, deviceId: myDeviceId, conversationId: convId });
        socket.emit('message:read', { messageId: envelope.id, deviceId: myDeviceId, conversationId: convId });
        return;
      }

      // 4. Update Unread Count (User is not currently active on this conversation)
      setUnreadByConversation((prev) => ({
        ...prev,
        [convId]: (prev[convId] || 0) + 1,
      }));
      setTotalUnread((prev) => prev + 1);

      // Acknowledge delivery to sender
      const myDeviceId = E2EEMessagingEngine.getDeviceId();
      socket.emit('message:delivered', { messageId: envelope.id, deviceId: myDeviceId, conversationId: convId });

      // 5. Decrypt message client-side ONLY (E2EE Zero Server Exposure)
      const previewText = await decryptPreviewSafe(envelope, convId);

      // 6. Integrate into Drawer Notifications
      const newDrawerItem: DrawerMessageNotification = {
        id: envelope.id,
        conversationId: convId,
        senderId: envelope.senderId,
        senderName,
        senderAvatar: envelope.sender?.avatar || null,
        previewText,
        timestamp: envelope.createdAt || new Date().toISOString(),
        isRead: false,
        type: envelope.conversationType === 'GROUP' ? 'GROUP' : 'DIRECT',
      };
      setDrawerMessageNotifications((prev) => [newDrawerItem, ...prev.filter((i) => i.id !== envelope.id)]);

      // 6. Foreground In-App Toast
      const isMessageNotifEnabled = localStorage.getItem('hm_notif_messages') !== 'false';
      if (isMessageNotifEnabled) {
        const newToast: InAppToastNotification = {
          id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          messageId: envelope.id,
          conversationId: convId,
          senderId: envelope.senderId,
          senderName,
          senderAvatar: envelope.sender?.avatar,
          previewText,
          timestamp: envelope.createdAt || new Date().toISOString(),
        };

        setInAppToasts((prev) => [...prev.slice(-2), newToast]);
        playSubtleNotificationChime();

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setInAppToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 5000);
      }

      // 7. Background / Unfocused Browser Notification
      const isTabHiddenOrBlurred = typeof document !== 'undefined' && (document.visibilityState !== 'visible' || !document.hasFocus());
      if (
        isTabHiddenOrBlurred &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        pushNotifications !== false
      ) {
        try {
          const browserNotif = new Notification('HomeMind.AI', {
            body: `${senderName}: ${previewText}`,
            icon: '/favicon.ico',
            tag: `homemind-msg-${convId}`,
          });

          browserNotif.onclick = () => {
            window.focus();
            navigate(`/family?conversation=${convId}&tab=communication`);
            browserNotif.close();
          };
        } catch (err) {
          console.warn('[Notification] Browser notification display error:', err);
        }
      }
    };

    const handleReadReceipt = (data: { messageId: string; userId: string }) => {
      // If our own device read this on another tab/device, refresh unread counts
      if (data.userId === user.id) {
        refreshUnreadCounts();
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('connect', refreshUnreadCounts);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read_receipt', handleReadReceipt);
      socket.off('connect', refreshUnreadCounts);
    };
  }, [user?.id, pushNotifications, navigate, refreshUnreadCounts]);

  const handleOpenConversation = (conversationId: string) => {
    setInAppToasts((prev) => prev.filter((t) => t.conversationId !== conversationId));
    markConversationRead(conversationId);
    navigate(`/family?conversation=${conversationId}&tab=communication`);
  };

  const handleDismissToast = (toastId: string) => {
    setInAppToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  return (
    <RealtimeNotificationContext.Provider
      value={{
        totalUnread,
        unreadByConversation,
        drawerMessageNotifications,
        clearDrawerMessageNotification,
        activeConversationId,
        setActiveConversationId,
        markConversationRead,
        requestBrowserPermission,
        browserPermission,
        refreshUnreadCounts,
      }}
    >
      {children}

      {/* Floating In-App Toast Container */}
      <div className="fixed top-16 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-[92%] sm:w-auto pointer-events-none select-none">
        <AnimatePresence>
          {inAppToasts.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 dark:bg-[#0A1028]/95 backdrop-blur-xl border border-indigo-500/25 dark:border-indigo-500/35 shadow-xl shadow-indigo-950/20 flex items-start gap-3 text-slate-800 dark:text-slate-100"
            >
              {/* Avatar / Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-rose-500/25 flex-shrink-0">
                {notif.senderAvatar ? (
                  <img src={notif.senderAvatar} alt={notif.senderName} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  notif.senderName.charAt(0).toUpperCase()
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {notif.senderName}
                  </h4>
                  <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Direct Message</span>
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                  {notif.previewText}
                </p>

                {/* Open Chat Action */}
                <button
                  onClick={() => handleOpenConversation(notif.conversationId)}
                  className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>Reply in Family Workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismissToast(notif.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </RealtimeNotificationContext.Provider>
  );
};

export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within RealtimeNotificationProvider');
  }
  return context;
};
