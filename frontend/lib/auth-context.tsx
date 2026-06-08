'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, addRefreshSubscriber } from './api';

const API = process.env.NEXT_PUBLIC_API_URL!;
const LAST_USER_KEY = 'blog_last_user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'VISITOR' | 'CREATOR';
  avatar: string | null;
  googleId: string | null;
  githubId: string | null;
  createdAt: string;
  autoDeleteTrash?: boolean;
}

/** Slim snapshot stored in localStorage — only for displaying the popup */
export interface LastUserSnapshot {
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  lastUser: LastUserSnapshot | null;   // ← for the "Continue as" popup
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setTokenFromOAuth: (token: string) => Promise<void>;
  clearLastUser: () => void;           // ← dismiss the popup permanently
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const saveLastUser = (user: User) => {
  try {
    const snapshot: LastUserSnapshot = {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
    localStorage.setItem(LAST_USER_KEY, JSON.stringify(snapshot));
  } catch { /* localStorage not available (SSR / private mode) */ }
};

const loadLastUser = (): LastUserSnapshot | null => {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const removeLastUser = () => {
  try { localStorage.removeItem(LAST_USER_KEY); } catch { /* noop */ }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [lastUser, setLastUser]       = useState<LastUserSnapshot | null>(null);

  // ── Commit a user into state + persist their snapshot ────────────────────

  const commitUser = useCallback((u: User, token: string) => {
    setAccessToken(token);
    setUser(u);
    setLastUser(null);   // hide the popup once they're logged in
    saveLastUser(u);     // update the snapshot for next visit
  }, []);

  // ── Fetch user profile with a given token ────────────────────────────────

  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.user;
    } catch {
      return null;
    }
  }, []);

  // ── On mount: silently try to restore session, then load last-user ───────

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await apiClient.post('/auth/refresh');
        const data = res.data;
        // Session restored — log in immediately (no popup needed)
        commitUser(data.user, data.accessToken);
        return;
      } catch { /* network error — treat as no session */ }

      // No active session — read the last-user snapshot to show the popup
      const snapshot = loadLastUser();
      setLastUser(snapshot);

      setLoading(false);
    };
    restoreSession();
  }, [commitUser]);

  // Subscribe to background token refreshes to keep React state in sync
  useEffect(() => {
    const unsubscribe = addRefreshSubscriber((newToken) => {
      setAccessToken(newToken);
      fetchUser(newToken).then((u) => {
        if (u) {
          setUser(u);
          saveLastUser(u);
        }
      });
    });
    return () => unsubscribe();
  }, [fetchUser]);

  // When commitUser runs (session restored), we can stop loading
  useEffect(() => {
    if (user) setLoading(false);
  }, [user]);

  // Synchronize accessToken to cookie for server-side consumption
  useEffect(() => {
    if (accessToken) {
      document.cookie = `writen_access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
    } else {
      document.cookie = `writen_access_token=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [accessToken]);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const data = res.data;
      commitUser(data.user, data.accessToken);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
    // Keep lastUser so the popup re-appears next time they visit
  };

  // ── Refresh user profile from DB ─────────────────────────────────────────

  const refreshUser = async () => {
    if (!accessToken) return;
    const updated = await fetchUser(accessToken);
    if (updated) {
      setUser(updated);
      saveLastUser(updated);
    }
  };

  // ── Called from OAuth callback page ──────────────────────────────────────

  const setTokenFromOAuth = async (token: string) => {
    const u = await fetchUser(token);
    if (u) commitUser(u, token);
  };

  // ── Dismiss the popup and forget the last user ───────────────────────────

  const clearLastUser = () => {
    removeLastUser();
    setLastUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        lastUser,
        login,
        logout,
        refreshUser,
        setTokenFromOAuth,
        clearLastUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
