import { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';

const loadLayout = () => import('../layout/Layout');
const loadAuth = () => import('../../pages/Auth');
const loadAdminDashboard = () => import('../../pages/AdminDashboard');

const warmupByRole = {
  guest: [loadAuth],
  customer: [loadLayout],
  manager: [loadLayout, loadAdminDashboard],
  admin: [loadLayout, loadAdminDashboard],
};

const scheduleIdle = (callback) => {
  if (typeof window === 'undefined') return null;
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: 1500 });
  }
  return window.setTimeout(callback, 400);
};

const clearIdle = (handle) => {
  if (typeof window === 'undefined' || handle == null) return;
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
};

const canWarmRoutes = () => {
  if (typeof window === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  const effectiveType = String(connection?.effectiveType || '').toLowerCase();
  if (Number(navigator.deviceMemory || 8) <= 4) return false;
  return !effectiveType.includes('2g');
};

const preloadLoaders = (loaders = []) => {
  Array.from(new Set(loaders)).forEach((loader) => {
    loader().catch(() => {});
  });
};

const RouteWarmup = () => {
  const role = useAuthStore((state) => String(state.user?.role || '').toLowerCase());

  useEffect(() => {
    if (!canWarmRoutes()) return undefined;

    const normalizedRole = ['customer', 'manager', 'moderator', 'supervisor', 'admin'].includes(role)
      ? role
      : role === 'super_admin'
        ? 'admin'
        : 'guest';
    const warmupRole = ['manager', 'moderator', 'supervisor'].includes(normalizedRole) ? 'manager' : normalizedRole;
    const handle = scheduleIdle(() => {
      preloadLoaders(warmupByRole[warmupRole]);
    });

    return () => clearIdle(handle);
  }, [role]);

  return null;
};

export default RouteWarmup;
