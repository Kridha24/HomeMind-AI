/**
 * Verifies a Google sign-in credential with Google's servers.
 * Accepts:
 *  - OpenID Connect ID token (JWT, 3 segments) via tokeninfo?id_token=
 *  - OAuth 2.0 access token (from the Google account-picker popup) via
 *    tokeninfo?access_token= + userinfo
 *
 * Never trusts client-supplied email / googleId.
 */

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

function assertAudience(payload: { aud?: string; azp?: string }) {
  const configuredClientId = process.env.GOOGLE_CLIENT_ID;
  if (!configuredClientId) return;
  if (payload.aud !== configuredClientId && payload.azp !== configuredClientId) {
    throw new Error('Google token audience mismatch — token was not issued for this application');
  }
}

function toUser(payload: {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
  email_verified?: boolean | string;
}): VerifiedGoogleUser {
  if (!payload.sub || !payload.email) {
    throw new Error('Google token payload missing essential user claims (sub, email)');
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    avatar:
      payload.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'Google User')}&background=3b82f6&color=fff`,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
  };
}

async function verifyJwtIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error_description || 'Invalid or expired Google ID token');
  }
  const payload = await response.json();
  assertAudience(payload);
  return toUser(payload);
}

async function verifyAccessToken(accessToken: string): Promise<VerifiedGoogleUser> {
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!infoRes.ok) {
    throw new Error('Invalid or expired Google access token');
  }
  const info = await infoRes.json();
  assertAudience(info);

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    if (info.sub && info.email) return toUser(info);
    throw new Error('Could not load Google account profile');
  }
  const profile = await userRes.json();
  return toUser({
    sub: profile.sub || info.sub,
    email: profile.email || info.email,
    name: profile.name || info.name,
    given_name: profile.given_name,
    picture: profile.picture || info.picture,
    email_verified: profile.email_verified ?? info.email_verified,
  });
}

export async function verifyGoogleIdToken(rawToken: string): Promise<VerifiedGoogleUser> {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Google ID token is required');
  }

  const isJwt = rawToken.split('.').length === 3;
  if (isJwt) {
    try {
      return await verifyJwtIdToken(rawToken);
    } catch (jwtErr) {
      // Some clients send an access token that happens to contain dots; try access_token next.
      try {
        return await verifyAccessToken(rawToken);
      } catch {
        throw jwtErr;
      }
    }
  }

  return verifyAccessToken(rawToken);
}
