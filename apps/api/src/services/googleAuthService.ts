/**
 * Google OAuth Authentication Service
 *
 * Verifies Google tokens cryptographically via Google's official endpoints:
 * 1. Google OAuth2 UserInfo API (https://www.googleapis.com/oauth2/v3/userinfo)
 * 2. Google TokenInfo API (https://oauth2.googleapis.com/tokeninfo)
 *
 * Supports both standard OIDC ID Tokens (JWT) and OAuth2 Access Tokens.
 */

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

function toUser(payload: {
  sub?: string;
  user_id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
  email_verified?: boolean | string;
  verified_email?: boolean | string;
}): VerifiedGoogleUser {
  const id = payload.sub || payload.user_id;
  if (!id || !payload.email) {
    throw new Error('Google token payload missing essential user claims (sub/user_id, email)');
  }
  return {
    googleId: id,
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    avatar:
      payload.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || payload.email.split('@')[0])}&background=3b82f6&color=fff`,
    emailVerified:
      payload.email_verified === 'true' ||
      payload.email_verified === true ||
      payload.verified_email === 'true' ||
      payload.verified_email === true,
  };
}

export async function verifyGoogleIdToken(rawToken: string): Promise<VerifiedGoogleUser> {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Google authentication token is required');
  }

  const token = rawToken.trim();

  // 1. If it's a 3-part JWT, try the OIDC id_token endpoint first
  const isJwt = token.split('.').length === 3;
  if (isJwt) {
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const payload = await res.json();
        return toUser(payload);
      }
    } catch (err: any) {
      console.warn('[Google Auth] JWT tokeninfo check error, falling back to userinfo:', err.message);
    }
  }

  // 2. Direct validation against Google OAuth2 UserInfo endpoint with Bearer token
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userRes.ok) {
      const profile = await userRes.json();
      return toUser(profile);
    }
  } catch (err: any) {
    console.warn('[Google Auth] Userinfo verification error:', err.message);
  }

  // 3. Fallback: query access_token tokeninfo
  try {
    const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (infoRes.ok) {
      const info = await infoRes.json();
      return toUser({
        sub: info.sub || info.user_id,
        email: info.email,
        name: info.name,
        picture: info.picture,
        email_verified: info.email_verified ?? info.verified_email,
      });
    }
  } catch (err: any) {
    console.warn('[Google Auth] Tokeninfo access_token check error:', err.message);
  }

  throw new Error('Invalid or expired Google session. Please sign in with your Google account again.');
}
