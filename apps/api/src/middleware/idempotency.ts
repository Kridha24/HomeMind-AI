import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from './auth';

function canonicalizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalizeObject);
  }
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalizeObject(obj[key]);
  }
  return sorted;
}

export function computeRequestHash(method: string, path: string, householdId: string, body: any): string {
  const canonicalBody = JSON.stringify(canonicalizeObject(body || {}));
  const payload = [method.toUpperCase(), path, householdId, canonicalBody].join('::');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export interface IdempotencyOptions {
  required?: boolean;
  ttlSeconds?: number;
}

export function idempotency(options: IdempotencyOptions = {}) {
  const { required = false, ttlSeconds = 86400 } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    if (!key) {
      if (required) {
        return res.status(400).json({
          error: 'Idempotency-Key header is required for this operation.',
        });
      }
      return next();
    }

    const householdId = req.user?.householdId;
    if (!householdId) {
      return res.status(401).json({
        error: 'Authentication and household context required for idempotent operations.',
      });
    }

    const requestHash = computeRequestHash(req.method, req.baseUrl + req.path, householdId, req.body);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      const existing = await (prisma as any).idempotencyRecord.findUnique({
        where: {
          householdId_key: {
            householdId,
            key,
          },
        },
      });

      if (existing) {
        // Check if expired
        if (new Date() > new Date(existing.expiresAt)) {
          await (prisma as any).idempotencyRecord.delete({
            where: { id: existing.id },
          });
        } else {
          // Verify hash
          if (existing.requestHash !== requestHash) {
            return res.status(409).json({
              error: 'Conflict: Idempotency-Key has already been used with a different request payload.',
            });
          }

          if (existing.status === 'COMPLETED') {
            const body = existing.responseBody ? JSON.parse(existing.responseBody) : {};
            res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
            return res.status(existing.responseCode || 200).json(body);
          }

          if (existing.status === 'PENDING') {
            return res.status(409).json({
              error: 'A request with this Idempotency-Key is currently being processed. Please retry shortly.',
            });
          }
        }
      }

      // Create PENDING record
      await (prisma as any).idempotencyRecord.create({
        data: {
          householdId,
          key,
          requestHash,
          status: 'PENDING',
          expiresAt,
        },
      });

      // Hook into response completion
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        const statusCode = res.statusCode;

        // Asynchronously persist completed response
        (async () => {
          try {
            if (statusCode < 500) {
              await (prisma as any).idempotencyRecord.update({
                where: { householdId_key: { householdId, key } },
                data: {
                  status: 'COMPLETED',
                  responseCode: statusCode,
                  responseBody: JSON.stringify(body),
                },
              });
            } else {
              // Delete or mark FAILED so client can retry safely
              await (prisma as any).idempotencyRecord.delete({
                where: { householdId_key: { householdId, key } },
              });
            }
          } catch (err) {
            console.error('[Idempotency] Failed to update record:', err);
          }
        })();

        return originalJson(body);
      };

      next();
    } catch (err: any) {
      console.error('[Idempotency] Middleware error:', err.message);
      // Fallback: don't block the request if idempotency storage had a transient issue
      next();
    }
  };
}
