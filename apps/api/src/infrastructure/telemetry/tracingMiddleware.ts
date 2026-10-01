import { Request, Response, NextFunction } from 'express';
import {
  tracer,
  Span,
  SpanStatusCode,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  httpErrorsTotal,
  logger,
} from '@homemind/observability';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      spanId?: string;
      span?: Span;
    }
  }
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract or generate W3C trace context
  const extracted = tracer.extract(req.headers);
  const span = tracer.startSpan(`HTTP ${req.method}`, {
    parent: extracted,
  });

  const traceId = span.context.traceId;
  const spanId = span.context.spanId;
  const startTime = Date.now();

  req.traceId = traceId;
  req.spanId = spanId;
  req.span = span;

  // Set response headers for correlation
  res.setHeader('X-Trace-ID', traceId);
  res.setHeader('X-Span-ID', spanId);
  if (req.requestId) {
    res.setHeader('X-Request-ID', req.requestId);
  }

  // Set safe attributes on span
  span.setAttributes({
    'http.method': req.method,
    'http.url': req.baseUrl + req.path,
    'http.target': req.originalUrl,
    'http.user_agent': req.headers['user-agent'] || 'unknown',
    'http.request_id': req.requestId,
  });

  res.on('finish', () => {
    const durationSec = (Date.now() - startTime) / 1000;
    const durationMs = Math.round(durationSec * 1000);
    const statusCode = res.statusCode;

    // Use normalized route pattern when available (req.route?.path) to prevent label explosion
    const route = req.route ? `${req.baseUrl}${req.route.path}` : (req.baseUrl + req.path) || 'unknown';

    span.setAttribute('http.status_code', statusCode);
    if (statusCode >= 400) {
      span.setStatus(SpanStatusCode.ERROR, `HTTP ${statusCode}`);
    } else {
      span.setStatus(SpanStatusCode.OK);
    }
    span.end();

    // Prometheus Metrics with strictly bounded labels (NO userId / householdId / requestId!)
    const metricLabels = {
      service: 'homemind-api',
      method: req.method,
      route,
      status_code: String(statusCode),
    };

    httpRequestsTotal.inc(metricLabels);
    httpRequestDurationSeconds.observe(durationSec, metricLabels);

    if (statusCode >= 400) {
      httpErrorsTotal.inc({
        service: 'homemind-api',
        method: req.method,
        route,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }

    // Structured logging with standard fields and correlation
    logger.info(`HTTP ${req.method} ${req.originalUrl} ${statusCode} ${durationMs}ms`, {
      service: 'homemind-api',
      method: req.method,
      route,
      statusCode,
      durationMs,
      requestId: req.requestId,
      traceId,
      spanId,
    });
  });

  next();
}
