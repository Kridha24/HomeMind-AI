import { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Always log full error details server-side.
  console.error('[Unhandled Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.status || err.statusCode || 500;

  // Never leak raw error messages, stack traces, or internal DB details to clients in production.
  const message = isProduction
    ? 'An unexpected error occurred. Please try again.'
    : (err.message || 'Internal Server Error');

  res.status(status).json({ error: message });
};
