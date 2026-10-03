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

    // Determine socket server URL matching apiClient logic
    const isDev = import.meta.env.DEV;
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname === '::1' ||
      /^192\.168\.\d+\.\d+$/.test(window.location.hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(window.location.hostname)
    );

    let socketUrl: string;
    if (isDev && isLocalhost && import.meta.env.VITE_FORCE_REMOTE_API !== 'true') {
      // Use local window.location.origin so Vite proxy forwards /socket.io -> localhost:5001
      socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
    } else {
      const configuredRemoteUrl =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        'https://homemind-ai-backend-yjk3.onrender.com/api/v1';
      socketUrl = configuredRemoteUrl.replace(/\/api\/v1\/?$/, '');
    }

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

  public updateAuthToken(newToken: string) {
    if (!newToken) return;
    if (this.socket) {
      this.socket.auth = { token: newToken };
      if (this.socket.io && (this.socket.io as any).opts) {
        (this.socket.io as any).opts.query = { token: newToken };
        if (!(this.socket.io as any).opts.extraHeaders) {
          (this.socket.io as any).opts.extraHeaders = {};
        }
        (this.socket.io as any).opts.extraHeaders.Authorization = `Bearer ${newToken}`;
      }
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }
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
