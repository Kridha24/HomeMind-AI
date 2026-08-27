import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket | null {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) return null;

    // Get socket server URL (fallback to localhost:5000 in dev or relative host)
    let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    socketUrl = socketUrl.replace(/\/api\/v1\/?$/, ''); // Strip /api/v1 prefix

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        query: { token },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to HomeMind Realtime Gateway:', this.socket?.id);
        this.socket?.emit('join_household');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      return this.socket;
    } catch (e) {
      console.error('[Socket] Init failed:', e);
      return null;
    }
  }

  public getSocket(): Socket | null {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
