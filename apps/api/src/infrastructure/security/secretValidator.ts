import { logger } from '@homemind/observability';

const INSECURE_DEFAULTS = new Set([
  'secret',
  'supersecret',
  'changeme',
  'development',
  'dev_secret',
  '123456',
  'password',
  'admin',
  'homemind_secret',
]);

export interface SecretValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductionSecrets(): SecretValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for production security');
    }
    if (INSECURE_DEFAULTS.has(jwtSecret.toLowerCase())) {
      errors.push('JWT_SECRET is using an insecure default dictionary value');
    }
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    if (isProduction) {
      errors.push('JWT_REFRESH_SECRET is required in production');
    } else {
      warnings.push('JWT_REFRESH_SECRET is not set; falling back to JWT_SECRET in dev');
    }
  } else {
    if (jwtRefreshSecret === jwtSecret) {
      warnings.push('JWT_REFRESH_SECRET should ideally differ from JWT_SECRET');
    }
    if (jwtRefreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  } else if (isProduction && databaseUrl.startsWith('file:')) {
    errors.push('DATABASE_URL cannot be SQLite file in production mode; PostgreSQL connection required');
  }

  if (isProduction && !process.env.REDIS_URL) {
    warnings.push('REDIS_URL is not set in production. Operating in degraded single-node cache mode.');
  }

  if (errors.length > 0 && isProduction) {
    logger.error('[Security] Production configuration validation failed with critical errors:', { errors });
    throw new Error(`Production startup aborted due to insecure secret configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
