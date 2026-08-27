import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { verifyAccessToken } from './utils/jwt';

const server = http.createServer(app);

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
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
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
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

  // 2. Real-time Family Text Chat
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
      // 1-on-1 direct message: send to recipient and sender
      io.to(`user_${payload.recipientId}`).emit('family_new_message', messageData);
      socket.emit('family_new_message', messageData);
    } else {
      // Household group message
      io.to(`household_${householdId}`).emit('family_new_message', messageData);
    }
  });

  // 3. WebRTC End-to-End P2P Signaling (Encrypted Audio/Video Calls)
  
  // Call Initiation
  socket.on('webrtc_call_user', (data: {
    targetUserId: string;
    signalData: any;
    callType: 'audio' | 'video';
    callerName: string;
    callerAvatar?: string;
  }) => {
    if (!userId) return;
    console.log(`[WebRTC] Call from ${userId} (${data.callerName}) to ${data.targetUserId} [${data.callType}]`);
    io.to(`user_${data.targetUserId}`).emit('webrtc_incoming_call', {
      callerId: userId,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      callType: data.callType,
      signalData: data.signalData,
    });
  });

  // Call Answered
  socket.on('webrtc_answer_call', (data: {
    targetUserId: string;
    signalData: any;
  }) => {
    if (!userId) return;
    console.log(`[WebRTC] Call answered by ${userId} for ${data.targetUserId}`);
    io.to(`user_${data.targetUserId}`).emit('webrtc_call_accepted', {
      signalData: data.signalData,
      fromUserId: userId,
    });
  });

  // ICE Candidates Relay
  socket.on('webrtc_ice_candidate', (data: {
    targetUserId: string;
    candidate: any;
  }) => {
    if (!userId) return;
    io.to(`user_${data.targetUserId}`).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      fromUserId: userId,
    });
  });

  // Call Ended
  socket.on('webrtc_end_call', (data: {
    targetUserId: string;
  }) => {
    if (!userId) return;
    console.log(`[WebRTC] Call ended by ${userId} with ${data.targetUserId}`);
    io.to(`user_${data.targetUserId}`).emit('webrtc_call_ended', {
      fromUserId: userId,
    });
  });

  // Call Rejected
  socket.on('webrtc_reject_call', (data: {
    targetUserId: string;
    reason?: string;
  }) => {
    if (!userId) return;
    console.log(`[WebRTC] Call rejected by ${userId}`);
    io.to(`user_${data.targetUserId}`).emit('webrtc_call_rejected', {
      fromUserId: userId,
      reason: data.reason || 'declined',
    });
  });

  // Media state toggle (mic mute, camera off)
  socket.on('webrtc_toggle_media', (data: {
    targetUserId: string;
    isAudioMuted?: boolean;
    isVideoOff?: boolean;
  }) => {
    if (!userId) return;
    io.to(`user_${data.targetUserId}`).emit('webrtc_media_state', {
      fromUserId: userId,
      isAudioMuted: data.isAudioMuted,
      isVideoOff: data.isVideoOff,
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    if (userId && householdId && onlineHouseholdUsers[householdId]) {
      onlineHouseholdUsers[householdId].delete(userId);
      io.to(`household_${householdId}`).emit('household_online_members', Array.from(onlineHouseholdUsers[householdId]));
    }
  });
});

export const emitHouseholdAlert = (householdId: string, alert: any) => {
  io.to(`household_${householdId}`).emit('new_notification', alert);
};

server.listen(config.port, () => {
  console.log(`🚀 HomeMind AI Backend running on port ${config.port} [${config.nodeEnv}]`);
});
