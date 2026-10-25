import { prisma } from '../../repositories/db';
import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';
import { fcmProvider, FcmProvider } from '../../infrastructure/notifications/fcmProvider';

export interface NotificationCategoryPreferences {
  finance: boolean;
  bills: boolean;
  tasks: boolean;
  groceries: boolean;
  family: boolean;
  security: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationCategoryPreferences = {
  finance: true,
  bills: true,
  tasks: true,
  groceries: true,
  family: true,
  security: true,
};

export interface DeviceRegistrationDto {
  id?: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
  deviceName?: string;
  browser?: string;
  userAgent?: string;
  isActive?: boolean;
  preferences?: Partial<NotificationCategoryPreferences>;
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory fallback map: userId -> Map<token, DeviceRegistrationDto>
const inMemoryTokens = new Map<string, Map<string, DeviceRegistrationDto>>();

export class DeviceTokenService {
  static {
    // Automatically bind FCM stale token callback to deactivate invalid push tokens
    fcmProvider.setOnTokenStaleCallback(async (staleToken: string) => {
      await DeviceTokenService.deactivateStaleToken(staleToken);
    });
  }

  /**
   * Register or update a device push token for an authenticated user.
   * Multi-device safe: Keeps existing user devices intact.
   */
  public static async registerToken(
    userId: string,
    params: {
      token: string;
      platform?: 'android' | 'ios' | 'web';
      deviceId?: string;
      deviceName?: string;
      browser?: string;
      userAgent?: string;
      preferences?: Partial<NotificationCategoryPreferences>;
    }
  ): Promise<DeviceRegistrationDto> {
    if (!userId || !params.token) {
      throw new Error('UserId and token are required');
    }

    const platform = ['android', 'ios', 'web'].includes(params.platform || '')
      ? (params.platform as 'android' | 'ios' | 'web')
      : 'web';

    const mergedPreferences: NotificationCategoryPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(params.preferences || {}),
    };

    const registration: DeviceRegistrationDto = {
      userId,
      token: params.token,
      platform,
      deviceId: params.deviceId,
      deviceName: params.deviceName || (platform === 'web' ? 'Web Browser' : 'Mobile Device'),
      browser: params.browser || 'Browser',
      userAgent: params.userAgent,
      isActive: true,
      preferences: mergedPreferences,
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. In-memory storage update
    if (!inMemoryTokens.has(userId)) {
      inMemoryTokens.set(userId, new Map());
    }
    inMemoryTokens.get(userId)!.set(params.token, registration);

    // 2. Redis cache update (30 days TTL)
    try {
      const cacheKey = buildCacheKey('push-tokens', userId, params.token);
      await redis.set(cacheKey, JSON.stringify(registration), 30 * 24 * 3600);
    } catch {
      // Degrades gracefully
    }

    // 3. Database persistence (Prisma DeviceRegistration)
    try {
      const existing = await prisma.deviceRegistration.findUnique({
        where: { token: params.token },
      });

      if (existing) {
        // Update existing device registration
        const updated = await prisma.deviceRegistration.update({
          where: { token: params.token },
          data: {
            userId, // Re-assign if user changed
            platform,
            deviceId: params.deviceId || existing.deviceId,
            deviceName: params.deviceName || existing.deviceName,
            browser: params.browser || existing.browser,
            userAgent: params.userAgent || existing.userAgent,
            isActive: true,
            preferences: mergedPreferences as any,
            lastSeenAt: new Date(),
          },
        });
        registration.id = updated.id;
      } else {
        // Create new device registration
        const created = await prisma.deviceRegistration.create({
          data: {
            userId,
            token: params.token,
            platform,
            deviceId: params.deviceId,
            deviceName: registration.deviceName,
            browser: registration.browser,
            userAgent: params.userAgent,
            isActive: true,
            permissionStatus: 'granted',
            preferences: mergedPreferences as any,
            lastSeenAt: new Date(),
          },
        });
        registration.id = created.id;
      }
    } catch (err: any) {
      console.warn(`[DeviceTokenService] Database persistence warning: ${err.message}`);
    }

    return registration;
  }

