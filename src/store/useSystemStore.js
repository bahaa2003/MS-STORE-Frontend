import { create } from 'zustand';
import apiClient from '../services/client';
import { getDefaultWhatsAppNumber } from '../utils/whatsapp';
import { createDefaultPaymentGroups, normalizePaymentGroups } from '../utils/paymentSettings';

const isRealProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';
// Polling interval for payment settings (ms). Keep reasonable to avoid excess requests.
const PAYMENT_SETTINGS_POLL_INTERVAL = 15 * 1000;
const PAYMENT_SETTINGS_BROADCAST_CHANNEL = 'payment-settings-updates';

let currenciesRequest = null;
let paymentSettingsRequest = null;
let paymentSettingsRequestId = 0;
let paymentSettingsPollId = null;

const createInitialPaymentSettings = () => ({
  countryAccounts: [],
  instructions: '',
  whatsappNumber: isRealProvider ? '' : getDefaultWhatsAppNumber(),
  paymentGroups: isRealProvider ? [] : createDefaultPaymentGroups(),
});

const normalizeStorePaymentSettings = (settings = {}) => ({
  countryAccounts: Array.isArray(settings?.countryAccounts) ? settings.countryAccounts : [],
  instructions: settings?.instructions || '',
  whatsappNumber: settings?.whatsappNumber || (isRealProvider ? '' : getDefaultWhatsAppNumber()),
  paymentGroups: normalizePaymentGroups(settings?.paymentGroups, { fallbackToDefault: !isRealProvider }),
});

const notifyPaymentSettingsChanged = () => {
  if (typeof window === 'undefined' || !window.BroadcastChannel) return;

  try {
    const channel = new BroadcastChannel(PAYMENT_SETTINGS_BROADCAST_CHANNEL);
    channel.postMessage({ type: 'payment-settings:changed', at: Date.now() });
    channel.close();
  } catch {
    // The in-memory store has already been updated for the current tab.
  }
};

const useSystemStore = create((set, get) => ({
  currencies: [],
  isLoadingCurrencies: false,
  paymentSettings: createInitialPaymentSettings(),

  loadCurrencies: async ({ force = true } = {}) => {
    // Always fetch fresh by default; allow callers to opt-out via force=false
    if (!force && get().currencies && get().currencies.length) {
      return get().currencies;
    }

    if (currenciesRequest) return currenciesRequest;
    set({ isLoadingCurrencies: true });

    currenciesRequest = apiClient.system.currencies()
      .then((items) => {
        const nextCurrencies = Array.isArray(items) ? items : [];
        set({
          currencies: nextCurrencies,
          isLoadingCurrencies: false,
        });
        return nextCurrencies;
      })
      .catch(() => {
        set({ isLoadingCurrencies: false });
        return get().currencies;
      })
      .finally(() => {
        currenciesRequest = null;
      });

    return currenciesRequest;
  },

  addCurrency: async (payload, actor) => {
    const created = await apiClient.system.addCurrency(payload, actor);
    set((state) => ({
      currencies: [...state.currencies, created],
      currenciesLastLoadedAt: Date.now(),
    }));
    return created;
  },

  updateCurrency: async (code, updates, actor) => {
    const updated = await apiClient.system.updateCurrency(code, updates, actor);
    set((state) => ({
      currencies: state.currencies.map((item) => (item.code === code ? updated : item)),
      currenciesLastLoadedAt: Date.now(),
    }));
    return updated;
  },

  deleteCurrency: async (code, actor) => {
    await apiClient.system.deleteCurrency(code, actor);
    set((state) => ({
      currencies: state.currencies.filter((item) => item.code !== code),
      currenciesLastLoadedAt: Date.now(),
    }));
  },

  ensureDefaultCurrency: () => {
    const list = get().currencies || [];
    if (!list.length) {
      set({
        currencies: [{ code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 }],
        currenciesLastLoadedAt: Date.now(),
      });
    }
  },

  loadPaymentSettings: async ({ force = true } = {}) => {
    // By default always fetch fresh data from the API to respect server-side truth.
    if (!force && get().paymentSettings && Array.isArray(get().paymentSettings.paymentGroups) && get().paymentSettings.paymentGroups.length) {
      return get().paymentSettings;
    }

    if (!force && paymentSettingsRequest) return paymentSettingsRequest;

    const requestId = ++paymentSettingsRequestId;
    const request = apiClient.system.paymentSettings()
      .then((settings) => {
        const nextPaymentSettings = normalizeStorePaymentSettings(settings);

        if (requestId === paymentSettingsRequestId) {
          set({
            paymentSettings: nextPaymentSettings,
          });
        }

        return nextPaymentSettings;
      })
      .catch(() => {
        // On error, keep current state but return a safe default
        if (!isRealProvider) return get().paymentSettings;
        const emptyPaymentSettings = createInitialPaymentSettings();
        if (requestId === paymentSettingsRequestId) {
          set({ paymentSettings: emptyPaymentSettings });
          return emptyPaymentSettings;
        }
        return get().paymentSettings;
      })
      .finally(() => {
        if (paymentSettingsRequest === request) {
          paymentSettingsRequest = null;
        }
      });

    paymentSettingsRequest = request;
    return paymentSettingsRequest;
  },

  savePaymentSettings: async (payload, actor) => {
    const normalizedPayload = {
      ...(payload || {}),
      ...(payload?.paymentGroups !== undefined ? {
        paymentGroups: normalizePaymentGroups(payload.paymentGroups, { fallbackToDefault: false }),
      } : {}),
    };
    const saved = await apiClient.system.updatePaymentSettings(normalizedPayload, actor);
    const nextPaymentSettings = normalizeStorePaymentSettings(saved);
    paymentSettingsRequestId += 1;
    paymentSettingsRequest = null;
    set({
      paymentSettings: nextPaymentSettings,
    });
    notifyPaymentSettingsChanged();
    return nextPaymentSettings;
  },
  // Start polling payment settings periodically (keeps data fresh).
  startPaymentSettingsPolling: (interval = PAYMENT_SETTINGS_POLL_INTERVAL) => {
    if (typeof window === 'undefined') return;
    if (paymentSettingsPollId) return;
    paymentSettingsPollId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        get().loadPaymentSettings({ force: true });
      } catch (e) {
        // ignore polling errors
      }
    }, interval);
  },
  stopPaymentSettingsPolling: () => {
    if (paymentSettingsPollId) {
      window.clearInterval(paymentSettingsPollId);
      paymentSettingsPollId = null;
    }
  },
}));

export default useSystemStore;
