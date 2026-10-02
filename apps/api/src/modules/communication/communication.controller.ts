import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { IceConfigService } from './iceConfigService';
import { DeviceTokenService } from './deviceTokenService';

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
}
