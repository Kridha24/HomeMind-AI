import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'homemind-secret-key-production-ready-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'homemind-refresh-secret-key-2026',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/homemind_db?schema=public',
};
