import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';

export interface DeviceRegistration {
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  updatedAt: string;
}

// In-memory fallback for local development or when Redis is absent
const inMemoryTokens = new Map<string, Map<string, DeviceRegistration>>();

export class DeviceTokenService {
  /**
   * Register or update a device push token for an authenticated user
   */
  public static async registerToken(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android'
  ): Promise<boolean> {
    if (!userId || !token) return false;

    const registration: DeviceRegistration = {
      userId,
      token,
      platform,
      updatedAt: new Date().toISOString(),
    };

    // 1. In-memory storage
    if (!inMemoryTokens.has(userId)) {
      inMemoryTokens.set(userId, new Map());
    }
    inMemoryTokens.get(userId)!.set(token, registration);

    // 2. Redis distributed storage with 30-day TTL if redis is available
    try {
      const cacheKey = buildCacheKey('push-tokens', userId, token);
      await redis.set(cacheKey, JSON.stringify(registration), 30 * 24 * 3600);
    } catch {
      // Degrades gracefully to in-memory store
    }

    return true;
  }

  /**
   * Unregister / remove a device push token
   */
  public static async unregisterToken(userId: string, token: string): Promise<boolean> {
    if (!userId || !token) return false;

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

    return true;
  }

  /**
   * Get all active registered device tokens for a user
   */
  public static async getUserTokens(userId: string): Promise<DeviceRegistration[]> {
    if (!userId) return [];

    const tokensMap = inMemoryTokens.get(userId);
    if (tokensMap && tokensMap.size > 0) {
      return Array.from(tokensMap.values());
    }

    return [];
  }
}
