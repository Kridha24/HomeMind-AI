import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { CopilotController } from './copilot.controller';

const router = Router();

router.use(authenticate);

router.post('/action', CopilotController.processAction);
router.post('/confirm', CopilotController.confirmAction);
router.get('/history', CopilotController.getActionHistory);

export { router as copilotRouter };
