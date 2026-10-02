import crypto from 'crypto';
import { config } from '../../config';

export interface IceServerConfig {
  urls: string[] | string;
  username?: string;
  credential?: string;
}

export interface IceConfigResponse {
  iceServers: IceServerConfig[];
  expiresAt: string;
  turnConfigured: boolean;
}

export class IceConfigService {
  /**
   * Generates temporary, short-lived TURN REST credentials (RFC 5766 / draft-uberti-behave-turn-rest-00)
   * HMAC-SHA1 using server-side shared secret.
   * Permanent secret NEVER leaves the server.
   */
  public static generateCredentials(
    userId: string,
    secret: string,
    ttlSeconds: number
  ): { username: string; credential: string; expiresAt: string } {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiryTimestamp = nowSec + ttlSeconds;
    // Standard Coturn format: "<timestamp>:<username>"
    const username = `${expiryTimestamp}:${userId}`;
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');
    const expiresAt = new Date(expiryTimestamp * 1000).toISOString();

    return { username, credential, expiresAt };
  }

  /**
   * Builds the ICE configuration including public STUN and ephemeral TURN credentials
   */
  public static getIceConfiguration(userId: string): IceConfigResponse {
    const stunServers: IceServerConfig = {
      urls: config.stunUrls.length > 0 ? config.stunUrls : ['stun:stun.l.google.com:19302'],
    };

    const iceServers: IceServerConfig[] = [stunServers];
    const turnUrl = config.turnUrl;
    const turnSecret = config.turnSharedSecret;
    const ttlSeconds = config.turnCredentialTtlSeconds || 3600;

    let turnConfigured = false;
    let expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    if (turnUrl && turnSecret) {
      const { username, credential, expiresAt: turnExpiry } = this.generateCredentials(
        userId,
        turnSecret,
        ttlSeconds
      );

      const turnUrls = turnUrl.split(',').map((u) => u.trim()).filter(Boolean);

      iceServers.push({
        urls: turnUrls,
        username,
        credential,
      });

      turnConfigured = true;
      expiresAt = turnExpiry;
    }

    return {
      iceServers,
      expiresAt,
      turnConfigured,
    };
  }
}
