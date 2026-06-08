import axios from 'axios';
import { apiClient } from './client';
import { addRefreshSubscriber, notifyRefreshSubscribers } from './subscribers';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

/**
 * Parses a browser cookie by name on the client side.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Sets the browser cookie for the access token.
 */
function setAccessTokenCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `writen_access_token=${token}; path=/; max-age=900; SameSite=Lax`;
}

/**
 * Clears the access token cookie.
 */
function clearAccessTokenCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `writen_access_token=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Process the queued requests that were paused during refresh.
 */
function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Setup request interceptor to inject Authorization header.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('writen_access_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Setup response interceptor to handle token refresh on 401.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Only intercept 401 Unauthorized errors that have not been retried yet
    if (response?.status === 401 && !originalRequest._retry) {
      // Avoid looping if the refresh request itself fails
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request and return a promise that resolves when the token is refreshed
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        
        // Execute refresh using a clean axios call to avoid request interceptors
        const refreshResponse = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data;

        if (accessToken) {
          setAccessTokenCookie(accessToken);
          
          // Notify any subscribers (e.g. React context) of the new token
          notifyRefreshSubscribers(accessToken);
          
          // Process queued Axios requests with the new token
          processQueue(null, accessToken);

          // Retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          isRefreshing = false;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessTokenCookie();
        isRefreshing = false;

        // Redirect to login if on client side and not already on a login/register page
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/register') {
            window.location.href = '/login?expired=true';
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
