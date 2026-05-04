import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/client';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      unreadCount: 0,

      addNotification: (payload) => {
        const next = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: payload?.title || 'Notification',
          message: payload?.message || '',
          type: payload?.type || 'info',
          createdAt: new Date().toISOString(),
          read: false,
          targetUrl: payload?.targetUrl || payload?.url || payload?.link || '',
          targetType: payload?.targetType || payload?.entityType || '',
          targetId: payload?.targetId || payload?.entityId || payload?.orderId || payload?.topupId || payload?.userId || '',
          orderId: payload?.orderId || '',
          topupId: payload?.topupId || '',
          userId: payload?.userId || '',
          source: payload?.source || '',
        };

        set((state) => ({
          notifications: [next, ...state.notifications].slice(0, 30),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
          unreadCount: 0,
        }));
        void apiClient.notifications?.markAllAsRead?.().catch(() => {});
      },

      loadUnreadCount: async () => {
        try {
          const count = await apiClient.notifications?.unreadCount?.();
          const unreadCount = Number(count || 0);
          set({ unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0 });
          return get().unreadCount;
        } catch {
          const fallbackCount = get().notifications.filter((item) => !item.read).length;
          set({ unreadCount: fallbackCount });
          return fallbackCount;
        }
      },

      loadNotifications: async () => {
        set({ isLoading: true });
        try {
          const items = await apiClient.notifications?.list?.();
          if (Array.isArray(items)) {
            const nextNotifications = items.map((item) => ({
                id: item.id || item._id || `notif-${Date.now()}`,
                title: item.title || 'Notification',
                message: item.message || '',
                type: String(item.type || 'info').toLowerCase(),
                createdAt: item.createdAt || new Date().toISOString(),
                read: Boolean(item.read ?? item.isRead),
                targetUrl: item.targetUrl || item.url || item.link || '',
                targetType: item.targetType || item.entityType || item.resourceType || '',
                targetId: item.targetId || item.entityId || item.resourceId || item.orderId || item.topupId || item.userId || '',
                orderId: item.orderId || '',
                topupId: item.topupId || '',
                userId: item.userId || '',
                source: item.source || '',
              })).slice(0, 30);
            set({
              notifications: nextNotifications,
              unreadCount: nextNotifications.filter((item) => !item.read).length,
            });
          }
        } catch {
          return get().notifications;
        } finally {
          set({ isLoading: false });
        }
        return get().notifications;
      },

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((item) => (
            String(item.id) === String(id) ? { ...item, read: true } : item
          )),
          unreadCount: Math.max(0, Number(state.unreadCount || 0) - (
            state.notifications.some((item) => String(item.id) === String(id) && !item.read) ? 1 : 0
          )),
        }));
        try {
          await apiClient.notifications?.markAsRead?.(id);
        } catch {
          // Keep optimistic local state.
        }
      },

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'notifications-storage',
    }
  )
);

export default useNotificationStore;
