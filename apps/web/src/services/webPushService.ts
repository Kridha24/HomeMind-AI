import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, firebaseConfig } from '../config/firebase';
import apiClient from './apiClient';

export interface DeviceInfo {
  id: string;
  platform: string;
  deviceName: string;
  browser: string;
  isActive: boolean;
  lastSeenAt: string;
  maskedToken: string;
  preferences: {
    finance: boolean;
    bills: boolean;
    tasks: boolean;
    groceries: boolean;
    family: boolean;
    security: boolean;
  };
}

export interface PermissionResult {
  success: boolean;
  permission: NotificationPermission | 'unsupported';
  token?: string;
  error?: string;
}

class WebPushService {
  private messaging: any = null;
  private messageListeners: Array<(payload: any) => void> = [];
  private isListeningForeground = false;

  /**
   * Determine device & browser metadata
   */
  public getDeviceMetadata(): {
    platform: 'web' | 'android' | 'ios';
    deviceName: string;
    browser: string;
    userAgent: string;
  } {
    if (typeof window === 'undefined') {
      return { platform: 'web', deviceName: 'Unknown', browser: 'Unknown', userAgent: '' };
    }

    const ua = navigator.userAgent;
    let browser = 'Browser';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';

    let os = 'Desktop';
    let platform: 'web' | 'android' | 'ios' = 'web';

    if (/Android/i.test(ua)) {
      os = 'Android';
      platform = 'android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      platform = 'ios';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      os = 'macOS';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    const deviceName = `${browser} on ${os}`;
    return { platform, deviceName, browser, userAgent: ua };
  }

  /**
   * Check if web push notifications are supported in this browser
   */
  public async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      return await isSupported();
    } catch {
      return false;
    }
  }

  /**
   * Get current device notification permission state
   */
  public getPermissionState(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Initialize modular Firebase messaging instance
   */
  private async initMessaging() {
    if (this.messaging) return this.messaging;
    const supported = await this.isSupported();
    if (!supported || !app) return null;

    try {
      this.messaging = getMessaging(app);
      return this.messaging;
    } catch (err) {
      console.warn('[WebPushService] getMessaging failed:', err);
      return null;
    }
  }

  /**
   * Register or acquire service worker registration
   */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

    try {
      const swParams = new URLSearchParams({
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      }).toString();

      const registration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?${swParams}`,
        { scope: '/' }
      );
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.warn('[WebPushService] ServiceWorker registration error:', err);
      return null;
    }
  }

  /**
   * Explicit user-triggered permission request
   */
  public async requestPermission(): Promise<PermissionResult> {
    const supported = await this.isSupported();
    if (!supported) {
      return {
        success: false,
        permission: 'unsupported',
        error: 'Push notifications are not supported in this browser.',
      };
    }

    if (Notification.permission === 'denied') {
      return {
        success: false,
        permission: 'denied',
        error:
          'Notification permission is blocked. Please enable notifications in your browser site permissions to receive alerts.',
      };
    }

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (err: any) {
      return {
        success: false,
        permission: 'default',
        error: `Permission prompt failed: ${err.message}`,
      };
    }

    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: 'Notification permission was not granted.',
      };
    }

    // Permission granted: obtain FCM token
    const tokenResult = await this.obtainAndRegisterToken();
    return {
      success: tokenResult.success,
      permission: 'granted',
      token: tokenResult.token,
      error: tokenResult.error,
    };
  }

  /**
   * Obtain FCM web push token and register with backend
   */
  public async obtainAndRegisterToken(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const messaging = await this.initMessaging();
      if (!messaging) {
        if (!firebaseConfig.apiKey) {
          return {
            success: false,
            error:
              'Push notification service is not configured (Firebase credentials missing in environment variables). In-app alerts, chat, and calling continue to work via live WebSockets.',
          };
        }
        return { success: false, error: 'Firebase messaging could not be initialized.' };
      }

      const swRegistration = await this.getServiceWorkerRegistration();
      if (!swRegistration) {
        return { success: false, error: 'Service worker registration failed.' };
      }

      const vapidKey =
        import.meta.env.VITE_FIREBASE_VAPID_KEY ||
        'BM-placeholder-for-dev-sandbox';

      let token: string;
      try {
        token = await getToken(messaging, {
          vapidKey: vapidKey.startsWith('BM-placeholder') ? undefined : vapidKey,
          serviceWorkerRegistration: swRegistration,
        });
      } catch (tokenErr: any) {
        console.warn('[WebPushService] getToken error:', tokenErr.message);
        // If VAPID key is missing in dev environment, produce safe simulated device token for local testing
        if (import.meta.env.DEV) {
          token = `dev_web_token_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
        } else {
          return { success: false, error: `Token acquisition failed: ${tokenErr.message}` };
        }
      }

      if (!token) {
        return { success: false, error: 'No push token returned by FCM.' };
      }

      // Register with authenticated backend
      const metadata = this.getDeviceMetadata();
      await apiClient.post('/communication/device-token', {
        token,
        platform: metadata.platform,
        deviceName: metadata.deviceName,
        browser: metadata.browser,
        userAgent: metadata.userAgent,
      });

      // Save token locally
      localStorage.setItem('hm_push_token', token);
      localStorage.setItem('hm_push_enabled', 'true');

      // Bind foreground message listener
      this.bindForegroundListener();

      return { success: true, token };
    } catch (err: any) {
      console.error('[WebPushService] Registration error:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }

  /**
   * Foreground notification listener (prevents duplicate system banner while tab is open)
   */
  public async bindForegroundListener() {
    if (this.isListeningForeground) return;
    const messaging = await this.initMessaging();
    if (!messaging) return;

    try {
      onMessage(messaging, (payload) => {
        console.log('[WebPushService] Foreground message received:', payload);
        for (const listener of this.messageListeners) {
          try {
            listener(payload);
          } catch (e) {
            console.error('[WebPushService] Listener error:', e);
          }
        }
      });
      this.isListeningForeground = true;
    } catch (err) {
      console.warn('[WebPushService] Foreground listener setup error:', err);
    }
  }

  public onForegroundMessage(callback: (payload: any) => void): () => void {
    this.messageListeners.push(callback);
    this.bindForegroundListener();
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Unregister current device push token
   */
  public async unregisterCurrentDevice(): Promise<boolean> {
    const token = localStorage.getItem('hm_push_token');
    if (!token) return true;

    try {
      await apiClient.delete('/communication/device-token', { data: { token } });
      localStorage.removeItem('hm_push_token');
      localStorage.setItem('hm_push_enabled', 'false');
      return true;
    } catch (err) {
      console.error('[WebPushService] Unregister error:', err);
      return false;
    }
  }

  /**
   * Unregister any specific device belonging to user
   */
  public async unregisterDevice(token: string): Promise<boolean> {
    try {
      await apiClient.delete('/communication/device-token', { data: { token } });
      if (localStorage.getItem('hm_push_token') === token) {
        localStorage.removeItem('hm_push_token');
        localStorage.setItem('hm_push_enabled', 'false');
      }
      return true;
    } catch (err) {
      console.error('[WebPushService] Unregister device error:', err);
      return false;
    }
  }

  /**
   * List all registered devices for the authenticated user
   */
  public async getRegisteredDevices(): Promise<DeviceInfo[]> {
    try {
      const res = await apiClient.get('/communication/devices');
      return res.data?.devices || [];
    } catch (err) {
      console.error('[WebPushService] getRegisteredDevices error:', err);
      return [];
    }
  }

  /**
   * Update notification preferences on backend
   */
  public async updatePreferences(
    preferences: Partial<DeviceInfo['preferences']>,
    deviceId?: string
  ): Promise<boolean> {
    try {
      await apiClient.put('/communication/device-preferences', { preferences, deviceId });
      return true;
    } catch (err) {
      console.error('[WebPushService] updatePreferences error:', err);
      return false;
    }
  }

  /**
   * Send a test push notification to caller's registered devices
   */
  public async sendTestNotification(): Promise<{ success: boolean; message: string; deviceCount?: number }> {
    try {
      const res = await apiClient.post('/communication/test-push');
      return {
        success: true,
        message: res.data?.message || 'Test notification sent!',
        deviceCount: res.data?.deviceCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.error || err.message || 'Failed to send test push.',
      };
    }
  }
}

export const webPushService = new WebPushService();
