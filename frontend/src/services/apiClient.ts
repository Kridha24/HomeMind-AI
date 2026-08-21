import axios from 'axios';

// ──────────────────────────────────────────────────────────────────────────────
// API Base URL
//
// LOCAL DEV: Vite proxies /api → http://localhost:5001 (see vite.config.ts).
//   Frontend runs on :3000, backend on :5001, no CORS issues in dev.
//   Set baseURL to '/api/v1' so requests go through the proxy.
//
// PRODUCTION: Set VITE_API_URL to your backend URL (e.g. https://api.yourapp.com/api/v1).
//   Do NOT hardcode any URL here — that leaks backend location into the bundle.
// ──────────────────────────────────────────────────────────────────────────────
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1'; // Falls through to Vite proxy in development

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Silent refresh on 401 ──────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Use the same baseURL so the proxy works in dev too
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data;

        localStorage.setItem('accessToken', newAccess);
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear all auth state before redirecting
        localStorage.removeItem('user');
        localStorage.removeItem('household');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Redirect with sessionExpired flag so Login can show a clear message
        window.location.href = '/login?sessionExpired=true';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
