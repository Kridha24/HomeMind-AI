import { Request, Response, NextFunction } from 'express';

export interface FeatureFlagContext {
  userId?: string;
  householdId?: string;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private overrides = new Map<string, boolean>();

  private constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  public isEnabled(flagName: string, context?: FeatureFlagContext): boolean {
    if (this.overrides.has(flagName)) {
      return this.overrides.get(flagName)!;
    }

    const envKey = `FLAG_${flagName.toUpperCase()}`;
    const envVal = process.env[envKey];
    if (envVal !== undefined) {
      return envVal === 'true' || envVal === '1';
    }

    // Default configuration for flags
    const defaults: Record<string, boolean> = {
      newSmsParser: true,
      aiCategories: true,
      newDashboard: true,
      maintenanceMode: false,
      signedStorage: true,
      circuitBreaker: true,
    };

    return defaults[flagName] ?? false;
  }

  public setOverride(flagName: string, enabled: boolean): void {
    this.overrides.set(flagName, enabled);
  }

  public clearOverride(flagName: string): void {
    this.overrides.delete(flagName);
  }
}

export const featureFlags = FeatureFlagService.getInstance();

/**
 * Maintenance Mode Middleware (Phase 4Q)
 * Gracefully returns 503 for non-GET requests when maintenance mode is engaged.
 */
export function maintenanceModeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isMaintenance = featureFlags.isEnabled('maintenanceMode');
  if (isMaintenance) {
    // Exempt health checks and metrics
    if (req.path.startsWith('/health') || req.path === '/metrics') {
      return next();
    }

    // If request is write operation (POST, PUT, DELETE, PATCH), return 503
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      res.setHeader('Retry-After', '300');
      res.status(503).json({
        error: 'System is currently undergoing scheduled maintenance. Write operations are temporarily disabled.',
        retryAfterSec: 300,
      });
      return;
    }
  }

  next();
}
