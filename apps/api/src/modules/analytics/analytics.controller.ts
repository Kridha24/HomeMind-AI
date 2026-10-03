import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriod } from './analytics.types';
import { canViewHouseholdAnalytics } from '../../utils/permissions';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/household
   * Core production household intelligence analytics endpoint
   * Restricted: Only OWNER and CO-OWNER have access to household finance analytics (Part 16)
   */
  public static async getHouseholdAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const role = req.user?.role;
      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing from session' });
      }

      if (!canViewHouseholdAnalytics(role)) {
        return res.status(403).json({ error: 'Forbidden: Only household owners and co-owners have access to household finance analytics.' });
      }

      const { period, startDate, endDate } = req.query;

      const analytics = await AnalyticsService.getHouseholdAnalytics(householdId, {
        period: period as AnalyticsPeriod | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      return res.status(200).json(analytics);
    } catch (err: any) {
      console.error('[AnalyticsController] Error getting household analytics:', err);
      return res.status(500).json({ error: 'Failed to aggregate household analytics' });
    }
  }

  /**
   * GET /api/v1/analytics/summary
   * Backwards-compatible endpoint providing both new analytics workspace contract
   * and legacy dashboard metrics.
   */
  public static async getAnalyticsSummary(req: AuthenticatedRequest, res: Response) {
    return AnalyticsController.getHouseholdAnalytics(req, res);
  }
}
