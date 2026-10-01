import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// ============================================================
// Fail fast on missing critical secrets — never use defaults.
// The process exits here so that misconfigured deployments
// are caught at startup before accepting any traffic.
// ============================================================
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[FATAL] Missing required environment variable: ${key}. Exiting.`);
    process.exit(1);
  }
  return value;
}

// JWT secrets are mandatory in all environments — no fallbacks.
const jwtSecret = requireEnv('JWT_SECRET');
const jwtRefreshSecret = requireEnv('JWT_REFRESH_SECRET');

// In production, frontend URL and database URL must also be set.
if (isProduction) {
  requireEnv('FRONTEND_URL');
  requireEnv('DATABASE_URL');
}

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv,
  isProduction,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceSecret: process.env.AI_SERVICE_SECRET || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  databaseUrl: process.env.DATABASE_URL || '',
};
