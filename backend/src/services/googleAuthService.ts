/**
 * Real-Time Google OAuth Token Verification Service
 * Calls official Google OAuth2 tokeninfo endpoint to verify token signature & payload
 */
export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  if (!idToken) {
    throw new Error('Google ID token is required');
  }

  // Live HTTP verification call to Google's official tokeninfo endpoint
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error_description || 'Invalid or expired Google OAuth ID token');
  }

  const payload = await response.json();

  if (!payload.sub || !payload.email) {
    throw new Error('Google token payload missing essential user claims');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    avatar: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'Google User')}&background=3b82f6&color=fff`,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true
  };
}
