import { useCallback, useEffect, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import apiClient from '../../services/client';

const AUTH_FORCE_LOGOUT_EVENT = 'auth:force-logout';
const SESSION_RECHECK_INTERVAL = 5 * 60 * 1000;

const SessionBootstrap = () => {
  const sessionRefreshRequestRef = useRef(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const logout = useAuthStore((state) => state.logout);

  const refreshSessionProfile = useCallback(({ forceProfile = false } = {}) => {
    if (sessionRefreshRequestRef.current) {
      return sessionRefreshRequestRef.current;
    }

    const request = (async () => {
      try {
        await apiClient.auth.refreshSession?.();
        return await refreshProfile({ force: forceProfile });
      } catch {
        // Non-blocking session check. Auth interceptors/force-logout events handle hard failures.
        return null;
      }
    })();

    sessionRefreshRequestRef.current = request;
    request.finally(() => {
      if (sessionRefreshRequestRef.current === request) {
        sessionRefreshRequestRef.current = null;
      }
    });

    return request;
  }, [refreshProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = (event) => {
      const reason = event?.detail?.reason;
      logout?.(reason);
    };

    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || !token || !userId) return undefined;

    void refreshSessionProfile({ forceProfile: true });

    return undefined;
  }, [isAuthenticated, token, userId, refreshSessionProfile]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated || !token || !userId) return undefined;

    let lastSyncAt = Date.now();
    let cancelled = false;

    const syncSessionIfNeeded = async ({ bypassThrottle = false } = {}) => {
      if (cancelled || document.visibilityState === 'hidden') return;

      const now = Date.now();
      if (!bypassThrottle && now - lastSyncAt < SESSION_RECHECK_INTERVAL) return;

      lastSyncAt = now;
      await refreshSessionProfile({ forceProfile: true });
    };

    const handleFocus = () => {
      void syncSessionIfNeeded();
    };

    const handleOnline = () => {
      void syncSessionIfNeeded({ bypassThrottle: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSessionIfNeeded();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token, userId, refreshSessionProfile]);

  return null;
};

export default SessionBootstrap;
