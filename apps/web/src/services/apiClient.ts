import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../stores/useAuthStore';
import { socketService } from './socketService';
import { toast } from '../features/household/utils/toast';

// ──────────────────────────────────────────────────────────────────────────────
// API Base URL
//
// LOCAL DEV: Vite proxies /api → http://localhost:5001 (see vite.config.ts).
//   Frontend runs on :3000, backend on :5001, no CORS issues in dev.
//   Set baseURL to '/api/v1' so requests go through the proxy.
//
// PRODUCTION / NATIVE: Set VITE_API_URL to your backend URL (e.g. https://api.yourapp.com/api/v1).
//   On Android Capacitor or deployed web, calls go directly to the HTTPS backend.
// ──────────────────────────────────────────────────────────────────────────────
const isDev = import.meta.env.DEV;
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname === '::1' ||
  /^192\.168\.\d+\.\d+$/.test(window.location.hostname) ||
  /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(window.location.hostname)
);
const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

const configuredRemoteUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://homemind-ai-backend-yjk3.onrender.com/api/v1';

// In local browser development without remote flag, prefer Vite dev proxy.
// On Android/Capacitor or production, always use the remote HTTPS backend URL.
const API_BASE =
  (!isNative && isDev && isLocalhost && import.meta.env.VITE_FORCE_REMOTE_API !== 'true')
    ? '/api/v1'
    : configuredRemoteUrl;

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT access token and X-Request-ID to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['X-Request-ID']) {
    config.headers['X-Request-ID'] = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return config;
});

// ──────────────────────────────────────────────────────────────────────────────
// Refresh Deduplication Lock (Shared Promise)
// ──────────────────────────────────────────────────────────────────────────────
let refreshPromise: Promise<string> | null = null;
let lastNetworkToastTime = 0;

function notifyNetworkUnavailable() {
  const now = Date.now();
  if (now - lastNetworkToastTime > 8000) {
    lastNetworkToastTime = now;
    toast.error('HomeMind.AI is temporarily unavailable. Retrying...');
  }
}

function handleRealSessionExpiry() {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;
  // If already on /login, avoid infinite redirection loops
  if (window.location.pathname === '/login') return;

  // Clear credentials
  useAuthStore.getState().logout();

  // Validate internal redirect route
  const isInternal = currentPath.startsWith('/') && !currentPath.startsWith('//') && !currentPath.includes(':');
  const safeRedirect = isInternal && currentPath !== '/login' ? encodeURIComponent(currentPath) : '';
  const target = safeRedirect ? `/login?sessionExpired=true&redirect=${safeRedirect}` : '/login?sessionExpired=true';

  window.location.href = target;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isAuthEndpoint =
      url.includes('/auth/refresh') ||
      url.includes('/auth/google') ||
      url.includes('/auth/phone') ||
      url.includes('/auth/email');

    // ── Silent refresh on 401 Unauthorized ──────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        if (isDev) console.log('[AUTH] access token expired');
        if (isDev) console.log('[AUTH] starting refresh');

        refreshPromise = (async () => {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            if (isDev) console.warn('[AUTH] refresh failed: TOKEN_EXPIRED (missing)');
            throw { isAuthError: true, status: 401, message: 'NO_REFRESH_TOKEN' };
          }

          try {
            const res = await axios.post(
              `${API_BASE}/auth/refresh`,
              { refreshToken },
              {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
                timeout: 15000,
              }
            );

            const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
            if (!newAccess) {
              throw { isAuthError: true, status: 401, message: 'NO_ACCESS_TOKEN' };
            }

            // Persist tokens
            localStorage.setItem('accessToken', newAccess);
            if (newRefresh) {
              localStorage.setItem('refreshToken', newRefresh);
            }

            // Sync apiClient default header
            apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

            // Sync Zustand Auth Store without losing user/household
            useAuthStore.getState().updateTokens(newAccess, newRefresh || refreshToken);

            // Sync realtime socket with new access token
            try {
              socketService.updateAuthToken(newAccess);
            } catch {}

            // Broadcast to all other open tabs
            try {
              if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const channel = new BroadcastChannel('homemind_auth_sync');
                channel.postMessage({ type: 'TOKEN_REFRESHED', accessToken: newAccess });
                channel.close();
              }
            } catch {}

            if (isDev) console.log('[AUTH] refresh success');
            return newAccess;
          } catch (refreshErr: any) {
            const status = refreshErr.response?.status;
            const isOffline = !refreshErr.response || refreshErr.code === 'ERR_NETWORK' || refreshErr.code === 'ECONNABORTED';
            const isServerErr = status && status >= 500;

            if (isOffline || isServerErr) {
              // Server is rebooting or network dropped: DO NOT LOG OUT!
              if (isDev) console.warn('[AUTH] refresh postponed: backend temporarily unreachable');
              throw { isNetworkError: true, originalError: refreshErr };
            }

            // Genuinely invalid or revoked refresh token (401 or 403)
            if (isDev) console.warn('[AUTH] refresh failed: TOKEN_EXPIRED');
            throw { isAuthError: true, status: status || 401, originalError: refreshErr };
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshPromise;
        if (isDev) console.log('[AUTH] retrying request');
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err: any) {
        if (err?.isAuthError) {
          handleRealSessionExpiry();
        } else if (err?.isNetworkError) {
          notifyNetworkUnavailable();
        }
        return Promise.reject(err?.originalError || err);
      }
    }

    // Handle generic network failure outside refresh
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
      notifyNetworkUnavailable();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
