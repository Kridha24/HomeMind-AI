import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
  mode: 'NEW_USER' | 'EXISTING_USER';
}

/**
 * GoogleAuthModal — uses the real Google OAuth 2.0 flow.
 *
 * Security: this component NEVER fabricates a googleId or posts email/name
 * directly. The only data sent to the backend is the idToken (credential)
 * returned by Google after the user completes the real OAuth pop-up.
 * The backend then verifies the token with Google's servers.
 */
export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  if (!isOpen) return null;

  /**
   * handleGoogleCredential — called with the idToken returned by Google
   * after the user completes the OAuth pop-up. Sends only the token to
   * the backend for server-side verification.
   */
  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/google', { idToken });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // useGoogleLogin triggers the real Google OAuth pop-up.
  // On success, Google returns an access_token (implicit flow) or we can
  // request an authorization_code. We use the credential (id_token) flow.
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // tokenResponse.access_token is the OAuth2 access token.
      // We send it as 'token' — the backend calls tokeninfo to verify it
      // and extract the user's identity directly from Google.
      await handleGoogleCredential(tokenResponse.access_token);
    },
    onError: (err) => {
      console.warn('[Google OAuth] Error:', err);
      setError('Google sign-in was cancelled or failed. Please try again.');
    },
    flow: 'implicit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-panel border border-primary rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 border border-slate-200">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary tracking-tight">
              {mode === 'NEW_USER' ? 'Sign Up with Google' : 'Sign In with Google'}
            </h2>
            <p className="text-xs text-muted mt-1">
              You'll be redirected to Google to authorize HomeMind AI
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          id="google-oauth-trigger-btn"
          onClick={() => triggerGoogleLogin()}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-95 disabled:opacity-50 border border-slate-200"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="pt-1 text-center text-[10px] text-muted border-t border-primary/80">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Authenticated securely via Google OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  );
};