  /**
   * Unregister / deactivate a device token for an authenticated user.
   * Cross-user security check: Cannot deactivate tokens of another user.
   */
  public static async unregisterToken(userId: string, token: string): Promise<boolean> {
    if (!userId || !token) return false;

    // 0. Cross-user security verification across registered tokens
    for (const [ownerId, tokenMap] of inMemoryTokens.entries()) {
      if (tokenMap.has(token) && ownerId !== userId) {
        console.warn(`[DeviceTokenService] Unauthorized attempt to delete token belonging to another user.`);
        return false;
      }
    }

    // 1. Remove from in-memory
    if (inMemoryTokens.has(userId)) {
      inMemoryTokens.get(userId)!.delete(token);
    }

    // 2. Remove from Redis
    try {
      const cacheKey = buildCacheKey('push-tokens', userId, token);
      await redis.del(cacheKey);
    } catch {
      // Degrades gracefully
    }

    // 3. Deactivate in Database
    try {
      const record = await prisma.deviceRegistration.findUnique({
        where: { token },
      });

      if (record) {
        if (record.userId !== userId) {
          console.warn(`[DeviceTokenService] Unauthorized attempt to delete token belonging to another user.`);
          return false;
        }
        await prisma.deviceRegistration.update({
          where: { token },
          data: { isActive: false },
        });
      }
    } catch (err: any) {
      console.warn(`[DeviceTokenService] DB unregister warning: ${err.message}`);
    }

    return true;
  }

  /**
   * Deactivate a stale/invalid token detected by FCM provider
   */
  public static async deactivateStaleToken(token: string): Promise<void> {
    if (!token) return;

    // Search in-memory and remove
    for (const [uid, userTokens] of inMemoryTokens.entries()) {
      if (userTokens.has(token)) {
        userTokens.delete(token);
        try {
          const cacheKey = buildCacheKey('push-tokens', uid, token);
          await redis.del(cacheKey);
        } catch {}
      }
    }

    // Mark inactive in DB
    try {
      await prisma.deviceRegistration.updateMany({
        where: { token },
        data: { isActive: false },
      });
      console.log(`[DeviceTokenService] Deactivated stale token: ${FcmProvider.maskToken(token)}`);
    } catch (err: any) {
      console.warn(`[DeviceTokenService] DB stale token cleanup warning: ${err.message}`);
    }
  }

  /**
   * Get all registered devices for an authenticated user (with masked tokens for UI security)
   */
  public static async getUserDevices(userId: string): Promise<
    Array<{
      id: string;
      platform: string;
      deviceName: string;
      browser: string;
      isActive: boolean;
      lastSeenAt: string;
      maskedToken: string;
      preferences: NotificationCategoryPreferences;
    }>
  > {
    if (!userId) return [];

    try {
      const dbDevices = await prisma.deviceRegistration.findMany({
        where: { userId, isActive: true },
        orderBy: { lastSeenAt: 'desc' },
      });

      if (dbDevices && dbDevices.length > 0) {
        return dbDevices.map((d) => ({
          id: d.id,
          platform: d.platform,
          deviceName: d.deviceName || 'Device',
          browser: d.browser || 'Web Browser',
          isActive: d.isActive,
          lastSeenAt: d.lastSeenAt.toISOString(),
          maskedToken: FcmProvider.maskToken(d.token),
          preferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...((d.preferences as any) || {}),
          },
        }));
      }
    } catch (err: any) {
      console.warn(`[DeviceTokenService] DB getUserDevices warning: ${err.message}`);
    }

