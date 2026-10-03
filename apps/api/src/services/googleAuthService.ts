import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

/**
 * Google OAuth Authentication Service
 *
 * Cryptographically verifies Google OIDC ID tokens using official Google certificates
 * via google-auth-library, checking:
 * 1. Cryptographic signature against Google's public keys
 * 2. Issuer (accounts.google.com or https://accounts.google.com)
 * 3. Audience (matches config.googleClientId)
 * 4. Expiration time (exp claim)
 *
 * Also supports OAuth2 access_token fallback with tokeninfo validation.
 */

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

export type GoogleAuthErrorCode =
  | 'GOOGLE_CREDENTIAL_MISSING'
  | 'GOOGLE_TOKEN_INVALID'
  | 'GOOGLE_AUDIENCE_MISMATCH'
  | 'GOOGLE_TOKEN_EXPIRED'
  | 'GOOGLE_ACCOUNT_UNVERIFIED'
  | 'AUTH_SERVER_UNAVAILABLE';

export class GoogleAuthError extends Error {
  code: GoogleAuthErrorCode;
  statusCode: number;

  constructor(code: GoogleAuthErrorCode, message: string, statusCode = 401) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Global OAuth2 Client configured with the backend's Google Client ID
const oauth2Client = new OAuth2Client(config.googleClientId);

export async function verifyGoogleIdToken(rawToken: string): Promise<VerifiedGoogleUser> {
  if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
    throw new GoogleAuthError('GOOGLE_CREDENTIAL_MISSING', 'Google authentication token is required');
  }

  const token = rawToken.trim();
  console.log('[AUTH:GOOGLE] credential received: YES');

  const isJwt = token.split('.').length === 3;

  // 1. Primary Flow: OIDC ID Token Verification via google-auth-library
  if (isJwt) {
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: config.googleClientId ? [config.googleClientId] : undefined,
      });

      console.log('[AUTH:GOOGLE] token verification: PASS');
      console.log('[AUTH:GOOGLE] audience match: PASS');

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Google token payload is missing essential claims');
      }

      if (payload.email_verified === false) {
        throw new GoogleAuthError('GOOGLE_ACCOUNT_UNVERIFIED', 'Google account email is not verified');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        avatar:
          payload.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || payload.email.split('@')[0])}&background=3b82f6&color=fff`,
        emailVerified: payload.email_verified === true,
      };
    } catch (err: any) {
      if (err instanceof GoogleAuthError) throw err;
      const errMsg = err?.message || '';
      console.warn('[AUTH:GOOGLE] ID token verification failure:', errMsg);

      if (errMsg.includes('Wrong recipient') || errMsg.includes('audience')) {
        throw new GoogleAuthError('GOOGLE_AUDIENCE_MISMATCH', 'Google token audience mismatch');
      }
      if (errMsg.includes('expired') || errMsg.includes('Token used too late')) {
        throw new GoogleAuthError('GOOGLE_TOKEN_EXPIRED', 'Google token has expired');
      }
      if (errMsg.includes('ENOTFOUND') || errMsg.includes('ETIMEDOUT') || errMsg.includes('ECONNREFUSED')) {
        throw new GoogleAuthError('AUTH_SERVER_UNAVAILABLE', 'Google authentication service unreachable', 503);
      }
      // If verification failed because of token format, fallback to access token check below
    }
  }

  // 2. Fallback Flow: OAuth2 Access Token Verification via TokenInfo
  try {
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    const aud = tokenInfo.aud || (tokenInfo as any).azp;

    if (config.googleClientId && aud && aud !== config.googleClientId) {
      console.warn('[AUTH:GOOGLE] Token audience mismatch detected');
      throw new GoogleAuthError('GOOGLE_AUDIENCE_MISMATCH', 'Google token audience mismatch');
    }

    if (tokenInfo.expiry_date && tokenInfo.expiry_date < Date.now()) {
      throw new GoogleAuthError('GOOGLE_TOKEN_EXPIRED', 'Google access token has expired');
    }

    if (!tokenInfo.email) {
      throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Google access token missing email claim');
    }

    if (tokenInfo.email_verified === false) {
      throw new GoogleAuthError('GOOGLE_ACCOUNT_UNVERIFIED', 'Google account email is not verified');
    }

    console.log('[AUTH:GOOGLE] token verification: PASS');
    console.log('[AUTH:GOOGLE] audience match: PASS');

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    let profile: any = {};
    if (userRes.ok) {
      profile = await userRes.json();
    }

    const sub = tokenInfo.sub || tokenInfo.user_id || profile.sub;
    if (!sub) {
      throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Unable to resolve Google user ID');
    }

    return {
      googleId: sub,
      email: tokenInfo.email,
      name: profile.name || profile.given_name || tokenInfo.email.split('@')[0],
      avatar:
        profile.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || tokenInfo.email.split('@')[0])}&background=3b82f6&color=fff`,
      emailVerified: tokenInfo.email_verified === true || profile.email_verified === true,
    };
  } catch (err: any) {
    if (err instanceof GoogleAuthError) throw err;
    console.warn('[AUTH:GOOGLE] Access token verification error:', err?.message);
    if (err?.message?.includes('ENOTFOUND') || err?.message?.includes('ETIMEDOUT') || err?.message?.includes('ECONNREFUSED')) {
      throw new GoogleAuthError('AUTH_SERVER_UNAVAILABLE', 'Google authentication service unreachable', 503);
    }
    throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Invalid Google session. Please sign in with your Google account again.');
  }
}
