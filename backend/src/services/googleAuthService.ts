/**
 * Real-Time Google OAuth Token Verification Service
 * Calls the official Google OAuth2 tokeninfo endpoint to verify the token
 * signature and payload. Also validates the audience against GOOGLE_CLIENT_ID
 * to prevent token substitution attacks.
 */

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID token is required');
  }

  // Live HTTP verification via Google's official tokeninfo endpoint.
  // Note: the actual token is sent as a query parameter to Google's server;
  // it is NOT logged anywhere in this function.
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error_description || 'Invalid or expired Google OAuth ID token');
  }

  const payload = await response.json();

  if (!payload.sub || !payload.email) {
    throw new Error('Google token payload missing essential user claims (sub, email)');
  }

  // ============================================================
  // Audience validation: reject tokens not issued for our app.
  // This prevents other Google apps' tokens from authenticating
  // against HomeMind even if they pass Google's signature check.
  // ============================================================
  const configuredClientId = process.env.GOOGLE_CLIENT_ID;
  if (configuredClientId) {
    const tokenAud = payload.aud;
    const tokenAzp = payload.azp;
    if (tokenAud !== configuredClientId && tokenAzp !== configuredClientId) {
      throw new Error('Google token audience mismatch — token was not issued for this application');
    }
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    avatar: payload.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'Google User')}&background=3b82f6&color=fff`,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true
  };
}
