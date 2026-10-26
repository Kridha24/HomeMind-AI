import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import apiClient from './apiClient';
import { useCallStore } from '../stores/useCallStore';

/**
 * Native Android & iOS Push Notification Service via Capacitor FCM
 * Handles device registration, notification channels, foreground delivery,
 * and high-priority family call alerts.
 */
class NativePushService {
  private isInitialized = false;

  public async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[NativePush] Initializing native push notifications...');

      // 1. Create High-Priority Notification Channels for Android 8.0+ (API 26+)
      await this.createChannels();

      // 2. Check and Request Notification Permissions (Android 13+ POST_NOTIFICATIONS)
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('[NativePush] Notification permission not granted:', permStatus.receive);
        return;
      }

      // 3. Register with Google FCM via native Capacitor plugin
      await PushNotifications.register();
      this.setupListeners();
      this.isInitialized = true;
      console.log('[NativePush] Registered with FCM successfully');
    } catch (err: any) {
      console.error('[NativePush] Initialization error:', err);
    }
  }

  private async createChannels(): Promise<void> {
    try {
      // Channel: homemind_alerts (matches backend fcmProvider.ts)
      await PushNotifications.createChannel({
        id: 'homemind_alerts',
        name: 'HomeMind Alerts & Calls',
        description: 'Critical notifications, incoming family calls, and emergency alerts',
        importance: 5, // MAX: Pops on screen with sound and heads-up banner
        visibility: 1, // PUBLIC: Show on lockscreen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#3B82F6',
      });

      // Channel: calls (fallback for high-priority calls)
      await PushNotifications.createChannel({
        id: 'calls',
        name: 'Incoming Calls',
        description: 'Audio and Video calls from family members',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#10B981',
      });
    } catch (e) {
      console.warn('[NativePush] Error creating channels:', e);
    }
  }

  private setupListeners(): void {
    // 1. On successful FCM token acquisition
    PushNotifications.addListener('registration', async (token) => {
      console.log('[NativePush] FCM Token received:', token.value?.substring(0, 15) + '...');
      if (!token.value) return;

      try {
        await apiClient.post('/communication/device-token', {
          token: token.value,
          platform: 'android',
          deviceName: 'Android Mobile Device',
          browser: 'Capacitor Native App',
          userAgent: navigator.userAgent,
        });

        localStorage.setItem('hm_push_token', token.value);
        localStorage.setItem('hm_push_enabled', 'true');
        console.log('[NativePush] Device token successfully stored in HomeMind cloud database');
      } catch (err: any) {
        console.warn('[NativePush] Failed to register token with backend:', err.response?.data || err.message);
      }
    });

    // 2. On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] FCM Registration Error:', error);
    });

    // 3. Notification received while app is active or in background
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NativePush] Notification received in app:', notification);
      const data = notification.data || {};

      // If incoming call, launch call UI immediately
      if (data.type === 'INCOMING_CALL' && data.callId) {
        useCallStore.getState().receiveCall({
          callerId: data.callerId,
          callerName: data.callerName || 'Family Member',
          callerAvatar: data.callerAvatar,
          callType: data.callType || 'video',
          callId: data.callId,
          signalData: null,
        });
      }
    });

    // 4. Notification action performed (User tapped notification banner)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NativePush] Notification tapped:', action);
      const data = action.notification.data || {};

      if (data.type === 'INCOMING_CALL' && data.callId) {
        useCallStore.getState().receiveCall({
          callerId: data.callerId,
          callerName: data.callerName || 'Family Member',
          callerAvatar: data.callerAvatar,
          callType: data.callType || 'video',
          callId: data.callId,
          signalData: null,
        });
      } else if (data.click_action || data.link) {
        const dest = data.click_action || data.link;
        if (typeof window !== 'undefined' && dest.startsWith('/')) {
          window.location.href = dest;
        }
      }
    });
  }

  /**
   * Unregister token on logout
   */
  public async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const token = localStorage.getItem('hm_push_token');
      if (token) {
        await apiClient.delete('/communication/device-token', { data: { token } }).catch(() => {});
        localStorage.removeItem('hm_push_token');
        localStorage.removeItem('hm_push_enabled');
      }
    } catch {}
  }
}

export const nativePushService = new NativePushService();
