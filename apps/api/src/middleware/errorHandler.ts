import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

const isProduction = process.env.NODE_ENV === 'production';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId || req.id || 'unknown';

  const statusCode = err instanceof AppError
    ? err.statusCode
    : (err.status || err.statusCode || 500);

  const errorCode = err instanceof AppError
    ? err.code
    : (err.code || 'INTERNAL_SERVER_ERROR');

  const message = isProduction && statusCode === 500
    ? 'An unexpected error occurred. Please try again.'
    : (err.message || 'Internal Server Error');

  // Server-side structured log
  console.error('[API Error]', {
    requestId,
    code: errorCode,
    statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      requestId,
      ...(err.details ? { details: err.details } : {}),
    },
  });
};
