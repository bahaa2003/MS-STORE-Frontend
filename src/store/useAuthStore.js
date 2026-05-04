import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAdminStore from './useAdminStore';
import apiClient from '../services/client';
import {
  getAccountAccessRoute,
  inferBlockedStatusFromError,
  isApprovedAccountStatus,
  normalizeAccountStatus,
} from '../utils/accountStatus';
import { getDefaultRouteForRole } from '../utils/authRoles';
import { formatAuthErrorMessage } from '../utils/authErrorMessages';
import { devLogger } from '../utils/devLogger';

const PROFILE_CACHE_TTL = 60 * 1000;
let profileRefreshRequest = null;

const buildAuthOutcome = (user) => {
  const status = normalizeAccountStatus(user?.status);
  return {
    ok: true,
    status,
    user: user || null,
    redirectTo: getAccountAccessRoute(status) || getDefaultRouteForRole(user?.role),
    canAccessApp: isApprovedAccountStatus(status),
  };
};

const buildBlockedOutcome = (status, user = null, error = null) => ({
  ok: false,
  status: normalizeAccountStatus(status),
  user,
  error,
  redirectTo: getAccountAccessRoute(status),
  canAccessApp: false,
});

const buildVerificationRequiredOutcome = (user = null) => ({
  ok: true,
  status: normalizeAccountStatus('verification_required'),
  user,
  error: null,
  redirectTo: getAccountAccessRoute('verification_required'),
  canAccessApp: false,
});

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      blockedStatus: null,
      blockedUser: null,
      profileLastLoadedAt: 0,

      setBlockedAccess: (status, user = null) => {
        const normalizedStatus = normalizeAccountStatus(status);
        set({
          blockedStatus: normalizedStatus,
          blockedUser: user || null,
        });
        return buildBlockedOutcome(normalizedStatus, user);
      },

      clearBlockedAccess: () => {
        set({ blockedStatus: null, blockedUser: null });
      },

      login: async (email, password) => {
        set({
          isLoading: true,
          error: null,
          blockedStatus: null,
          blockedUser: null,
        });
        try {
          const response = await apiClient.auth.login(email, password);
          if (response?.requires2FA) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              blockedStatus: null,
              blockedUser: null,
              profileLastLoadedAt: 0,
            });
            return {
              ok: true,
              requires2FA: true,
              tempToken: response.tempToken || response.twoFactorToken,
              twoFactorToken: response.tempToken || response.twoFactorToken,
              user: response.user || null,
              canAccessApp: false,
            };
          }
          const outcome = buildAuthOutcome(response.user);

          set({
            user: response.user,
            token: response.token || null,
            isAuthenticated: true,
            isLoading: false,
            blockedStatus: outcome.canAccessApp ? null : outcome.status,
            blockedUser: outcome.canAccessApp ? null : response.user,
            profileLastLoadedAt: Date.now(),
          });

          return outcome;
        } catch (err) {
          const blockedStatus = inferBlockedStatusFromError(err);
          const formattedError = formatAuthErrorMessage(err, { action: 'login' });
          if (blockedStatus) {
            const blockedUser = email ? { email } : null;
            set({
              user: null,
              token: null,
              error: formattedError,
              isLoading: false,
              blockedStatus,
              blockedUser,
              isAuthenticated: false,
              profileLastLoadedAt: 0,
            });
            return buildBlockedOutcome(blockedStatus, blockedUser, formattedError);
          }

          set({
            user: null,
            token: null,
            error: formattedError,
            isLoading: false,
            isAuthenticated: false,
            blockedStatus: null,
            blockedUser: null,
            profileLastLoadedAt: 0,
          });
          return { ok: false, error: formattedError };
        }
      },

      verifyTwoFactor: async ({ tempToken, twoFactorToken, code }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.auth.verifyTwoFactor({
            tempToken: tempToken || twoFactorToken,
            twoFactorToken: tempToken || twoFactorToken,
            code,
          });
          const outcome = buildAuthOutcome(response.user);
          set({
            user: response.user,
            token: response.token || null,
            isAuthenticated: true,
            isLoading: false,
            blockedStatus: outcome.canAccessApp ? null : outcome.status,
            blockedUser: outcome.canAccessApp ? null : response.user,
            profileLastLoadedAt: Date.now(),
          });
          return outcome;
        } catch (err) {
          const formattedError = formatAuthErrorMessage(err, { action: 'login' });
          set({ error: formattedError, isLoading: false, isAuthenticated: false });
          return { ok: false, error: formattedError };
        }
      },

      loginWithGoogle: async () => {
        set({
          isLoading: true,
          error: null,
          blockedStatus: null,
          blockedUser: null,
        });
        try {
          const response = await apiClient.auth.loginWithGoogle();
          if (response?.redirectTo && !response?.user && !response?.token) {
            const callbackStatus = normalizeAccountStatus(response?.status);

            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              blockedStatus: callbackStatus || null,
              blockedUser: null,
              profileLastLoadedAt: 0,
            });

            return {
              ok: false,
              status: callbackStatus,
              user: null,
              error: null,
              redirectTo: response.redirectTo,
              canAccessApp: false,
            };
          }

          const outcome = buildAuthOutcome(response.user);

          set({
            user: response.user,
            token: response.token || null,
            isAuthenticated: true,
            isLoading: false,
            blockedStatus: outcome.canAccessApp ? null : outcome.status,
            blockedUser: outcome.canAccessApp ? null : response.user,
            profileLastLoadedAt: Date.now(),
          });

          await useAdminStore.getState().loadUsers({ force: true });
          return outcome;
        } catch (err) {
          const blockedStatus = inferBlockedStatusFromError(err);
          const formattedError = formatAuthErrorMessage(err, { action: 'google' });
          if (blockedStatus) {
            set({
              user: null,
              token: null,
              error: formattedError,
              isLoading: false,
              blockedStatus,
              blockedUser: null,
              isAuthenticated: false,
              profileLastLoadedAt: 0,
            });
            return buildBlockedOutcome(blockedStatus, null, formattedError);
          }

          set({
            user: null,
            token: null,
            error: formattedError,
            isLoading: false,
            isAuthenticated: false,
            blockedStatus: null,
            blockedUser: null,
            profileLastLoadedAt: 0,
          });
          return { ok: false, error: formattedError };
        }
      },

      signup: async (userData) => {
        set({
          isLoading: true,
          error: null,
          blockedStatus: null,
          blockedUser: null,
        });
        try {
          const response = await apiClient.auth.register(userData);
          if (response?.token && response?.user) {
            const outcome = buildAuthOutcome(response.user);

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              blockedStatus: outcome.canAccessApp ? null : outcome.status,
              blockedUser: outcome.canAccessApp ? null : response.user,
              profileLastLoadedAt: Date.now(),
            });

            await useAdminStore.getState().loadUsers({ force: true });
            return outcome;
          }

          const status = normalizeAccountStatus(response?.user?.status);
          const effectiveStatus = status === 'pending' ? 'approved' : status;
          const requiresEmailVerification = response?.user?.verified === false
            && String(response?.user?.signupMethod || userData?.signupMethod || 'email').toLowerCase() !== 'google';

          await useAdminStore.getState().loadUsers({ force: true });

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            blockedStatus: requiresEmailVerification ? 'verification_required' : null,
            blockedUser: requiresEmailVerification
              ? (response?.user || {
                  email: userData?.email,
                  name: userData?.name || userData?.username,
                })
              : null,
          });

          if (requiresEmailVerification) {
            return buildVerificationRequiredOutcome(response?.user || {
              email: userData?.email,
              name: userData?.name || userData?.username,
            });
          }

          return {
            ok: true,
            status: effectiveStatus,
            user: response?.user || null,
            redirectTo: getAccountAccessRoute(effectiveStatus) || getDefaultRouteForRole(response?.user?.role),
            canAccessApp: false,
          };
        } catch (err) {
          const formattedError = formatAuthErrorMessage(err, { action: 'register' });
          set({
            error: formattedError,
            isLoading: false,
            blockedStatus: null,
            blockedUser: null,
          });
          return { ok: false, error: formattedError };
        }
      },

      logout: async () => {
        profileRefreshRequest = null;
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          blockedStatus: null,
          blockedUser: null,
          profileLastLoadedAt: 0,
        });

        try {
          await apiClient.auth.logout?.();
        } catch {
          // Frontend state reset above remains the primary guard.
        }
      },

      updateUserSession: (updates) => {
        const { user } = get();
        if (user) {
          const nextUser = { ...user, ...updates };
          const nextStatus = normalizeAccountStatus(nextUser?.status);
          set({
            user: nextUser,
            blockedStatus: isApprovedAccountStatus(nextStatus) ? null : nextStatus,
            blockedUser: isApprovedAccountStatus(nextStatus) ? null : nextUser,
            profileLastLoadedAt: Date.now(),
          });
        }
      },

      refreshProfile: async ({ force = false } = {}) => {
        try {
          const currentState = get();
          const currentUserId = currentState.user?.id;
          if (!currentUserId) return null;

          const hasFreshProfile = (
            !force
            && currentState.user
            && (Date.now() - Number(currentState.profileLastLoadedAt || 0) < PROFILE_CACHE_TTL)
          );

          if (hasFreshProfile) {
            return currentState.user;
          }

          if (profileRefreshRequest) {
            return profileRefreshRequest;
          }

          profileRefreshRequest = apiClient.auth.getProfile(currentUserId)
            .then((profile) => {
              const nextStatus = normalizeAccountStatus(profile?.status);

              set((state) => ({
                user: { ...state.user, ...profile },
                blockedStatus: isApprovedAccountStatus(nextStatus) ? null : nextStatus,
                blockedUser: isApprovedAccountStatus(nextStatus) ? null : { ...state.user, ...profile },
                profileLastLoadedAt: Date.now(),
              }));

              return profile;
            })
            .catch((err) => {
              devLogger.warnUnlessBenign('[AuthStore] refreshProfile failed:', err, { once: true });
              return null;
            })
            .finally(() => {
              profileRefreshRequest = null;
            });

          return profileRefreshRequest;
        } catch (err) {
          devLogger.warnUnlessBenign('[AuthStore] refreshProfile failed:', err, { once: true });
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        blockedStatus: state.blockedStatus,
        blockedUser: state.blockedUser,
        profileLastLoadedAt: state.profileLastLoadedAt,
      }),
    }
  )
);

export default useAuthStore;
