import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();

// Production Household Intelligence Analytics
router.get('/household', AnalyticsController.getHouseholdAnalytics);

// Summary endpoint (Supports both new analytics workspace & legacy callers)
router.get('/summary', AnalyticsController.getAnalyticsSummary);

export default router;
