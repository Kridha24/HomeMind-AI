import { Router } from 'express';
import { CommunicationController } from './communication.controller';
import { sensitiveEndpointLimiter } from '../../infrastructure/rate-limit';

const router = Router();

// ICE config for WebRTC STUN/TURN
router.get('/ice-config', sensitiveEndpointLimiter, CommunicationController.getIceConfig);

// Push device token management
router.post('/device-token', sensitiveEndpointLimiter, CommunicationController.registerDeviceToken);
router.delete('/device-token', sensitiveEndpointLimiter, CommunicationController.unregisterDeviceToken);

// Device identity key management (E2EE)
router.post('/device-key', sensitiveEndpointLimiter, CommunicationController.registerDeviceKey);
router.get('/device-key', CommunicationController.getUserDevices);
router.delete('/device-key/:deviceId', sensitiveEndpointLimiter, CommunicationController.revokeDevice);

// Encrypted Conversation & Messages
router.get('/conversation', CommunicationController.getHouseholdConversation);
router.get('/conversation/:id/messages', CommunicationController.getMessages);
router.get('/conversation/:id/recipients', CommunicationController.getRecipientKeys);

export default router;
