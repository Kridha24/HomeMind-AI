import { Request, Response, NextFunction } from 'express';
import { logger } from '@homemind/observability';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestTimeoutMiddleware(timeoutMs = 15000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        logger.warn(`[Timeout] Request exceeded ${timeoutMs}ms limit: ${req.method} ${req.originalUrl}`, {
          requestId: req.requestId,
          durationMs: timeoutMs,
        });

        res.status(504).json({
          error: 'Gateway Timeout: Request processing exceeded allowable duration',
          timeoutMs,
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
}

export const standardTimeout = requestTimeoutMiddleware(15000);
export const aiTimeout = requestTimeoutMiddleware(30000);
