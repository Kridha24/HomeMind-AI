import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriod } from './analytics.types';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/household
   * Core production household intelligence analytics endpoint
   * Query params: period (month | 3m | 6m | year | all | custom), startDate, endDate
   */
  public static async getHouseholdAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing from session' });
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
