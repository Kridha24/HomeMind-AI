import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  public static async getDashboardSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const bypassCache = req.query.bypassCache === 'true';
      const summary = await DashboardService.getSummary(householdId, bypassCache);

      if (summary.cached) {
        res.setHeader('X-Cache-Lookup', 'HIT');
      } else {
        res.setHeader('X-Cache-Lookup', 'MISS');
      }

      return res.json(summary);
    } catch (err: any) {
      console.error('[DashboardController.getDashboardSummary] Error:', err.message);
      return res.status(500).json({ error: 'Failed to generate dashboard summary.' });
    }
  }
}
