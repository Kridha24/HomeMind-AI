import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_household', (householdId: string) => {
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
  console.log(`🚀 HomeMind AI Backend Server running on port ${config.port} [${config.nodeEnv}]`);
});
