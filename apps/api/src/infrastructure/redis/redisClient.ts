import Redis, { RedisOptions } from 'ioredis';

export interface RedisHealthStatus {
  status: 'up' | 'down' | 'disabled';
  latencyMs?: number;
  error?: string;
}

export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private redisUrl: string | undefined;

  private constructor() {
    this.redisUrl = process.env.REDIS_URL;
    this.initClient();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private initClient(): void {
    if (!this.redisUrl) {
      console.log('[Redis] REDIS_URL not configured. Operating in resilient In-Memory Cache mode.');
      return;
    }

    try {
      const options: RedisOptions = {
        retryStrategy: (times: number) => {
          // Exponential backoff capped at 3000ms
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        connectTimeout: 5000,
        enableOfflineQueue: false, // Fail fast on cache operations instead of hanging requests
        maxRetriesPerRequest: 3,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      };

      this.client = new Redis(this.redisUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully.');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        // Log cleanly without spamming credentials
        console.warn(`[Redis] Connection warning: ${err.message}. Gracefully falling back.`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      console.warn(`[Redis] Initialization failed: ${err.message}. Operating with in-memory fallback.`);
      this.client = null;
      this.isConnected = false;
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Helper to build consistent namespaced Redis keys
   * Format: homemind:v1:{namespace}:{...parts}
   */
  public static buildCacheKey(namespace: string, ...parts: (string | number)[]): string {
    const cleanParts = parts.map((p) => String(p).trim()).filter(Boolean);
    return ['homemind:v1', namespace, ...cleanParts].join(':');
  }

  /**
   * Get cached object safely. Falls back to memory cache if Redis is down.
   */
  public async get<T>(key: string): Promise<T | null> {
    const { redisCacheHitsTotal, redisCacheMissesTotal, redisErrorsTotal } = await import('@homemind/observability');

    if (this.client && this.isConnected) {
      try {
        const raw = await this.client.get(key);
        if (raw) {
          redisCacheHitsTotal.inc({ service: 'homemind-api', domain: 'cache' });
          return JSON.parse(raw) as T;
        }
        redisCacheMissesTotal.inc({ service: 'homemind-api', domain: 'cache' });
        return null;
      } catch (err: any) {
        redisErrorsTotal.inc({ service: 'homemind-api', operation: 'get' });
        console.warn(`[Redis] Failed GET for key ${key}, checking fallback.`);
      }
    }

    // In-memory fallback
    const item = this.memoryCache.get(key);
    if (item) {
      if (Date.now() > item.expiresAt) {
        this.memoryCache.delete(key);
        redisCacheMissesTotal.inc({ service: 'homemind-api', domain: 'memory_fallback' });
        return null;
      }
      try {
        redisCacheHitsTotal.inc({ service: 'homemind-api', domain: 'memory_fallback' });
        return JSON.parse(item.value) as T;
      } catch {
        return null;
      }
    }

    redisCacheMissesTotal.inc({ service: 'homemind-api', domain: 'memory_fallback' });
    return null;
  }

  /**
   * Set cached object safely with TTL in seconds.
   */
  public async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    const serialized = JSON.stringify(value);

    // Always populate in-memory fallback
    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (this.client && this.isConnected) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } catch (err) {
        console.warn(`[Redis] Failed SET for key ${key}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Delete a cached key safely.
   */
  public async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.client && this.isConnected) {
      try {
        await this.client.del(key);
      } catch (err) {
        console.warn(`[Redis] Failed DEL for key ${key}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Invalidate keys matching a pattern (e.g. household dashboard).
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    // Clean memory cache
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    if (this.client && this.isConnected) {
      try {
        const stream = this.client.scanStream({
          match: pattern,
          count: 50,
        });

        stream.on('data', async (keys: string[]) => {
          if (keys.length && this.client) {
            const pipeline = this.client.pipeline();
            keys.forEach((k) => pipeline.del(k));
            await pipeline.exec();
          }
        });
      } catch (err) {
        console.warn(`[Redis] Failed invalidatePattern for ${pattern}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Get Redis health status safely for readiness check.
   */
  public async getHealth(): Promise<RedisHealthStatus> {
    if (!this.redisUrl) {
      return { status: 'disabled' };
    }

    if (!this.client || !this.isConnected) {
      return { status: 'down', error: 'Redis client disconnected' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latencyMs = Date.now() - start;
      return { status: 'up', latencyMs };
    } catch (err: any) {
      return { status: 'down', error: err.message };
    }
  }

  /**
   * Dedicated Redis connection options generator for BullMQ
   */
  public static getBullMQConnectionOptions(): RedisOptions {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    return {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    };
  }

  /**
   * Graceful shutdown of Redis connection.
   */
  public async shutdown(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('[Redis] Connection cleanly terminated.');
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redis = RedisService.getInstance();
export const buildCacheKey = RedisService.buildCacheKey;

/**
 * Household Dashboard Invalidation Helper
 * Called when financial or task domain events occur.
 */
export async function invalidateHouseholdDashboard(householdId: string): Promise<void> {
  const key = buildCacheKey('dashboard', householdId);
  await redis.del(key);
}
