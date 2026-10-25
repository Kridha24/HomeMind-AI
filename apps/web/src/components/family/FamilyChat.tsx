import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Smile,
  Phone,
  Video,
  Users,
  ShieldCheck,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Paperclip,
  MoreVertical,
  Circle,
  MessageSquare,
  Lock,
  Search,
  Info,
  X,
  KeyRound,
  Laptop,
  Smartphone,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { useRealtimeNotifications } from '../../contexts/RealtimeNotificationContext';
import {
  E2EEMessagingEngine,
  EncryptedEnvelope,
} from '../../services/e2ee/e2eeCrypto';
import { toast } from '../../features/household/utils/toast';


interface Member {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
}

interface DecryptedMessage {
  id: string;
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderDeviceId: string;
  text: string;
  createdAt: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  isDecrypted: boolean;
  encryptionVersion: string;
  readByCount?: number;
}

interface FamilyChatProps {
  members: Member[];
  onlineUserIds: string[];
  onStartCall: (member: Member, callType: 'audio' | 'video') => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '🙌', '🏡', '✨'];

export const FamilyChat: React.FC<FamilyChatProps> = ({
  members,
  onlineUserIds = [],
  onStartCall,
}) => {
  const { user, household } = useAuthStore();
  const [searchParams] = useSearchParams();
  const { setActiveConversationId, markConversationRead, unreadByConversation } = useRealtimeNotifications();

  const [activeChannel, setActiveChannel] = useState<'group' | string>(() => {
    const memberParam = searchParams.get('member');
    return memberParam || 'group';
  });
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(() => !!searchParams.get('member'));

  // Switch channel when URL query changes
  useEffect(() => {
    const memberParam = searchParams.get('member');
    if (memberParam && memberParam !== activeChannel) {
      setActiveChannel(memberParam);
      setMobileShowChat(true);
    }
  }, [searchParams, activeChannel]);

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMembersDirectoryOpen, setIsMembersDirectoryOpen] = useState(false);
  const [isGroupCallModalOpen, setIsGroupCallModalOpen] = useState(false);
  const [groupCallType, setGroupCallType] = useState<'audio' | 'video'>('video');

  // E2EE & Conversation State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = conversationId;

  // Track processed message IDs to guarantee exactly-once rendering
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  const [recipientDevices, setRecipientDevices] = useState<
    Array<{ deviceId: string; publicKey: string }>
  >([]);
  const [deviceInfo, setDeviceInfo] = useState<{
    deviceId: string;
    publicKey: string;
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);

  // Typing state
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to decrypt server message envelope history
  const decryptServerMessages = async (
    serverMessages: any[],
    membersList: Member[],
    currentUserId?: string
  ): Promise<DecryptedMessage[]> => {
    const decryptedList: DecryptedMessage[] = [];
    for (const sm of serverMessages) {
      let decryptedText = 'Unable to decrypt this message.';
      let isDecrypted = false;

      try {
        let recipientWrappedKeys = sm.recipientWrappedKeys || {};
        if (typeof recipientWrappedKeys === 'string') {
          try {
            recipientWrappedKeys = JSON.parse(recipientWrappedKeys);
          } catch {
            recipientWrappedKeys = {};
          }
        }

        const envelope: EncryptedEnvelope = {
          conversationId: sm.conversationId,
          clientMessageId: sm.clientMessageId,
          senderDeviceId: sm.senderDeviceId,
          ciphertext: sm.ciphertext,
          iv: sm.iv,
          ephemeralPublicKey: sm.ephemeralPublicKey,
          recipientWrappedKeys,
          aad: sm.aad,
          encryptionVersion: sm.encryptionVersion,
        };
        decryptedText = await E2EEMessagingEngine.decryptMessage(envelope);
        isDecrypted = !decryptedText.startsWith('Unable to decrypt');
      } catch {
        decryptedText = 'Unable to decrypt this message.';
      }

      const sender = membersList.find((m) => m.id === sm.senderId);
      const isMe = sm.senderId === currentUserId;

      // Deduce status from receipts
      let status: DecryptedMessage['status'] = 'SENT';
      if (sm.receipts && sm.receipts.length > 0) {
        const hasRead = sm.receipts.some((r: any) => r.readAt);
        const hasDelivered = sm.receipts.some((r: any) => r.deliveredAt);
        if (hasRead) status = 'READ';
        else if (hasDelivered) status = 'DELIVERED';
      }

      decryptedList.push({
        id: sm.id,
        clientMessageId: sm.clientMessageId,
        conversationId: sm.conversationId,
        senderId: sm.senderId,
        senderName: sender?.name || (isMe ? 'You' : 'Family Member'),
        senderDeviceId: sm.senderDeviceId,
        text: decryptedText,
        createdAt: sm.createdAt,
        status,
        isDecrypted,
        encryptionVersion: sm.encryptionVersion || 'v1',
        readByCount: sm.receipts ? sm.receipts.filter((r: any) => r.readAt).length : 0,
      });
    }
    return decryptedList;
  };

  // 1. Initialize Device Identity (ECDH P-256) in IndexedDB and backend directory
  useEffect(() => {
    let isMounted = true;

    async function initE2EE() {
      try {
        setIsInitializing(true);
        const devInfo = await E2EEMessagingEngine.initDeviceIdentity();
        if (isMounted) {
          setDeviceInfo(devInfo);
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error('[E2EE] Init failed:', err);
        toast.error(err?.message || 'E2EE device initialization failed');
        if (isMounted) setIsInitializing(false);
      }
    }

    initE2EE();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch or Create Conversation & Messages whenever activeChannel or household changes
  useEffect(() => {
    let isMounted = true;

    async function loadActiveConversation() {
      if (isInitializing) return;

      const targetHouseholdId = household?.id || (user as any)?.householdId;
      if (!targetHouseholdId || !user?.id) {
        return;
      }

      try {
        setIsLoadingChannel(true);
        setMessages([]);

        let conv;
        if (activeChannel === 'group') {
          // Fetch default household conversation
          const convRes = await apiClient.get('/communication/conversation', {
            params: { householdId: targetHouseholdId },
          });
          conv = convRes.data.conversation;
        } else {
          // Fetch or create 1-to-1 direct conversation with selected family member
          const convRes = await apiClient.post('/communication/conversation', {
            participantIds: [user.id, activeChannel],
          });
          conv = convRes.data.conversation;
        }

        if (!conv) {
          throw new Error('Conversation could not be loaded');
        }

        if (!isMounted) return;
        setConversationId(conv.id);
        setActiveConversationId(conv.id);
        markConversationRead(conv.id);

        // Join conversation room on server
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('join_conversation', { conversationId: conv.id });
        }

        // Fetch recipient devices for key wrapping
        const recRes = await apiClient.get(
          `/communication/conversation/${conv.id}/recipients`
        );
        if (isMounted) {
          setRecipientDevices(recRes.data.recipients || recRes.data.devices || []);
        }

        // Fetch message history and decrypt client-side
        const msgRes = await apiClient.get(
          `/communication/conversation/${conv.id}/messages`
        );
        const serverMessages = msgRes.data.messages || [];
        const decryptedList = await decryptServerMessages(serverMessages, members, user.id);

        if (isMounted) {
          // Seed the deduplication set with existing history message IDs
          processedMessageIdsRef.current.clear();
          decryptedList.forEach((m) => {
            if (m.id) processedMessageIdsRef.current.add(m.id);
            if (m.clientMessageId) processedMessageIdsRef.current.add(m.clientMessageId);
          });

          setMessages(decryptedList);
          setIsLoadingChannel(false);
        }
      } catch (err: any) {
        console.error('[E2EE] Failed to load conversation:', err);
        toast.error(err?.response?.data?.error || err.message || 'Failed to load conversation');
        if (isMounted) {
          setIsLoadingChannel(false);
        }
      }
    }

    loadActiveConversation();

    return () => {
      isMounted = false;
      setActiveConversationId(null);
      const socket = socketService.getSocket();
      if (socket && activeConversationIdRef.current) {
        socket.emit('leave_conversation', { conversationId: activeConversationIdRef.current });
      }
    };
  }, [activeChannel, isInitializing, household?.id, user?.id, members, setActiveConversationId, markConversationRead]);


  // 2. Real-time Socket Event Handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Handle new incoming encrypted message
    const handleNewMessage = async (envelope: any) => {
      // 1. Channel filter: ensure event belongs to active conversation
      if (envelope.conversationId !== activeConversationIdRef.current) return;

      // 2. Early Deduplication Check: if server message ID has already been fully processed, discard duplicate event
      if (envelope.id && processedMessageIdsRef.current.has(envelope.id)) {
        return;
      }

      const isMe = envelope.senderId === user?.id;
      const myDeviceId = E2EEMessagingEngine.getDeviceId();

      let recipientWrappedKeys = envelope.recipientWrappedKeys || {};
      if (typeof recipientWrappedKeys === 'string') {
        try {
          recipientWrappedKeys = JSON.parse(recipientWrappedKeys);
        } catch {
          recipientWrappedKeys = {};
        }
      }

      let decryptedText = 'Unable to decrypt this message.';
      let isDecrypted = false;

      try {
        decryptedText = await E2EEMessagingEngine.decryptMessage({
          conversationId: envelope.conversationId,
          clientMessageId: envelope.clientMessageId,
          senderDeviceId: envelope.senderDeviceId,
          ciphertext: envelope.ciphertext,
          iv: envelope.iv,
          ephemeralPublicKey: envelope.ephemeralPublicKey,
          recipientWrappedKeys,
          aad: envelope.aad,
          encryptionVersion: envelope.encryptionVersion,
        });
        isDecrypted = !decryptedText.startsWith('Unable to decrypt');
      } catch {
        decryptedText = 'Unable to decrypt this message.';
      }

      const sender = members.find((m) => m.id === envelope.senderId);

      setMessages((prev) => {
        // Guard: check if an identical non-SENDING message is already rendered in the current list
        const isAlreadyPresent = prev.some(
          (m) =>
            (envelope.id && m.id === envelope.id && m.status !== 'SENDING') ||
            (envelope.clientMessageId && m.clientMessageId === envelope.clientMessageId && m.status !== 'SENDING')
        );
        if (isAlreadyPresent) return prev;

        // Deduplicate: replace optimistic message if clientMessageId matches
        const existingIdx = prev.findIndex(
          (m) =>
            m.clientMessageId === envelope.clientMessageId ||
            (envelope.id && m.id === envelope.id)
        );

        const newMsg: DecryptedMessage = {
          id: envelope.id,
          clientMessageId: envelope.clientMessageId,
          conversationId: envelope.conversationId,
          senderId: envelope.senderId,
          senderName: sender?.name || (isMe ? 'You' : 'Family Member'),
          senderDeviceId: envelope.senderDeviceId,
          text: decryptedText,
          createdAt: envelope.createdAt || new Date().toISOString(),
          status: isMe ? 'SENT' : 'DELIVERED',
          isDecrypted,
          encryptionVersion: envelope.encryptionVersion || 'v1',
          readByCount: 0,
        };

        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            id: envelope.id,
            status: isMe ? 'SENT' : updated[existingIdx].status,
          };
          return updated;
        }

        return [...prev, newMsg];
      });

      // Mark ID as processed to block duplicate socket deliveries
      if (envelope.id) processedMessageIdsRef.current.add(envelope.id);
      if (envelope.clientMessageId) processedMessageIdsRef.current.add(envelope.clientMessageId);

      // Acknowledge delivery & read if message is from another member
      if (!isMe) {
        socket.emit('message:delivered', {
          messageId: envelope.id,
          deviceId: myDeviceId,
          conversationId: envelope.conversationId,
        });
        socket.emit('message:read', {
          messageId: envelope.id,
          deviceId: myDeviceId,
          conversationId: envelope.conversationId,
        });
        markConversationRead(envelope.conversationId);
      }
    };


    // Handle server confirmation of message acceptance (SENT state)
    const handleMessageSent = (data: {
      clientMessageId: string;
      messageId: string;
      createdAt: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === data.clientMessageId
            ? { ...m, id: data.messageId, status: 'SENT', createdAt: data.createdAt }
            : m
        )
      );
    };

    // Handle server error rejection of message (FAILED state)
    const handleMessageError = (data: {
      clientMessageId?: string;
      error: string;
    }) => {
      console.error('[E2EE] Message send rejected by server:', data);
      if (data.clientMessageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === data.clientMessageId
              ? { ...m, status: 'FAILED' }
              : m
          )
        );
      }
      toast.error(data.error || 'Message failed to send');
    };

    // Handle delivery receipt
    const handleDeliveredReceipt = (data: {
      messageId: string;
      userId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId && m.status !== 'READ'
            ? { ...m, status: 'DELIVERED' }
            : m
        )
      );
    };

    // Handle read receipt
    const handleReadReceipt = (data: {
      messageId: string;
      userId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                status: 'READ',
                readByCount: (m.readByCount || 0) + 1,
              }
            : m
        )
      );
    };

    // Transient Typing Indicators
    const handleTypingStarted = (data: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (data.userId === user?.id) return;
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.userName,
      }));
    };

    const handleTypingStopped = (data: {
      conversationId: string;
      userId: string;
    }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:sent', handleMessageSent);
    socket.on('message:error', handleMessageError);
    socket.on('message:delivered_receipt', handleDeliveredReceipt);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('typing:started', handleTypingStarted);
    socket.on('typing:stopped', handleTypingStopped);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleMessageSent);
      socket.off('message:error', handleMessageError);
      socket.off('message:delivered_receipt', handleDeliveredReceipt);
      socket.off('message:read_receipt', handleReadReceipt);
      socket.off('typing:started', handleTypingStarted);
      socket.off('typing:stopped', handleTypingStopped);
    };
  }, [conversationId, user?.id, members]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel, typingUsers]);

  // Filter messages based on active channel and optional search
  const displayedMessages = useMemo(() => {
    let list = messages;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.text.toLowerCase().includes(q));
    }
    return list;
  }, [messages, searchQuery]);

  const activeMember = members.find((m) => m.id === activeChannel);
  const otherMembers = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user?.id]);

  const handleGroupCallClick = (type: 'audio' | 'video') => {
    if (otherMembers.length === 0) {
      toast.error('No other family members in this household yet to call.');
      return;
    }
    if (otherMembers.length === 1) {
      onStartCall(otherMembers[0], type);
      return;
    }
    setGroupCallType(type);
    setIsGroupCallModalOpen(true);
  };

  const handleStartHouseholdGroupCall = (type: 'audio' | 'video') => {
    setIsGroupCallModalOpen(false);
    onStartCall(
      {
        id: 'household',
        name: `${household?.name || 'Family'} Group Call`,
        role: 'GROUP',
      },
      type
    );
  };

  // Typing event emitter with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const socket = socketService.getSocket();
    if (!socket || !conversationId) return;

    if (!isTypingRef.current && e.target.value.trim().length > 0) {
      isTypingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { conversationId });
    }, 2000);
  };

  // 3. Encrypted Message Send Flow
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user?.id) return;

    if (!conversationId) {
      toast.error('No active conversation selected');
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) return;

    const plaintext = inputText.trim();
    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const myDeviceId = E2EEMessagingEngine.getDeviceId();

    // Clear typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { conversationId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setInputText('');
    setShowEmojiBar(false);

    // Optimistic UI bubble with SENDING status
    const optimisticMsg: DecryptedMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId: user.id,
      senderName: user.name || 'You',
      senderDeviceId: myDeviceId,
      text: plaintext,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
      isDecrypted: true,
      encryptionVersion: 'v1',
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Refresh recipient keys to account for newly registered devices
      let currentRecipients = recipientDevices;
      try {
        const recRes = await apiClient.get(
          `/communication/conversation/${conversationId}/recipients`
        );
        currentRecipients = recRes.data.recipients || recRes.data.devices || [];
        setRecipientDevices(currentRecipients);
      } catch (err) {
        console.warn('[E2EE] Could not refresh recipient keys, using cached:', err);
      }

      // CLIENT-SIDE ENCRYPTION: Web Crypto API AES-GCM + ECDH P-256 + AES-KW envelope
      const envelope = await E2EEMessagingEngine.encryptMessage(
        plaintext,
        currentRecipients,
        {
          conversationId,
          senderId: user.id,
          clientMessageId,
        }
      );

      // Transmit ONLY ciphertext envelope over socket (SERVER NEVER SEES PLAINTEXT)
      socket.emit('message:send', envelope);

      // Guard: If server never confirms within 10s, fail cleanly instead of faking sent status
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId && m.status === 'SENDING'
              ? { ...m, status: 'FAILED' }
              : m
          )
        );
      }, 10000);
    } catch (err: any) {
      console.error('[E2EE] Encryption failed before send:', err);
      toast.error(err?.message || 'Encryption failed: recipient key unavailable');
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, status: 'FAILED' }
            : m
        )
      );
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[calc(100dvh-10rem)] min-h-[520px] md:h-[680px]">
      {/* Sidebar: WhatsApp-Style Contact & Channels List */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-84 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col justify-between`}>
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              Family Chats & Calls
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              {onlineUserIds.length} Online
            </span>
          </div>
        </div>

        {/* Channels & Members List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
          {/* Main Household Group Channel */}
          <button
            onClick={() => {
              setActiveChannel('group');
              setMobileShowChat(true);
            }}
            className={`w-full p-2.5 sm:p-3 rounded-2xl text-left flex items-center justify-between transition-all duration-150 ${
              activeChannel === 'group'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  activeChannel === 'group'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="font-extrabold text-xs block truncate">Household Group Lounge</span>
                <span
                  className={`text-[10px] block truncate ${
                    activeChannel === 'group' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  All Household Members • Group Chat
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGroupCallClick('audio');
                }}
                className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                  activeChannel === 'group'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
                title="Ring all family members (Audio Call)"
                aria-label="Group Audio Call"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGroupCallClick('video');
                }}
                className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                  activeChannel === 'group'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50'
                }`}
                title="Ring all family members (Video Call)"
                aria-label="Group Video Call"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
              <span className={`p-1.5 rounded-lg ${activeChannel === 'group' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          <div className="pt-2.5 pb-1 px-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Family Members ({members.filter((m) => m.id !== user?.id).length})
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Tap Call or Chat
            </span>
          </div>

          {/* Members List with WhatsApp-Style Direct Action Buttons */}
          {members
            .filter((m) => m.id !== user?.id)
            .map((member) => {
              const isOnline = onlineUserIds.includes(member.id);
              const isSelected = activeChannel === member.id;

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    setActiveChannel(member.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                      : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                          isSelected ? 'border-emerald-600' : 'border-white dark:border-slate-900'
                        } ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-400'}`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate block">{member.name}</span>
                        {/* Unread Message Badge */}
                        {!isSelected && (unreadByConversation[member.id] || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                            {unreadByConversation[member.id]}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-white/80' : isOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'} • {member.role}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp-Style Direct Action Buttons (Audio Call, Video Call, Chat) */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartCall(member, 'audio');
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        isSelected
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60'
                      }`}
                      title={`Audio Call ${member.name}`}
                      aria-label={`Audio Call ${member.name}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartCall(member, 'video');
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        isSelected
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200/80 dark:border-violet-800/60'
                      }`}
                      title={`Video Call ${member.name}`}
                      aria-label={`Video Call ${member.name}`}
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChannel(member.id);
                        setMobileShowChat(true);
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        isSelected
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60'
                      }`}
                      title={`Message ${member.name}`}
                      aria-label={`Message ${member.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

        </div>

        {/* E2EE Info Footer with Verified Security Badge */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 text-center bg-white/60 dark:bg-slate-900/40">
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="w-full py-1.5 px-2 rounded-xl hover:bg-emerald-500/10 text-[10.5px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5 transition-colors group cursor-pointer"
            title="Click for End-to-End Encryption details"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              🔒 End-to-end encrypted
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col justify-between bg-slate-100/70 dark:bg-slate-950/80`}>
        {/* Chat Header (WhatsApp Style) */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shadow-2xs z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back to Channels button on mobile */}
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              aria-label="Back to contacts list"
              className="md:hidden p-2 -ml-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              {activeChannel === 'group' ? (
                <Users className="w-5 h-5" />
              ) : (
                activeMember?.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {activeChannel === 'group'
                    ? 'Household Group Lounge'
                    : activeMember?.name}
                </h4>
                {/* Clickable Members Count Pill */}
                {activeChannel === 'group' ? (
                  <button
                    type="button"
                    onClick={() => setIsMembersDirectoryOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/25 transition-all cursor-pointer"
                    title="Tap to see all members and who to call or message"
                  >
                    <Users className="w-2.5 h-2.5" />
                    <span>{members.length} Members</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSecurityModalOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Messages are end-to-end encrypted."
                  >
                    <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span>E2EE</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] truncate">
                {activeChannel === 'group' ? (
                  <button
                    type="button"
                    onClick={() => setIsMembersDirectoryOpen(true)}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 font-medium text-left truncate flex items-center gap-1"
                  >
                    <span>{members.length} Members • {recipientDevices.length} Devices ({onlineUserIds.length} Online)</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline ml-1">View list</span>
                  </button>
                ) : onlineUserIds.includes(activeMember?.id || '') ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Online
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">
                    Offline • {activeMember?.role}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Call Action Buttons (WhatsApp Style Right-Aligned) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeMember ? (
              <>
                <button
                  type="button"
                  onClick={() => onStartCall(activeMember, 'audio')}
                  className="p-2 sm:px-3 sm:py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                  title="Audio Call (Encrypted)"
                  aria-label="Start Audio Call"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCall(activeMember, 'video')}
                  className="p-2 sm:px-3 sm:py-2 rounded-full bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 text-violet-600 dark:text-violet-400 border border-violet-200/80 dark:border-violet-800/60 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                  title="Video Call (Encrypted)"
                  aria-label="Start Video Call"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleGroupCallClick('audio')}
                  className="p-2 sm:px-3 sm:py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                  title="Family Audio Call (Rings All Members)"
                  aria-label="Start Family Audio Call"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Family Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGroupCallClick('video')}
                  className="p-2 sm:px-3 sm:py-2 rounded-full bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 text-violet-600 dark:text-violet-400 border border-violet-200/80 dark:border-violet-800/60 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                  title="Family Video Call (Rings All Members)"
                  aria-label="Start Family Video Call"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Family Video</span>
                </button>
              </>
            )}

            {/* Quick Members Directory Button */}
            <button
              type="button"
              onClick={() => setIsMembersDirectoryOpen(true)}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title={`View all ${members.length} members & choose who to call or message`}
              aria-label="View Family Members Directory"
            >
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden xs:inline">{members.length}</span>
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full border border-slate-200 dark:border-slate-700 transition-colors ${
                showSearch
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Search decrypted messages"
              aria-label="Search Messages"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Local Search Bar */}
        {showSearch && (
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages in this conversation..."
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
          {isInitializing || isLoadingChannel ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">
                {isInitializing
                  ? 'Initializing device identity & loading messages...'
                  : 'Opening secure conversation...'}
              </p>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-2 p-6">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {searchQuery
                  ? 'No matching decrypted messages'
                  : 'End-to-End Encrypted Household Lounge'}
              </h4>
              <p className="text-xs max-w-xs text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Messages in this conversation are encrypted on your device and can only be decrypted by authorized household devices.'}
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === user?.id;

              return (
                <div
                  key={msg.clientMessageId || msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0 shadow-2xs">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1 max-w-[82%] sm:max-w-[70%]">
                    {!isMe && (
                      <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 block pl-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs font-medium break-words shadow-xs transition-all ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs shadow-emerald-600/15'
                          : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.isDecrypted ? (
                        <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                      ) : (
                        <span className="italic opacity-80 flex items-center gap-1.5 text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5 inline flex-shrink-0" />
                          Unable to decrypt this message.
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-[9.5px] font-medium text-slate-500 dark:text-slate-400 ${
                        isMe ? 'justify-end pr-1' : 'justify-start pl-1'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Delivery / Read Status Receipts for Own Messages */}
                      {isMe && (
                        <span className="inline-flex items-center ml-0.5">
                          {msg.status === 'SENDING' && (
                            <span title="Sending...">
                              <Clock className="w-3 h-3 text-slate-400 animate-pulse" />
                            </span>
                          )}
                          {msg.status === 'SENT' && (
                            <span title="Sent">
                              <Check className="w-3 h-3 text-slate-400" />
                            </span>
                          )}
                          {msg.status === 'DELIVERED' && (
                            <span title="Delivered">
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          )}
                          {msg.status === 'READ' && (
                            <span title={`Read (${msg.readByCount || 1})`}>
                              <CheckCheck className="w-3.5 h-3.5 text-sky-500 font-bold" />
                            </span>
                          )}
                          {msg.status === 'FAILED' && (
                            <span className="text-red-500 font-bold">Failed</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {typingNames.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic pl-1 py-1">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              </span>
              <span>
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing...`
                  : `${typingNames.join(', ')} are typing...`}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (WhatsApp Style) */}
        <div className="p-2.5 sm:p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative shadow-2xs">
          {/* Quick Emoji Bar Popup */}
          {showEmojiBar && (
            <div className="absolute bottom-16 left-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 z-20">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiBar(!showEmojiBar)}
              className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors flex-shrink-0"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 font-medium transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Security Details Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-panel border border-primary/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-primary/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-primary">
                    End-to-End Encryption
                  </h3>
                  <p className="text-[11px] text-muted">Cryptographic Verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/40 border border-primary/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Active (v1)
                  </span>
                </div>
                <p className="text-[11px] text-secondary">
                  Messages are encrypted on your device and decrypted only on recipient devices.
                  The server stores ciphertext only and cannot derive plaintext.
                </p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-secondary/20 border border-primary/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Content AEAD Cipher</span>
                  <span className="font-mono font-semibold text-primary">AES-256-GCM</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Key Agreement</span>
                  <span className="font-mono font-semibold text-primary">ECDH (P-256)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Key Wrapping</span>
                  <span className="font-mono font-semibold text-primary">AES-KW (256-bit)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Local Device ID</span>
                  <span className="font-mono font-semibold text-primary truncate max-w-[170px]">
                    {deviceInfo?.deviceId || 'Loading...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Registered Recipient Devices</span>
                  <span className="font-mono font-semibold text-primary">
                    {recipientDevices.length} devices
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 space-y-1">
                <span className="font-bold block">Private Key Security</span>
                <p className="text-secondary dark:text-blue-300">
                  Your private key is stored securely in your browser's IndexedDB and is NEVER
                  transmitted to the server, cookies, or local storage.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-primary font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Call Options Modal */}
      {isGroupCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md ${
                    groupCallType === 'video'
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-violet-500/25'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/25'
                  }`}
                >
                  {groupCallType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Start Family {groupCallType === 'video' ? 'Video' : 'Audio'} Call
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ring all members or choose a specific person
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupCallModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: 🌟 Ring All Family Members Simultaneously */}
            <button
              type="button"
              onClick={() => handleStartHouseholdGroupCall(groupCallType)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <span className="font-extrabold text-sm block">Ring All Family Members</span>
                  <span className="text-[11px] text-white/80 block">
                    Broadcasts call to all {otherMembers.length} family phones & laptops
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                {groupCallType === 'video' ? <Video className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
              </div>
            </button>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Or Call Specific Member
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Option 2: Individual Member List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {otherMembers.map((m) => {
                const isOnline = onlineUserIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            isOnline ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{m.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {isOnline ? 'Online' : 'Offline'} • {m.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsGroupCallModalOpen(false);
                        onStartCall(m, groupCallType);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white shadow-xs active:scale-95 transition-all cursor-pointer ${
                        groupCallType === 'video'
                          ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/25'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                      }`}
                    >
                      {groupCallType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                      <span>Call</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Family Members Directory Drawer / Modal */}
      {isMembersDirectoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                    Family Members ({members.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {onlineUserIds.length} currently online • Direct Call & Messaging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMembersDirectoryOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Close directory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Group Call Actions Bar */}
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-2 flex-shrink-0">
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Group Family Call</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Rings all family devices at once</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMembersDirectoryOpen(false);
                    handleGroupCallClick('audio');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call All</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMembersDirectoryOpen(false);
                    handleGroupCallClick('video');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video All</span>
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {members.map((member) => {
                const isOnline = onlineUserIds.includes(member.id);
                const isCurrentUser = member.id === user?.id;

                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isCurrentUser
                        ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-90'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-500/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          {member.name.charAt(0)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            isOnline ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-400'
                          }`}
                          title={isOnline ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {member.name}
                          </span>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              You
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {member.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                          {isOnline ? '🟢 Currently Active' : '⚪ Offline'} • {member.email || 'Household Member'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Call, Video, Message (for other members) */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMembersDirectoryOpen(false);
                            onStartCall(member, 'audio');
                          }}
                          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title={`Audio call ${member.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMembersDirectoryOpen(false);
                            onStartCall(member, 'video');
                          }}
                          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title={`Video call ${member.name}`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChannel(member.id);
                            setMobileShowChat(true);
                            setIsMembersDirectoryOpen(false);
                          }}
                          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title={`Message ${member.name}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyChat;
