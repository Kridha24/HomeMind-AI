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
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  E2EEMessagingEngine,
  EncryptedEnvelope,
} from '../../services/e2ee/e2eeCrypto';

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
  const [activeChannel, setActiveChannel] = useState<'group' | string>('group');
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // E2EE & Conversation State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recipientDevices, setRecipientDevices] = useState<
    Array<{ deviceId: string; publicKey: string }>
  >([]);
  const [deviceInfo, setDeviceInfo] = useState<{
    deviceId: string;
    publicKey: string;
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Typing state
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Device Identity & Fetch Default Household Conversation
  useEffect(() => {
    let isMounted = true;

    async function initE2EE() {
      try {
        setIsInitializing(true);
        // Initialize or load device identity key (ECDH P-256) in IndexedDB
        const devInfo = await E2EEMessagingEngine.initDeviceIdentity();
        if (isMounted) setDeviceInfo(devInfo);

        // Fetch or create default household conversation
        const targetHouseholdId = household?.id || (user as any)?.householdId;
        if (!targetHouseholdId) {
          setIsInitializing(false);
          return;
        }

        const convRes = await apiClient.get('/communication/conversation', {
          params: { householdId: targetHouseholdId },
        });

        const conv = convRes.data.conversation;
        if (!conv) {
          setIsInitializing(false);
          return;
        }

        if (isMounted) setConversationId(conv.id);

        // Fetch recipient devices for key wrapping
        const recRes = await apiClient.get(
          `/communication/conversation/${conv.id}/recipients`
        );
        if (isMounted) setRecipientDevices(recRes.data.recipients || []);

        // Fetch message history and decrypt client-side
        const msgRes = await apiClient.get(
          `/communication/conversation/${conv.id}/messages`
        );
        const serverMessages = msgRes.data.messages || [];

        const decryptedList: DecryptedMessage[] = [];
        for (const sm of serverMessages) {
          let decryptedText = 'Unable to decrypt this message.';
          let isDecrypted = false;

          try {
            const envelope: EncryptedEnvelope = {
              conversationId: sm.conversationId,
              clientMessageId: sm.clientMessageId,
              senderDeviceId: sm.senderDeviceId,
              ciphertext: sm.ciphertext,
              iv: sm.iv,
              ephemeralPublicKey: sm.ephemeralPublicKey,
              recipientWrappedKeys: sm.recipientWrappedKeys || {},
              aad: sm.aad,
              encryptionVersion: sm.encryptionVersion,
            };
            decryptedText = await E2EEMessagingEngine.decryptMessage(envelope);
            isDecrypted = !decryptedText.startsWith('Unable to decrypt');
          } catch {
            decryptedText = 'Unable to decrypt this message.';
          }

          const sender = members.find((m) => m.id === sm.senderId);
          const isMe = sm.senderId === user?.id;

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

        if (isMounted) {
          setMessages(decryptedList);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('[E2EE] Init failed:', err);
        if (isMounted) setIsInitializing(false);
      }
    }

    initE2EE();

    return () => {
      isMounted = false;
    };
  }, [household?.id, user?.id, members]);

  // 2. Real-time Socket Event Handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Handle new incoming encrypted message
    const handleNewMessage = async (envelope: any) => {
      if (envelope.conversationId !== conversationId) return;

      const isMe = envelope.senderId === user?.id;
      const myDeviceId = E2EEMessagingEngine.getDeviceId();

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
          recipientWrappedKeys: envelope.recipientWrappedKeys || {},
          aad: envelope.aad,
          encryptionVersion: envelope.encryptionVersion,
        });
        isDecrypted = !decryptedText.startsWith('Unable to decrypt');
      } catch {
        decryptedText = 'Unable to decrypt this message.';
      }

      const sender = members.find((m) => m.id === envelope.senderId);

      setMessages((prev) => {
        // Deduplicate: replace optimistic message if clientMessageId matches
        const existingIdx = prev.findIndex(
          (m) =>
            m.clientMessageId === envelope.clientMessageId ||
            m.id === envelope.id
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

      // Acknowledge delivery & read if message is from another member
      if (!isMe) {
        socket.emit('message:delivered', {
          messageId: envelope.id,
          deviceId: myDeviceId,
        });
        socket.emit('message:read', {
          messageId: envelope.id,
          deviceId: myDeviceId,
        });
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
    socket.on('message:delivered_receipt', handleDeliveredReceipt);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('typing:started', handleTypingStarted);
    socket.on('typing:stopped', handleTypingStopped);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleMessageSent);
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
    if (!inputText.trim() || !conversationId || !user?.id) return;

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
        currentRecipients = recRes.data.recipients || [];
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
    } catch (err) {
      console.error('[E2EE] Encryption failed before send:', err);
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
    <div className="glass-panel border-primary/80 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[680px]">
      {/* Sidebar: Channel & Family Member List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-primary/80 bg-secondary/30 flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-primary/80">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Family Channels
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {onlineUserIds.length} Online
            </span>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Main Household Group Channel */}
          <button
            onClick={() => setActiveChannel('group')}
            className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all ${
              activeChannel === 'group'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'hover:bg-secondary/60 text-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                  activeChannel === 'group'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs block">Household Group</span>
                <span
                  className={`text-[10px] block ${
                    activeChannel === 'group' ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  All Active Household Members
                </span>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                activeChannel === 'group' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
          </button>

          <div className="pt-3 pb-1.5 px-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Family Members
            </span>
            <span className="text-[10px] text-muted font-medium">
              {recipientDevices.length} Devices
            </span>
          </div>

          {/* Members List */}
          {members
            .filter((m) => m.id !== user?.id)
            .map((member) => {
              const isOnline = onlineUserIds.includes(member.id);
              const isSelected = activeChannel === member.id;

              return (
                <button
                  key={member.id}
                  onClick={() => setActiveChannel(member.id)}
                  className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'hover:bg-secondary/60 text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-secondary border border-primary/80 text-primary'
                        }`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                          isSelected ? 'border-blue-600' : 'border-panel'
                        } ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate block">{member.name}</span>
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-white/80' : 'text-muted'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'} • {member.role}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* E2EE Info Footer with Verified Security Badge */}
        <div className="p-3 border-t border-primary/60 text-center bg-secondary/10">
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="w-full py-1.5 px-2 rounded-xl hover:bg-secondary/60 text-[10px] text-muted font-medium flex items-center justify-center gap-1.5 transition-colors group cursor-pointer"
            title="Click for End-to-End Encryption details"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              🔒 End-to-end encrypted
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between bg-panel/50">
        {/* Chat Header */}
        <div className="p-4 border-b border-primary/80 flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {activeChannel === 'group' ? (
                <Users className="w-5 h-5" />
              ) : (
                activeMember?.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-primary">
                  {activeChannel === 'group'
                    ? 'Household Group Lounge'
                    : activeMember?.name}
                </h4>
                {/* E2EE Verified Badge */}
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  title="Messages are encrypted on your device and decrypted only on participating devices."
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>E2EE</span>
                </button>
              </div>
              <p className="text-[11px] text-muted">
                {activeChannel === 'group'
                  ? `${members.length} Household Members • ${recipientDevices.length} Registered Devices`
                  : onlineUserIds.includes(activeMember?.id || '')
                  ? 'Active now'
                  : 'Away'}
              </p>
            </div>
          </div>

          {/* Quick Call Action Buttons & Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl border border-primary/80 transition-colors ${
                showSearch
                  ? 'bg-blue-600 text-white'
                  : 'bg-secondary/80 text-secondary hover:text-primary'
              }`}
              title="Search locally decrypted messages"
            >
              <Search className="w-4 h-4" />
            </button>

            {activeMember && (
              <>
                <button
                  onClick={() => onStartCall(activeMember, 'audio')}
                  className="p-2 sm:p-2.5 rounded-xl bg-secondary/80 hover:bg-emerald-500/15 hover:border-emerald-500/30 text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 border border-primary/80 transition-all shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                  title="Start Audio Call (DTLS-SRTP Media Encrypted)"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Audio</span>
                </button>

                <button
                  onClick={() => onStartCall(activeMember, 'video')}
                  className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-blue-600/25 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                  title="Start Video Call (DTLS-SRTP Media Encrypted)"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Local Search Bar */}
        {showSearch && (
          <div className="p-3 bg-secondary/40 border-b border-primary/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locally decrypted messages..."
              className="flex-1 bg-transparent text-xs text-primary placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted hover:text-primary text-xs"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-lg hover:bg-secondary text-muted hover:text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isInitializing ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted space-y-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Initializing device identity & loading secure lounge...</p>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted space-y-2 p-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-primary/80 flex items-center justify-center text-primary">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-primary">
                {searchQuery
                  ? 'No matching decrypted messages'
                  : 'End-to-End Encrypted Household Lounge'}
              </h4>
              <p className="text-xs max-w-xs text-secondary">
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
                  className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-xl bg-secondary border border-primary/80 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1 max-w-[80%] sm:max-w-[70%]">
                    {!isMe && (
                      <span className="text-[10px] font-bold text-secondary block pl-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium break-words shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-panel border border-primary/80 text-primary rounded-bl-xs'
                      }`}
                    >
                      {msg.isDecrypted ? (
                        <span>{msg.text}</span>
                      ) : (
                        <span className="italic opacity-80 flex items-center gap-1.5 text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5 inline flex-shrink-0" />
                          Unable to decrypt this message.
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[9px] text-muted ${
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
                        <span className="inline-flex items-center ml-1">
                          {msg.status === 'SENDING' && (
                            <span title="Encrypting & sending to server">
                              <Clock className="w-3 h-3 text-white/70 animate-pulse" />
                            </span>
                          )}
                          {msg.status === 'SENT' && (
                            <span title="Sent to server">
                              <Check className="w-3 h-3 text-white/70" />
                            </span>
                          )}
                          {msg.status === 'DELIVERED' && (
                            <span title="Delivered to recipient devices">
                              <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                            </span>
                          )}
                          {msg.status === 'READ' && (
                            <span title={`Read by recipient devices (${msg.readByCount || 1})`}>
                              <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                            </span>
                          )}
                          {msg.status === 'FAILED' && (
                            <span className="text-red-300 font-bold">Failed</span>
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
            <div className="flex items-center gap-2 text-xs text-muted italic pl-1 py-1">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
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

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-primary/80 bg-secondary/30 relative">
          {/* Quick Emoji Bar Popup */}
          {showEmojiBar && (
            <div className="absolute bottom-16 left-4 bg-panel border border-primary/80 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center text-base transition-transform hover:scale-125"
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
              className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type an end-to-end encrypted message..."
              className="flex-1 bg-panel border border-primary/80 rounded-2xl px-4 py-2.5 text-xs text-primary placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
    </div>
  );
};

export default FamilyChat;
