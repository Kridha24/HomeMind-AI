import { Request, Response, NextFunction } from 'express';
import { createHash, createHmac } from 'crypto';
import { redis } from '../redis';
import { logger } from '@homemind/observability';

export interface RateLimitPolicy {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  failClosedOnRedisOutage?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  total: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSec?: number;
}

// In-memory sliding window fallback store for node-level enforcement during Redis outages
interface MemoryBucket {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryBucket>();

// Cleanup stale in-memory buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memoryStore.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 3600000); // retain 1h max
    if (bucket.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref();

/**
 * Hash sensitive identity (phone, email, password) using HMAC/SHA-256.
 * NEVER stores raw phone numbers or PII in Redis keys.
 */
export function hashIdentity(identity: string): string {
  const secret = process.env.JWT_SECRET || 'homemind_rate_limit_identity_salt';
  return createHmac('sha256', secret).update(identity.trim().toLowerCase()).digest('hex').substring(0, 32);
}

/**
 * Atomic sliding-window rate limit checker
 */
export async function checkRateLimit(
  policyName: string,
  identifier: string,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - policy.windowMs;
  const key = `homemind:v1:ratelimit:${policyName}:${identifier}`;
  const client = redis.getClient();
  const isRedisUp = redis.isRedisConnected() && client !== null;

  if (isRedisUp && client) {
    try {
      const pipeline = client.pipeline();
      // Remove timestamps outside current window
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Count remaining entries
      pipeline.zcard(key);
      // Add current timestamp with unique member
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 7)}`);
      // Set TTL to window duration in seconds + 5s buffer
      pipeline.expire(key, Math.ceil(policy.windowMs / 1000) + 5);

      const results = await pipeline.exec();
      if (results && results[1]) {
        const countBeforeAdd = (results[1][1] as number) || 0;
        const total = countBeforeAdd + 1;
        const allowed = total <= policy.max;
        const remaining = Math.max(0, policy.max - total);
        const resetTimeMs = now + policy.windowMs;

        if (!allowed) {
          // If limit exceeded, remove the element we just tentatively added
          client.zremrangebyscore(key, now, now).catch(() => {});
        }

        return {
          allowed,
          total,
          remaining,
          resetTimeMs,
          retryAfterSec: allowed ? undefined : Math.ceil(policy.windowMs / 1000),
        };
      }
    } catch (err: any) {
      logger.warn(`[RateLimiter] Redis command error: ${err.message}. Engaging outage fallback.`, {
        policy: policyName,
      });
      // Fall through to memory fallback
    }
  }

  // Fallback behavior on Redis Outage:
  // For sensitive policies (auth, otp verify), enforce local strict memory limiter
  let bucket = memoryStore.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    memoryStore.set(key, bucket);
  }

  // Filter timestamps within current window
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
  const total = bucket.timestamps.length + 1;
  const allowed = total <= policy.max;

  if (allowed) {
    bucket.timestamps.push(now);
  }

  const remaining = Math.max(0, policy.max - total);
  return {
    allowed,
    total,
    remaining,
    resetTimeMs: now + policy.windowMs,
    retryAfterSec: allowed ? undefined : Math.ceil(policy.windowMs / 1000),
  };
}

/**
 * Standard Express Middleware factory for Distributed Rate Limiting
 */
export function createDistributedRateLimiter(
  policyName: string,
  policy: RateLimitPolicy,
  identityGenerator?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let identity: string;
    if (identityGenerator) {
      identity = identityGenerator(req);
    } else {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
      identity = `ip:${createHash('sha256').update(ip).digest('hex').substring(0, 16)}`;
    }

    try {
      const result = await checkRateLimit(policyName, identity, policy);

      res.setHeader('X-RateLimit-Limit', policy.max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfterSec || 60);
        res.status(policy.statusCode || 429).json({
          error: policy.message || 'Too many requests. Please try again later.',
          retryAfterSec: result.retryAfterSec || 60,
        });
        return;
      }

      next();
    } catch (err: any) {
      logger.error(`[RateLimiter] Unexpected error: ${err.message}`, { error: err.message });
      next(); // fail open for API continuity if unexpected internal error
    }
  };
}

// ==========================================
// PRECONFIGURED RATE LIMITING POLICIES (PHASE 3G)
// ==========================================

export const generalDistributedLimiter = createDistributedRateLimiter('general', {
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests. Please try again later.',
});

export const loginDistributedLimiter = createDistributedRateLimiter(
  'login',
  {
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many login attempts. Please wait 15 minutes before retrying.',
    failClosedOnRedisOutage: true,
  },
  (req) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const email = req.body?.email ? hashIdentity(req.body.email) : 'unknown';
    return `login:${email}:${createHash('sha256').update(ip).digest('hex').substring(0, 16)}`;
  }
);

export const googleAuthDistributedLimiter = createDistributedRateLimiter('google_auth', {
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many Google sign-in attempts. Please wait a few minutes.',
});

export const transactionIngestionLimiter = createDistributedRateLimiter(
  'tx_ingest',
  {
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: 'Too many transaction ingestion requests. Please wait a few minutes.',
  },
  (req: any) => {
    if (req.user?.householdId) {
      return `household:${req.user.householdId}`;
    }
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    return `ip:${createHash('sha256').update(ip).digest('hex').substring(0, 16)}`;
  }
);

export const aiCopilotDistributedLimiter = createDistributedRateLimiter(
  'ai_copilot',
  {
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'AI query limit reached for this session. Please wait a few minutes.',
  },
  (req: any) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    return `ip:${createHash('sha256').update(ip).digest('hex').substring(0, 16)}`;
  }
);

export const sensitiveEndpointLimiter = createDistributedRateLimiter('sensitive', {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Security limit reached for sensitive operations. Please wait 15 minutes.',
  failClosedOnRedisOutage: true,
});

export const webhookDistributedLimiter = createDistributedRateLimiter('webhook', {
  windowMs: 60 * 1000,
  max: 60,
  message: 'Webhook rate limit exceeded.',
});

// ==========================================
// OTP ABUSE PROTECTION ENGINE (PHASE 3H)
// Multi-layer defense:
// - Per-IP limit (10 / 15m)
// - Per-phone limit (5 / 15m) using HMAC-hashed phone
// - 60-second cooldown between consecutive sends
// - Daily cap (20 requests / 24 hours)
// - Verify attempt limit (max 5) with 15-minute temporary lockout
// ==========================================

export async function checkOTPSendAbuse(ip: string, rawPhoneOrEmail: string): Promise<{ allowed: boolean; reason?: string }> {
  const hashedTarget = hashIdentity(rawPhoneOrEmail);
  const hashedIp = createHash('sha256').update(ip).digest('hex').substring(0, 16);

  // 1. Check IP rate limit (10 / 15 min)
  const ipCheck = await checkRateLimit('otp_send_ip', hashedIp, {
    windowMs: 15 * 60 * 1000,
    max: 10,
  });
  if (!ipCheck.allowed) {
    return { allowed: false, reason: 'Too many OTP requests from this network. Please wait 15 minutes.' };
  }

  // 2. Check Target Cooldown (60s minimum interval)
  const cooldownCheck = await checkRateLimit('otp_send_cooldown', hashedTarget, {
    windowMs: 60 * 1000,
    max: 1,
  });
  if (!cooldownCheck.allowed) {
    return { allowed: false, reason: 'Please wait 60 seconds before requesting another verification code.' };
  }

  // 3. Check Target Hourly limit (5 / 15 min)
  const targetCheck = await checkRateLimit('otp_send_target', hashedTarget, {
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  if (!targetCheck.allowed) {
    return { allowed: false, reason: 'Too many verification requests for this number/email. Please try again later.' };
  }

  // 4. Check Daily Cap (20 / 24 hours)
  const dailyCheck = await checkRateLimit('otp_send_daily', hashedTarget, {
    windowMs: 24 * 60 * 60 * 1000,
    max: 20,
  });
  if (!dailyCheck.allowed) {
    return { allowed: false, reason: 'Daily verification limit exceeded for this destination. Please try again tomorrow.' };
  }

  return { allowed: true };
}

export async function checkOTPVerifyLockout(rawPhoneOrEmail: string): Promise<{ locked: boolean; reason?: string }> {
  const hashedTarget = hashIdentity(rawPhoneOrEmail);
  // Check if target is locked out (e.g., > 5 failed attempts in 15 min)
  const check = await checkRateLimit('otp_verify_attempts', hashedTarget, {
    windowMs: 15 * 60 * 1000,
    max: 5,
  });

  if (!check.allowed) {
    return {
      locked: true,
      reason: 'Too many failed verification attempts. Verification is temporarily locked for 15 minutes.',
    };
  }

  return { locked: false };
}
