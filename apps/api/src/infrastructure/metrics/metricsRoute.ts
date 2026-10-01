import { Request, Response } from 'express';
import { metricsRegistry } from '@homemind/observability';

export function metricsHandler(req: Request, res: Response): void {
  const configuredToken = process.env.METRICS_AUTH_TOKEN;
  const isDev = process.env.NODE_ENV !== 'production';

  // Check network loopback or local origin
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const isLoopback =
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    clientIp === 'localhost';

  // If a metrics token is configured, require it unless on loopback or explicit override
  if (configuredToken) {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const headerToken = req.headers['x-metrics-token'] as string;
    const queryToken = req.query.token as string;

    const token = bearerToken || headerToken || queryToken;

    if (token !== configuredToken && !isLoopback) {
      res.status(403).json({ error: 'Access forbidden: invalid metrics authorization token' });
      return;
    }
  } else if (!isDev && !isLoopback && process.env.METRICS_ALLOW_UNAUTHENTICATED !== 'true') {
    // In production without METRICS_AUTH_TOKEN, restrict to internal loopback only
    res.status(403).json({ error: 'Access forbidden: metrics endpoint is restricted to internal callers' });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsRegistry.getMetricsText());
}
