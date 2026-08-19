import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'HomeMind AI Backend', timestamp: new Date() });
});

// API Routing
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
