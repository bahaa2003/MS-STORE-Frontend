import { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useMediaStore from '../../store/useMediaStore';
import useGroupStore from '../../store/useGroupStore';
import useAdminStore from '../../store/useAdminStore';
import useSystemStore from '../../store/useSystemStore';
import apiClient from '../../services/client';

const AUTH_FORCE_LOGOUT_EVENT = 'auth:force-logout';
const PAYMENT_SETTINGS_BROADCAST_CHANNEL = 'payment-settings-updates';

const SessionBootstrap = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const userRole = useAuthStore((state) => String(state.user?.role || '').toLowerCase());
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const logout = useAuthStore((state) => state.logout);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const loadUsers = useAdminStore((state) => state.loadUsers);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);
  const startPaymentSettingsPolling = useSystemStore((state) => state.startPaymentSettingsPolling);
  const stopPaymentSettingsPolling = useSystemStore((state) => state.stopPaymentSettingsPolling);

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

    let cancelled = false;

    const syncSession = async () => {
      try {
        await apiClient.auth.refreshSession?.();

        if (cancelled) return;

        await refreshProfile({ force: true });

        if (cancelled) return;

        await Promise.allSettled([
          loadProducts({ force: true }),
          loadPaymentSettings({ force: true }),
          userRole !== 'customer' ? loadGroups({ force: true }) : Promise.resolve(),
          userRole === 'admin' ? loadUsers({ force: true }) : Promise.resolve(),
        ]);
      } catch {
        // Non-blocking bootstrap.
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, userId, userRole, refreshProfile, loadProducts, loadPaymentSettings, loadGroups, loadUsers]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated || !token || !userId) return undefined;

    let lastSyncAt = 0;
    let syncInFlight = false;

    const syncFreshData = async () => {
      if (document.visibilityState === 'hidden' || syncInFlight) return;

      const now = Date.now();
      if (now - lastSyncAt < 30 * 1000) return;

      lastSyncAt = now;
      syncInFlight = true;

      try {
        await Promise.allSettled([
          refreshProfile({ force: true }),
          loadProducts({ force: true }),
          loadPaymentSettings({ force: true }),
          userRole !== 'customer' ? loadGroups({ force: true }) : Promise.resolve(),
          userRole === 'admin' ? loadUsers({ force: true }) : Promise.resolve(),
        ]);
      } finally {
        syncInFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncFreshData();
      }
    };

    window.addEventListener('focus', syncFreshData);
    window.addEventListener('online', syncFreshData);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(syncFreshData, 30 * 1000);

    return () => {
      window.removeEventListener('focus', syncFreshData);
      window.removeEventListener('online', syncFreshData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, token, userId, userRole, refreshProfile, loadProducts, loadPaymentSettings, loadGroups, loadUsers]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      stopPaymentSettingsPolling();
      return undefined;
    }

    startPaymentSettingsPolling();
    return () => stopPaymentSettingsPolling();
  }, [isAuthenticated, token, startPaymentSettingsPolling, stopPaymentSettingsPolling]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel || !isAuthenticated || !token) return undefined;

    const channel = new BroadcastChannel(PAYMENT_SETTINGS_BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      if (event?.data?.type === 'payment-settings:changed') {
        void loadPaymentSettings({ force: true });
      }
    };

    return () => channel.close();
  }, [isAuthenticated, token, loadPaymentSettings]);

  return null;
};

export default SessionBootstrap;
