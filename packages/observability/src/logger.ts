import { randomUUID } from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  eventId?: string;
  jobId?: string;
  service?: string;
  environment?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  householdId?: string;
  [key: string]: any;
}

// ==========================================
// CENTRALIZED LOG REDACTION (PHASE 3F)
// Prevents credentials, tokens, OTPs, raw financial data,
// and private details from ever hitting application log streams.
// ==========================================
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'passwordhash',
  'otp',
  'otphash',
  'token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'apikey',
  'api_key',
  'bankaccount',
  'rawsms',
  'sms',
  'pin',
  'cvv',
  'idtoken',
  'googleid',
]);

export function sanitizeLogValue(obj: any, depth = 0): any {
  if (depth > 6 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      if (obj.startsWith('Bearer ') || /^ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/.test(obj)) {
        return '[REDACTED_TOKEN]';
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeLogValue(item, depth + 1));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('token') || lower.includes('secret')) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = sanitizeLogValue(value, depth + 1);
    } else if (typeof value === 'string' && (value.startsWith('Bearer ') || /^ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/.test(value))) {
      result[key] = '[REDACTED_TOKEN]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class StructuredLogger {
  private environment: string;

  constructor(private serviceName: string = 'homemind') {
    this.environment = process.env.NODE_ENV || 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      environment: this.environment,
      level,
      message,
      ...(context ? sanitizeLogValue(context) : {}),
    };

    const json = JSON.stringify(entry);
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (this.environment !== 'production') {
      this.log('debug', message, context);
    }
  }
}

export const logger = new StructuredLogger('homemind-api');

export function generateRequestId(): string {
  return randomUUID();
}
