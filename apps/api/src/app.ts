import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { config } from './config';
import { prisma } from './repositories/db';

const app = express();

// Request ID tracking for all inbound calls
app.use(requestIdMiddleware);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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

// CORS: allow configured frontend, local dev servers, and verified preview domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser tools (e.g. mobile/curl)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

import { generalLimiter } from './middleware/rateLimiter';

app.use('/api', generalLimiter);

// ==========================================
// PRODUCTION HEALTH ENDPOINTS
// ==========================================
// 1. Liveness: Process is alive and accepting connections
app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// 2. Readiness: Database and Redis dependencies are verified
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

  const isReady = dbStatus === 'up'; // Redis outage operates in degraded mode, so db is primary
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    dependencies: {
      database: dbStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});


// 3. Backward-compatible health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'HomeMind AI Backend', timestamp: new Date(), requestId: req.requestId });
});

// API Routing
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
