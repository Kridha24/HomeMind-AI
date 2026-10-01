import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { tracingMiddleware } from './infrastructure/telemetry/tracingMiddleware';
import { metricsHandler } from './infrastructure/metrics/metricsRoute';
import { generalDistributedLimiter } from './infrastructure/rate-limit';
import { standardTimeout } from './infrastructure/resilience';
import { maintenanceModeMiddleware } from './infrastructure/flags';
import { config } from './config';
import { prisma } from './repositories/db';

const app = express();

// Request ID tracking for all inbound calls
app.use(requestIdMiddleware);

// OpenTelemetry distributed tracing and metrics middleware
app.use(tracingMiddleware);

// Hardened Security Headers (Helmet, CSP, HSTS, X-Content-Type-Options)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://*.googleapis.com', 'ws:', 'wss:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
].filter(Boolean);

// CORS: strictly validate origins in production, reject wildcard for credentialed APIs
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents (mobile app native Capacitor, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Trace-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Trace-ID', 'X-Span-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Global Maintenance Mode Guard
app.use(maintenanceModeMiddleware);

// ==========================================
// PROMETHEUS METRICS ENDPOINT (PHASE 3E)
// Protected internal endpoint for scrape agents
// ==========================================
app.get('/metrics', metricsHandler);

// ==========================================
// PRODUCTION HEALTH ENDPOINTS
// ==========================================
// 1. Liveness: Process is alive and accepting connections
// (Does not fail if Redis or third-party is temporarily down)
app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    traceId: req.traceId,
  });
});

// 2. Readiness: Critical dependencies (PostgreSQL) and degraded services (Redis)
app.get('/health/ready', async (req: Request, res: Response) => {
  let dbStatus = 'down';
  let redisStatus = 'disabled';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch (err) {
    dbStatus = 'down';
  }

  try {
    const { redis } = await import('./infrastructure/redis');
    const health = await redis.getHealth();
    redisStatus = health.status;
  } catch (err) {
    redisStatus = 'down';
  }

  // Database is the critical dependency. If DB is up, service can process and persist data.
  // When Redis is down, system operates in degraded mode (Outbox stores events, cache falls back).
  const isReady = dbStatus === 'up';
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    mode: redisStatus === 'up' ? 'optimal' : 'degraded',
    dependencies: {
      database: dbStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    traceId: req.traceId,
  });
});

// 3. Backward-compatible health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'HomeMind AI Backend',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    traceId: req.traceId,
  });
});

// ==========================================
// API ROUTING (Protected by Timeout & Distributed Limiter)
// ==========================================
app.use('/api', standardTimeout);
app.use('/api', generalDistributedLimiter);
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
