import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  category?: 'FINANCE' | 'BILLS' | 'TASKS' | 'GROCERIES' | 'FAMILY' | 'SECURITY' | 'GENERAL';
  link?: string; // Valid internal relative route like /finance or /bills
  tag?: string;
}

export interface FcmSendResult {
  token: string;
  success: boolean;
  messageId?: string;
  error?: string;
  isStaleToken?: boolean;
}

export class FcmProvider {
  private static instance: FcmProvider;
  private authClient: GoogleAuth | null = null;
  private projectId: string | null = null;
  private isConfigured: boolean = false;
  private onTokenStaleCallback?: (token: string) => Promise<void>;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): FcmProvider {
    if (!FcmProvider.instance) {
      FcmProvider.instance = new FcmProvider();
    }
    return FcmProvider.instance;
  }

  public setOnTokenStaleCallback(cb: (token: string) => Promise<void>) {
    this.onTokenStaleCallback = cb;
  }

  private initClient(): void {
    const defaultLocalKeyPath = path.resolve(__dirname, '../../../firebase-service-account.json');
    const rawServiceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || (fs.existsSync(defaultLocalKeyPath) ? defaultLocalKeyPath : undefined);
    const explicitProjectId = process.env.FIREBASE_PROJECT_ID;

    if (rawServiceKey) {
      try {
        let credentials;
        if (rawServiceKey.trim().startsWith('{')) {
          credentials = JSON.parse(rawServiceKey);
        }
        this.projectId = credentials?.project_id || explicitProjectId || null;

        this.authClient = new GoogleAuth({
          credentials: credentials || undefined,
          keyFilename: !credentials ? rawServiceKey : undefined,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.isConfigured = true;
        console.log(`[FcmProvider] Initialized FCM HTTP v1 client for project "${this.projectId || 'detected'}"`);
        return;
      } catch (err: any) {
        console.warn(`[FcmProvider] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${err.message}`);
      }
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        this.authClient = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = explicitProjectId || null;
        this.isConfigured = true;
        console.log(`[FcmProvider] Initialized FCM HTTP v1 using GOOGLE_APPLICATION_CREDENTIALS`);
        return;
      } catch (err: any) {
        console.warn(`[FcmProvider] Failed to initialize GoogleAuth credentials: ${err.message}`);
      }
    }

    // Graceful fallback for local development & test environments without active Google credentials
    this.isConfigured = false;
    this.projectId = explicitProjectId || 'homemind-dev-sandbox';
    console.log('[FcmProvider] Running in development sandbox mode (no FCM cloud credentials provided).');
  }

  /**
   * Safely mask push tokens for log outputs to prevent credential leaks
   */
  public static maskToken(token: string): string {
    if (!token) return 'null';
    if (token.length <= 10) return '***';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }

  /**
   * Validate that internal navigation link does not attempt open redirects
   */
  public static sanitizeInternalRoute(route?: string): string {
    if (!route || typeof route !== 'string') return '/';
    const trimmed = route.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
      return '/';
    }
    return trimmed;
  }

  /**
   * Send push notification to a single device token with bounded retries
   */
  public async sendPushNotification(
    token: string,
    payload: PushNotificationPayload,
    maxRetries = 2
  ): Promise<FcmSendResult> {
    const masked = FcmProvider.maskToken(token);

    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      return { token, success: false, error: 'Invalid token format', isStaleToken: true };
    }

    const safeRoute = FcmProvider.sanitizeInternalRoute(payload.link);

    // If sandbox / unconfigured mode: simulate successful dispatch without calling Google
    if (!this.isConfigured || !this.authClient) {
      console.log(
        `[FcmProvider:Sandbox] Mock FCM push dispatched to ${masked} [Category=${payload.category || 'GENERAL'} Title="${payload.title}"] Route=${safeRoute}`
      );
      return {
        token,
        success: true,
        messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      attempt++;
      try {
        const client = await this.authClient.getClient();
        const resolvedProjectId = this.projectId || (await this.authClient.getProjectId());
        const endpoint = `https://fcm.googleapis.com/v1/projects/${resolvedProjectId}/messages:send`;

        // Stringify all data values for FCM HTTP v1 spec compliance
        const safeData: Record<string, string> = {};
        if (payload.data) {
          for (const [k, v] of Object.entries(payload.data)) {
            safeData[k] = typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
        safeData['click_action'] = safeRoute;
        safeData['category'] = payload.category || 'GENERAL';

        const requestBody = {
          message: {
            token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: safeData,
            webpush: {
              headers: {
                Urgency: 'high',
              },
              notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                tag: payload.tag || 'homemind-alert',
                renotify: false,
                requireInteraction: false,
              },
              fcm_options: {
                link: safeRoute,
              },
            },
            android: {
              priority: 'high',
              notification: {
                channel_id: 'homemind_alerts',
                icon: 'ic_stat_notification',
                click_action: safeRoute,
              },
            },
          },
        };

        const res = await client.request<{ name?: string }>({
          url: endpoint,
          method: 'POST',
          data: requestBody,
        });

        const messageId = res.data?.name || `fcm-${Date.now()}`;
        return {
          token,
          success: true,
          messageId,
        };
      } catch (err: any) {
        const status = err.response?.status || err.code;
        const errDetails = err.response?.data?.error?.message || err.message || '';
        const errorCode = err.response?.data?.error?.details?.[0]?.errorCode || '';

        // Check if token is invalid or unregistered (deactivate stale token immediately)
        const isStale =
          status === 404 ||
          errDetails.includes('UNREGISTERED') ||
          errDetails.includes('Requested entity was not found') ||
          errorCode === 'UNREGISTERED' ||
          errDetails.includes('registration-token-not-registered') ||
          (status === 400 && errDetails.includes('Invalid registration token'));

        if (isStale) {
          console.warn(`[FcmProvider] Stale/unregistered token detected (${masked}): ${errDetails}`);
          if (this.onTokenStaleCallback) {
            try {
              await this.onTokenStaleCallback(token);
            } catch (cleanupErr) {
              console.warn('[FcmProvider] Stale token cleanup failed:', cleanupErr);
            }
          }
          return {
            token,
            success: false,
            error: errDetails,
            isStaleToken: true,
          };
        }

        // Bounded retry on 500, 503, 429
        const isTransient = status === 429 || status === 500 || status === 503;
        if (isTransient && attempt <= maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        console.warn(`[FcmProvider] Push delivery failed for ${masked}: ${errDetails}`);
        return {
          token,
          success: false,
          error: errDetails,
          isStaleToken: false,
        };
      }
    }

    return { token, success: false, error: 'Max retries exceeded' };
  }

  /**
   * Multicast push to an array of tokens
   */
  public async sendMulticastPush(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<FcmSendResult[]> {
    if (!tokens || tokens.length === 0) return [];

    const results: FcmSendResult[] = [];
    // Process concurrently with a pool of 10
    const concurrency = 10;
    for (let i = 0; i < tokens.length; i += concurrency) {
      const slice = tokens.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        slice.map((token) => this.sendPushNotification(token, payload))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

export const fcmProvider = FcmProvider.getInstance();
