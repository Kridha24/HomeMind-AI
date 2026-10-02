import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { IceConfigService } from './iceConfigService';
import { DeviceTokenService } from './deviceTokenService';
import { DeviceKeyService } from './deviceKeyService';
import { SecureMessagingService } from './secureMessagingService';

export class CommunicationController {
  /**
   * GET /api/v1/communication/ice-config
   * Returns authenticated ICE servers with ephemeral short-lived TURN credentials
   */
  public static async getIceConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const config = IceConfigService.getIceConfiguration(userId);
      return res.json(config);
    } catch (err: any) {
      console.error('[Communication] Error generating ICE config:', err);
      return res.status(500).json({ error: 'Failed to generate ICE configuration' });
    }
  }

  /**
   * POST /api/v1/communication/device-token
   * Registers an FCM push device token for Android/iOS background calling
   */
  public static async registerDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { token, platform } = req.body;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Valid device token is required' });
      }

      const validPlatform = ['android', 'ios', 'web'].includes(platform) ? platform : 'android';
      await DeviceTokenService.registerToken(userId, token, validPlatform);

      return res.status(200).json({ success: true, message: 'Device token registered' });
    } catch (err: any) {
      console.error('[Communication] Error registering device token:', err);
      return res.status(500).json({ error: 'Failed to register device token' });
    }
  }

  /**
   * DELETE /api/v1/communication/device-token
   * Unregisters a device token on logout or app uninstall
   */
  public static async unregisterDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
      }

      await DeviceTokenService.unregisterToken(userId, token);
      return res.status(200).json({ success: true, message: 'Device token unregistered' });
    } catch (err: any) {
      console.error('[Communication] Error unregistering device token:', err);
      return res.status(500).json({ error: 'Failed to unregister device token' });
    }
  }

  /**
   * POST /api/v1/communication/device-key
   * Register or update a client device's public identity key for E2EE
   */
  public static async registerDeviceKey(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { deviceId, deviceType, deviceName, publicKey } = req.body;
      if (!deviceId || !publicKey) {
        return res.status(400).json({ error: 'deviceId and publicKey are required' });
      }

      const registered = await DeviceKeyService.registerDeviceKey(userId, {
        deviceId,
        deviceType,
        deviceName,
        publicKey,
      });

      return res.status(200).json({ success: true, deviceKey: registered });
    } catch (err: any) {
      console.error('[Communication] Error registering device key:', err);
      return res.status(500).json({ error: err.message || 'Failed to register device key' });
    }
  }

  /**
   * GET /api/v1/communication/device-key
   * List all registered active devices for the authenticated user
   */
  public static async getUserDevices(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const devices = await DeviceKeyService.getUserDevices(userId);
      return res.json({ devices });
    } catch (err: any) {
      console.error('[Communication] Error getting user devices:', err);
      return res.status(500).json({ error: 'Failed to retrieve devices' });
    }
  }

  /**
   * DELETE /api/v1/communication/device-key/:deviceId
   * Revoke a registered device
   */
  public static async revokeDevice(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { deviceId } = req.params;
      const success = await DeviceKeyService.revokeDevice(userId, deviceId);
      if (!success) {
        return res.status(404).json({ error: 'Device not found or not owned by user' });
      }

      return res.json({ success: true, message: 'Device revoked' });
    } catch (err: any) {
      console.error('[Communication] Error revoking device:', err);
      return res.status(500).json({ error: 'Failed to revoke device' });
    }
  }

  /**
   * GET /api/v1/communication/conversation
   * Retrieve or create default household conversation
   */
  public static async getHouseholdConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      if (!householdId) {
        return res.status(400).json({ error: 'No active household associated with session' });
      }

      const conversation = await SecureMessagingService.getOrCreateHouseholdConversation(householdId);
      return res.json({ conversation });
    } catch (err: any) {
      console.error('[Communication] Error getting household conversation:', err);
      return res.status(500).json({ error: 'Failed to get household conversation' });
    }
  }

  /**
   * GET /api/v1/communication/conversation/:id/messages
   * Fetch paginated encrypted messages (ciphertext only)
   */
  public static async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const householdId = req.user?.householdId;
      const { id: conversationId } = req.params;
      const { limit, before } = req.query;

      if (!userId || !householdId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const messages = await SecureMessagingService.getMessages(
        conversationId,
        userId,
        householdId,
        limit ? parseInt(limit as string, 10) : 50,
        before as string | undefined
      );

      return res.json({ messages });
    } catch (err: any) {
      if (err.message?.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      console.error('[Communication] Error getting messages:', err);
      return res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  /**
   * GET /api/v1/communication/conversation/:id/recipients
   * Fetch active recipient device public keys for wrapping message CEK
   * Forward secrecy rule: Removed members are strictly excluded.
   */
  public static async getRecipientKeys(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const { id: conversationId } = req.params;
      const { excludeDeviceId } = req.query;

      if (!householdId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const devices = await DeviceKeyService.getHouseholdRecipientDevices(
        householdId,
        excludeDeviceId as string | undefined
      );

      return res.json({ devices });
    } catch (err: any) {
      console.error('[Communication] Error getting recipient keys:', err);
      return res.status(500).json({ error: 'Failed to get recipient keys' });
    }
  }
}
