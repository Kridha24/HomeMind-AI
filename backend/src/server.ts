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

// ============================================================
// Socket.IO Authentication Middleware
// Every connection handshake must carry a valid Bearer access
// token in the Authorization header or as a query param.
// We reject unauthenticated sockets before they can join rooms.
// ============================================================
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
    // Attach verified user data to socket — used exclusively for room assignment.
    socket.data.user = payload;
    next();
  } catch (err) {
    return next(new Error('Authentication required: invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`[Socket.IO] Authenticated client connected: ${socket.id} (user: ${user?.userId})`);

  socket.on('join_household', () => {
    // Always use householdId from the verified JWT — never trust client-supplied IDs.
    const householdId = user?.householdId;
    if (!householdId) {
      socket.disconnect(true);
      return;
    }
    socket.join(`household_${householdId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined household_${householdId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

export const emitHouseholdAlert = (householdId: string, alert: any) => {
  io.to(`household_${householdId}`).emit('new_notification', alert);
};

server.listen(config.port, () => {
  console.log(`🚀 HomeMind AI Backend running on port ${config.port} [${config.nodeEnv}]`);
});
