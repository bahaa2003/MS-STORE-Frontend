import { create } from 'zustand';
import apiClient from '../services/client';

export const TARGET_PAYMENT_METHODS = [
  { id: 'Vodafone Cash', name: 'Vodafone Cash', accountLabel: 'Transfer number', accountValue: '' },
  { id: 'InstaPay', name: 'InstaPay', accountLabel: 'Transfer account', accountValue: '' },
  { id: 'Binance', name: 'Binance', accountLabel: 'Transfer ID', accountValue: '' },
];

const initialApps = [
  {
    id: 'pubg-target',
    name: 'PUBG Mobile',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80',
    unitPrice: 1.35,
    allowedPaymentMethods: ['Vodafone Cash', 'InstaPay', 'Binance'],
    paymentMethodIds: ['Vodafone Cash', 'InstaPay', 'Binance'],
    isActive: true,
  },
  {
    id: 'free-fire-target',
    name: 'Free Fire',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    unitPrice: 1.1,
    allowedPaymentMethods: ['Vodafone Cash', 'InstaPay'],
    paymentMethodIds: ['Vodafone Cash', 'InstaPay'],
    isActive: true,
  },
  {
    id: 'tiktok-target',
    name: 'TikTok Coins',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=600&q=80',
    unitPrice: 0.92,
    allowedPaymentMethods: ['InstaPay', 'Binance'],
    paymentMethodIds: ['InstaPay', 'Binance'],
    isActive: true,
  },
];

const normalizeApp = (app = {}) => {
  const allowedPaymentMethods = Array.isArray(app.allowedPaymentMethods)
    ? app.allowedPaymentMethods.map((item) => String(item || '').trim()).filter(Boolean)
    : Array.isArray(app.paymentMethodIds)
      ? app.paymentMethodIds.map((item) => String(item || '').trim()).filter(Boolean)
      : [];

  return {
    ...app,
    id: app.id || app._id,
    name: app.name || '',
    unitPrice: Number(app.unitPrice || 0),
    allowedPaymentMethods,
    paymentMethodIds: allowedPaymentMethods,
    isActive: app.isActive !== false,
  };
};

const normalizeOrder = (order = {}) => {
  const coinAmount = Number(order.coinAmount ?? order.quantity ?? order.coins ?? 0);
  const unitPrice = Number(order.unitPriceSnapshot ?? order.unitPrice ?? 0);
  return {
    ...order,
    id: order.id || order._id,
    appNameSnapshot: order.appNameSnapshot || order.productName || '',
    productName: order.appNameSnapshot || order.productName || '',
    coinAmount,
    quantity: coinAmount,
    unitPriceSnapshot: unitPrice,
    unitPrice,
    totalPrice: Number(order.totalPrice ?? (coinAmount * unitPrice)),
    paymentMethod: order.paymentMethod || order.paymentMethodName || '',
    paymentMethodName: order.paymentMethod || order.paymentMethodName || '',
    transferNumber: order.transferNumber || order.paymentAccount || '',
    paymentAccount: order.transferNumber || order.paymentAccount || '',
    senderId: order.senderId || order.transferFromId || '',
    transferFromId: order.senderId || order.transferFromId || '',
    screenshotProof: order.screenshotProof || order.proofImage || '',
    proofImage: order.screenshotProof || order.proofImage || '',
    status: String(order.status || 'PENDING').toUpperCase(),
  };
};

const toApiStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done' || normalized === 'approved') return 'APPROVED';
  if (normalized === 'rejected') return 'REJECTED';
  return 'PENDING';
};

const useTargetStore = create((set, get) => ({
  apps: initialApps,
  products: initialApps,
  requests: [],
  paymentMethods: TARGET_PAYMENT_METHODS,
  isLoading: false,
  isSubmitting: false,

  loadApps: async ({ includeInactive = false } = {}) => {
    set({ isLoading: true });
    try {
      const apps = includeInactive
        ? await apiClient.targetApps?.list?.()
        : await apiClient.targetApps?.listActive?.();
      const normalizedApps = (Array.isArray(apps) && apps.length ? apps : initialApps).map(normalizeApp);
      set({ apps: normalizedApps, products: normalizedApps });
      return normalizedApps;
    } finally {
      set({ isLoading: false });
    }
  },

  loadRequests: async (params = {}) => {
    set({ isLoading: true });
    try {
      const requests = await apiClient.targetPurchases?.list?.(params);
      const normalizedRequests = Array.isArray(requests) ? requests.map(normalizeOrder) : [];
      set({ requests: normalizedRequests });
      return normalizedRequests;
    } finally {
      set({ isLoading: false });
    }
  },

  addProduct: async (payload) => {
    const created = normalizeApp(await apiClient.targetApps.create(payload));
    set((state) => {
      const apps = [created, ...state.apps];
      return { apps, products: apps };
    });
    return created;
  },

  updateProduct: async (id, updates) => {
    const updated = normalizeApp(await apiClient.targetApps.update(id, updates));
    set((state) => {
      const apps = state.apps.map((app) => (String(app.id) === String(id) ? { ...app, ...updated } : app));
      return { apps, products: apps };
    });
    return updated;
  },

  deleteProduct: async (id) => {
    const updated = normalizeApp(await apiClient.targetApps.delete(id));
    set((state) => {
      const apps = state.apps.map((app) => (String(app.id) === String(id) ? { ...app, ...updated, isActive: false } : app));
      return { apps, products: apps };
    });
    return updated;
  },

  submitRequest: async (payload) => {
    set({ isSubmitting: true });
    try {
      const created = normalizeOrder(await apiClient.targetPurchases.create(payload));
      set((state) => ({ requests: [created, ...state.requests] }));
      return created;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateRequestStatus: async (id, status, payload = {}) => {
    const updated = normalizeOrder(await apiClient.targetPurchases.updateStatus(id, toApiStatus(status), payload));
    set((state) => ({
      requests: state.requests.map((item) => (String(item.id) === String(id) ? { ...item, ...updated } : item)),
    }));
    return updated;
  },
}));

export default useTargetStore;
