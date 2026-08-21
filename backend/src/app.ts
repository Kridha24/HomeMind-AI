import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

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

import { generalLimiter } from './middleware/rateLimiter';

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