    // Fallback to in-memory store
    const memTokens = inMemoryTokens.get(userId);
    if (memTokens) {
      return Array.from(memTokens.values())
        .filter((d) => d.isActive !== false)
        .map((d, index) => ({
          id: d.id || `mem-${index}`,
          platform: d.platform,
          deviceName: d.deviceName || 'Web Browser',
          browser: d.browser || 'Browser',
          isActive: true,
          lastSeenAt: d.lastSeenAt || new Date().toISOString(),
          maskedToken: FcmProvider.maskToken(d.token),
          preferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...(d.preferences || {}),
          },
        }));
    }

    return [];
  }

  /**
   * Update category preferences for a user's devices
   */
  public static async updatePreferences(
    userId: string,
    preferences: Partial<NotificationCategoryPreferences>,
    deviceIdOrToken?: string
  ): Promise<boolean> {
    if (!userId) return false;

    try {
      const whereClause: any = { userId };
      if (deviceIdOrToken) {
        if (deviceIdOrToken.includes('-')) {
          whereClause.id = deviceIdOrToken;
        } else {
          whereClause.token = deviceIdOrToken;
        }
      }

      const devices = await prisma.deviceRegistration.findMany({ where: whereClause });
      for (const dev of devices) {
        const currentPrefs = (dev.preferences as any) || DEFAULT_NOTIFICATION_PREFERENCES;
        const updatedPrefs = { ...currentPrefs, ...preferences };
        await prisma.deviceRegistration.update({
          where: { id: dev.id },
          data: { preferences: updatedPrefs },
        });

        // Update in-memory
        const userMem = inMemoryTokens.get(userId);
        if (userMem && userMem.has(dev.token)) {
          const item = userMem.get(dev.token)!;
          item.preferences = updatedPrefs;
        }
      }
      return true;
    } catch (err: any) {
      console.warn(`[DeviceTokenService] DB updatePreferences warning: ${err.message}`);
      return false;
    }
  }

  /**
   * Get raw active push tokens eligible for a specific category notification
   */
  public static async getActiveTokensForUser(
    userId: string,
    category?: 'FINANCE' | 'BILLS' | 'TASKS' | 'GROCERIES' | 'FAMILY' | 'SECURITY' | 'GENERAL'
  ): Promise<string[]> {
    if (!userId) return [];

    const catKey = category?.toLowerCase() as keyof NotificationCategoryPreferences | undefined;

    try {
      const dbRecords = await prisma.deviceRegistration.findMany({
        where: { userId, isActive: true },
      });

      if (dbRecords && dbRecords.length > 0) {
        return dbRecords
          .filter((d) => {
            if (!catKey || catKey === ('general' as any)) return true;
            const prefs = (d.preferences as any) || DEFAULT_NOTIFICATION_PREFERENCES;
            // Check if explicitly disabled
            if (prefs[catKey] === false) return false;
            return true;
          })
          .map((d) => d.token);
      }
    } catch (err: any) {
      console.warn(`[DeviceTokenService] DB getActiveTokens warning: ${err.message}`);
    }

    // Fallback in-memory
    const memTokens = inMemoryTokens.get(userId);
    if (memTokens) {
      return Array.from(memTokens.values())
        .filter((d) => {
          if (d.isActive === false) return false;
          if (!catKey || catKey === ('general' as any)) return true;
          const prefs = d.preferences || DEFAULT_NOTIFICATION_PREFERENCES;
          if ((prefs as any)[catKey] === false) return false;
          return true;
        })
        .map((d) => d.token);
    }

    return [];
  }

  /**
   * Legacy compatibility method
   */
  public static async getUserTokens(userId: string): Promise<DeviceRegistrationDto[]> {
    if (!userId) return [];
    try {
      const devices = await prisma.deviceRegistration.findMany({
        where: { userId, isActive: true },
      });
      if (devices.length > 0) {
        return devices.map((d) => ({
          userId: d.userId,
          token: d.token,
          platform: d.platform as any,
          updatedAt: d.updatedAt.toISOString(),
        }));
      }
    } catch {}

    const tokensMap = inMemoryTokens.get(userId);
    if (tokensMap && tokensMap.size > 0) {
      return Array.from(tokensMap.values());
    }
    return [];
  }
}
