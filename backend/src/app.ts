import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS: allow only the configured frontend URL — never a wildcard.
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ============================================================
// Rate Limiting
// General: 200 req / 15 min per IP
// Auth routes: 30 req / 15 min per IP (login, register, google)
// OTP request routes: 10 OTP sends / 15 min per IP
// ============================================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait before trying again.' }
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please wait 15 minutes before requesting another code.' }
});

app.use('/api', generalLimiter);

// Health check (not rate-limited tightly)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'HomeMind AI Backend', timestamp: new Date() });
});

// API Routing
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
