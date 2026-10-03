import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { verifyAccessToken } from './utils/jwt';
import { webrtcSignaling } from './services/webrtcSignalingService';
import { SecureMessagingService } from './modules/communication/secureMessagingService';
import { DeviceTokenService } from './modules/communication/deviceTokenService';
import { prisma } from './repositories/db';

const server = http.createServer(app);

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
].filter(Boolean);

// Socket.IO: allow configured frontend URL and local dev origins
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin rejected for Socket.IO'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization as string | undefined;
    const queryToken = socket.handshake.query?.token as string | undefined;
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : queryToken;

    if (!rawToken) {
      return next(new Error('Authentication required: no token provided'));
    }

    const payload = verifyAccessToken(rawToken);
    socket.data.user = payload;
    next();
  } catch (err) {
    return next(new Error('Authentication required: invalid or expired token'));
  }
});

// Household active users map: householdId -> Set of online userIds
const onlineHouseholdUsers: Record<string, Set<string>> = {};

io.on('connection', (socket) => {
  const user = socket.data.user;
  const userId = user?.userId;
  const householdId = user?.householdId;

  console.log(`[Socket.IO] Authenticated client connected: ${socket.id} (user: ${userId})`);

  if (userId && householdId) {
    // Join personal user room and household room
    socket.join(`user_${userId}`);
    socket.join(`household_${householdId}`);

    if (!onlineHouseholdUsers[householdId]) {
      onlineHouseholdUsers[householdId] = new Set();
    }
    onlineHouseholdUsers[householdId].add(userId);

    // Broadcast online status to household
    io.to(`household_${householdId}`).emit('household_online_members', Array.from(onlineHouseholdUsers[householdId]));
  }

  // 1. Join Household manually if requested
  socket.on('join_household', () => {
    if (!householdId) return;
    socket.join(`household_${householdId}`);
    socket.join(`user_${userId}`);
  });

  // Conversation Room Handlers (for targeted conversation-level delivery)
  socket.on('join_conversation', async (data: { conversationId: string }) => {
    if (!householdId || !userId || !data?.conversationId) return;
    try {
      const isMember = await SecureMessagingService.isMemberOfConversation(
        data.conversationId,
        userId,
        householdId
      );
      if (isMember) {
        socket.join(`conversation_${data.conversationId}`);
        console.log(`[Socket.IO] User ${userId} joined conversation_${data.conversationId}`);
      }
    } catch (err) {
      console.warn(`[Socket.IO] Error joining conversation_${data.conversationId}:`, err);
    }
  });

  socket.on('leave_conversation', (data: { conversationId: string }) => {
    if (data?.conversationId) {
      socket.leave(`conversation_${data.conversationId}`);
      console.log(`[Socket.IO] User ${userId} left conversation_${data.conversationId}`);
    }
  });

  // 2. Real-time Family Text Chat (Legacy compatibility)
  socket.on('family_send_message', (payload: {
    text: string;
    senderName: string;
    senderAvatar?: string;
    recipientId?: string;
    replyTo?: any;
  }) => {
    if (!householdId || !userId) return;

    const messageData = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      senderId: userId,
      senderName: payload.senderName || 'Family Member',
      senderAvatar: payload.senderAvatar,
      text: payload.text,
      recipientId: payload.recipientId || null,
      replyTo: payload.replyTo || null,
      createdAt: new Date().toISOString(),
    };

    if (payload.recipientId) {
      io.to(`user_${payload.recipientId}`).emit('family_new_message', messageData);
      socket.emit('family_new_message', messageData);
    } else {
      io.to(`household_${householdId}`).emit('family_new_message', messageData);
    }
  });

  // 2b. End-to-End Encrypted Messaging (Ciphertext Only)
  socket.on('message:send', async (payload: {
    conversationId: string;
    clientMessageId: string;
    senderDeviceId: string;
    ciphertext: string;
    iv: string;
    ephemeralPublicKey: string;
    recipientWrappedKeys: Record<string, string>;
    aad: string;
    encryptionVersion?: string;
    attachmentMetadata?: string;
  }) => {
    if (!householdId || !userId) {
      return socket.emit('message:error', { error: 'Authentication required' });
    }

    try {
      const result = await SecureMessagingService.storeEncryptedMessage(
        userId,
        householdId,
        payload
      );

      if (!result.success || !result.message) {
        return socket.emit('message:error', {
          clientMessageId: payload.clientMessageId,
          error: result.error || 'Failed to store encrypted message',
        });
      }

      const persisted = {
        ...result.message,
        recipientWrappedKeys: payload.recipientWrappedKeys,
      };

      // 1. Confirm SENT to sender with server-assigned ID & timestamp
      socket.emit('message:sent', {
        clientMessageId: payload.clientMessageId,
        messageId: result.message.id,
        createdAt: result.message.createdAt,
      });

      // 2. Fetch conversation metadata to distinguish DIRECT vs HOUSEHOLD
      const conv = await prisma.conversation.findUnique({
        where: { id: payload.conversationId },
        select: {
          id: true,
          type: true,
          members: {
            where: { leftAt: null },
            select: { userId: true },
          },
        },
      });

      const isDirect = conv?.type === 'DIRECT';
      const convMembers = conv?.members || [];

      // a) Broadcast to the dedicated conversation room (for users currently active in this conversation)
      io.to(`conversation_${payload.conversationId}`).emit('message:new', persisted);

      // b) For DIRECT conversations: strictly emit ONLY to authorized participants' personal user rooms.
      // NEVER broadcast direct-chat messages to the general household room!
      if (isDirect) {
        for (const m of convMembers) {
          io.to(`user_${m.userId}`).emit('message:new', persisted);
        }
        console.log(`[E2EE Socket] DIRECT message emitted strictly to authorized participants (conv=${payload.conversationId}, participants=${convMembers.length})`);
      } else {
        // c) For HOUSEHOLD group conversations: broadcast to household room and individual members
        io.to(`household_${householdId}`).emit('message:new', persisted);
        for (const m of convMembers) {
          io.to(`user_${m.userId}`).emit('message:new', persisted);
        }
        console.log(`[E2EE Socket] HOUSEHOLD group message emitted (household=${householdId}, conv=${payload.conversationId})`);
      }

      // 3. Privacy-Safe Push Notification (NO PLAINTEXT, NO SECRETS!)
      DeviceTokenService.getUserTokens(userId).catch(() => {});
    } catch (err: any) {
      console.error('[E2EE Socket] Error processing message:send:', err);
      socket.emit('message:error', {
        clientMessageId: payload.clientMessageId,
        error: 'Internal server error processing message',
      });
    }
  });

  // Delivery receipt acknowledgement
  socket.on('message:delivered', async (data: { messageId: string; deviceId: string; conversationId?: string }) => {
    if (!userId || !householdId || !data.messageId) return;
    try {
      await SecureMessagingService.recordDeliveryReceipt(data.messageId, userId, data.deviceId);
      const receiptPayload = {
        messageId: data.messageId,
        userId,
        deviceId: data.deviceId,
        deliveredAt: new Date().toISOString(),
      };

      const msg = await prisma.message.findUnique({
        where: { id: data.messageId },
        select: {
          senderId: true,
          conversationId: true,
          conversation: { select: { type: true } },
        },
      });

      if (msg) {
        io.to(`conversation_${msg.conversationId}`).emit('message:delivered_receipt', receiptPayload);
        io.to(`user_${msg.senderId}`).emit('message:delivered_receipt', receiptPayload);
        // Only broadcast to household if it is a group/household conversation
        if (msg.conversation?.type !== 'DIRECT') {
          io.to(`household_${householdId}`).emit('message:delivered_receipt', receiptPayload);
        }
      } else if (data.conversationId) {
        io.to(`conversation_${data.conversationId}`).emit('message:delivered_receipt', receiptPayload);
      }
    } catch (err) {
      console.warn('[E2EE Socket] Error recording delivery receipt:', err);
    }
  });

  // Read receipt acknowledgement
  socket.on('message:read', async (data: { messageId: string; deviceId: string; conversationId?: string }) => {
    if (!userId || !householdId || !data.messageId) return;
    try {
      await SecureMessagingService.recordReadReceipt(data.messageId, userId, data.deviceId);
      const receiptPayload = {
        messageId: data.messageId,
        userId,
        deviceId: data.deviceId,
        readAt: new Date().toISOString(),
      };

      const msg = await prisma.message.findUnique({
        where: { id: data.messageId },
        select: {
          senderId: true,
          conversationId: true,
          conversation: { select: { type: true } },
        },
      });

      if (msg) {
        io.to(`conversation_${msg.conversationId}`).emit('message:read_receipt', receiptPayload);
        io.to(`user_${msg.senderId}`).emit('message:read_receipt', receiptPayload);
        // Only broadcast to household if it is a group/household conversation
        if (msg.conversation?.type !== 'DIRECT') {
          io.to(`household_${householdId}`).emit('message:read_receipt', receiptPayload);
        }
      } else if (data.conversationId) {
        io.to(`conversation_${data.conversationId}`).emit('message:read_receipt', receiptPayload);
      }
    } catch (err) {
      console.warn('[E2EE Socket] Error recording read receipt:', err);
    }
  });

  // Transient Typing Indicators
  socket.on('typing:start', async (data: { conversationId: string }) => {
    if (!householdId || !userId || !data?.conversationId) return;
    const payload = {
      conversationId: data.conversationId,
      userId,
      userName: user?.name || 'Family Member',
    };

    socket.to(`conversation_${data.conversationId}`).emit('typing:started', payload);

    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { type: true },
      });
      if (conv?.type !== 'DIRECT') {
        socket.to(`household_${householdId}`).emit('typing:started', payload);
      }
    } catch {}
  });

  socket.on('typing:stop', async (data: { conversationId: string }) => {
    if (!householdId || !userId || !data?.conversationId) return;
    const payload = {
      conversationId: data.conversationId,
      userId,
    };

    socket.to(`conversation_${data.conversationId}`).emit('typing:stopped', payload);

    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { type: true },
      });
      if (conv?.type !== 'DIRECT') {
        socket.to(`household_${householdId}`).emit('typing:stopped', payload);
      }
    } catch {}
  });

  // 3. WebRTC End-to-End P2P Signaling (Encrypted Audio/Video Calls)
  
  // Call Initiation
  socket.on('webrtc_call_user', async (data: {
    callId?: string;
    targetUserId: string;
    signalData: any;
    callType: 'audio' | 'video';
    callerName: string;
    callerAvatar?: string;
  }) => {
    if (!userId || !householdId) return;
    await webrtcSignaling.handleCallUser(io, userId, householdId, data);
  });

  // Call Answered
  socket.on('webrtc_answer_call', (data: {
    callId: string;
    targetUserId: string;
    signalData: any;
  }) => {
    if (!userId) return;
    webrtcSignaling.handleAnswerCall(io, userId, data);
  });

  // ICE Candidates Relay
  socket.on('webrtc_ice_candidate', (data: {
    callId?: string;
    targetUserId: string;
    candidate: any;
  }) => {
    if (!userId) return;
    webrtcSignaling.handleIceCandidate(io, userId, data);
  });

  // Call Ended
  socket.on('webrtc_end_call', (data: {
    callId?: string;
    targetUserId: string;
  }) => {
    if (!userId) return;
    webrtcSignaling.handleEndCall(io, userId, data);
  });

  // Call Rejected
  socket.on('webrtc_reject_call', (data: {
    callId?: string;
    targetUserId: string;
    reason?: string;
  }) => {
    if (!userId) return;
    webrtcSignaling.handleRejectCall(io, userId, data);
  });

  // Media state toggle (mic mute, camera off)
  socket.on('webrtc_toggle_media', (data: {
    callId?: string;
    targetUserId: string;
    isAudioMuted?: boolean;
    isVideoOff?: boolean;
  }) => {
    if (!userId) return;
    webrtcSignaling.handleToggleMedia(io, userId, data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    if (userId) {
      webrtcSignaling.handleDisconnect(io, userId);
    }
    if (userId && householdId && onlineHouseholdUsers[householdId]) {
      onlineHouseholdUsers[householdId].delete(userId);
      io.to(`household_${householdId}`).emit('household_online_members', Array.from(onlineHouseholdUsers[householdId]));
    }
  });
});

