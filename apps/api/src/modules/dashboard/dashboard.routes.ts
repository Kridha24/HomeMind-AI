import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get('/summary', DashboardController.getDashboardSummary);

export default router;
