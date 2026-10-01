import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// ==========================================
// 1. SERVER-ONLY ENVIRONMENT SCHEMA
// ==========================================
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().optional(),
  
  // Optional integrations
  GOOGLE_CLIENT_ID: z.string().optional(),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  FAST2SMS_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerConfig(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid Server Environment Configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid Server Environment Configuration. Check .env variables.');
  }
  return result.data;
}

// ==========================================
// 2. WEB CLIENT (PUBLIC) ENVIRONMENT SCHEMA
// ==========================================
export const webEnvSchema = z.object({
  VITE_API_URL: z.string().default('http://localhost:5001/api/v1'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function getWebConfig(env: Record<string, any>): WebEnv {
  const result = webEnvSchema.safeParse(env);
  if (!result.success) {
    console.warn('⚠️ Web Client Environment Configuration Warning:', result.error.format());
  }
  return result.success ? result.data : (env as WebEnv);
}
