import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers['x-request-id'];
  const reqId = typeof incomingId === 'string' && incomingId.length <= 64 ? incomingId : randomUUID();

  req.id = reqId;
  req.requestId = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};