export const emitHouseholdAlert = (householdId: string, alert: any) => {
  io.to(`household_${householdId}`).emit('new_notification', alert);
};

// Realtime bridge for groceries, tasks, and household events
import { realtimeEmitter } from './services/realtimeGateway';
realtimeEmitter.on('grocery_updated', ({ householdId, payload }) => {
  io.to(`household_${householdId}`).emit('grocery_updated', payload);
});
realtimeEmitter.on('task_updated', ({ householdId, payload }) => {
  io.to(`household_${householdId}`).emit('task_updated', payload);
});
realtimeEmitter.on('household_updated', ({ householdId, payload }) => {
  io.to(`household_${householdId}`).emit('household_updated', payload);
});
realtimeEmitter.on('member_updated', ({ householdId, payload }) => {
  io.to(`household_${householdId}`).emit('member_updated', payload);
});



// Validate production secrets and environment hardening
import { validateProductionSecrets } from './infrastructure/security';
validateProductionSecrets();

server.listen(config.port, () => {
  console.log(`🚀 HomeMind AI Backend running on port ${config.port} [${config.nodeEnv}]`);
});

// ==========================================
// GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
// ==========================================
const handleShutdown = async (signal: string) => {
  console.log(`\n[API] Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server to stop accepting new requests
  server.close(async () => {
    console.log('[API] HTTP server closed.');

    // Disconnect Socket.IO clients
    try {
      io.close();
      console.log('[API] Socket.IO server closed.');
    } catch (err) {
      console.error('[API] Error closing Socket.IO:', err);
    }

    // Disconnect Redis and BullMQ
    try {
      const { redis } = await import('./infrastructure/redis');
      await redis.shutdown();
      const { queueService } = await import('./infrastructure/queue/queueProducer');
      await queueService.shutdown();
      console.log('[API] Redis & Queue connections closed.');
    } catch (err) {
      console.error('[API] Error closing Redis/Queue:', err);
    }

    // Disconnect Prisma
    try {
      const { prisma } = await import('./repositories/db');
      await prisma.$disconnect();
      console.log('[API] Database connection closed.');
    } catch (err) {
      console.error('[API] Error disconnecting Prisma:', err);
    }

    console.log('[API] Graceful shutdown completed. Exiting cleanly.');
    process.exit(0);

  });

  // Force shutdown after 10s if connections refuse to close
  setTimeout(() => {
    console.error('[API] Graceful shutdown timed out. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
