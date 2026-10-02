import { Router } from 'express';
import { CommunicationController } from './communication.controller';
import { sensitiveEndpointLimiter } from '../../infrastructure/rate-limit';

const router = Router();

// GET /api/v1/communication/ice-config
router.get('/ice-config', sensitiveEndpointLimiter, CommunicationController.getIceConfig);

// POST & DELETE /api/v1/communication/device-token
router.post('/device-token', sensitiveEndpointLimiter, CommunicationController.registerDeviceToken);
router.delete('/device-token', sensitiveEndpointLimiter, CommunicationController.unregisterDeviceToken);

export default router;
