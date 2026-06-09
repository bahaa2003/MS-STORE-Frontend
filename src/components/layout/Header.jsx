import React, { useEffect, useRef, useState } from 'react';
import { Bell, Menu, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ui/ThemeToggle';
import BrandMark from './BrandMark';
import { formatWalletAmount } from '../../utils/storefront';
import { getDefaultRouteForRole, isAdminRole, isSupervisorRole } from '../../utils/authRoles';
import { cn } from '../ui/Button';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const { notifications, unreadCount, isLoading, loadNotifications, loadUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const { dir } = useLanguage();

  const language = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const isRTL = dir === 'rtl';
  const isCustomer = String(user?.role || '').toLowerCase() === 'customer';
  const isAdmin = isAdminRole(user?.role);
  const isBackoffice = isAdmin || isSupervisorRole(user?.role);
  const walletValue = Number(user?.coins || 0);
  const walletDisplayValue = formatWalletAmount(walletValue, user?.currency || 'USD');
  const walletTargetPath = isCustomer ? '/wallet' : '/admin/wallet';
  const shouldShowWallet = isCustomer || isBackoffice;
  useEffect(() => {
    if (!user?.id) return undefined;
    void loadUnreadCount().catch(() => {});
    const timer = setInterval(() => {
      void loadUnreadCount().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [loadUnreadCount, user?.id]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (notificationsRef.current?.contains(event.target)) return;
      setIsNotificationsOpen(false);
      markAllAsRead();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isNotificationsOpen, markAllAsRead]);

  const buildPathWithQuery = (path, key, value) => {
    const normalizedValue = String(value || '').trim();
    if (!path || !normalizedValue) return path;

    const [pathAndSearch, hash = ''] = String(path).split('#');
    const [pathname, search = ''] = pathAndSearch.split('?');
    const params = new URLSearchParams(search);
    params.set(key, normalizedValue);

    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
  };

  const resolveNotificationTarget = (notification) => {
    const source = String(notification?.source || notification?.context || notification?.category || '').toLowerCase();
    const targetType = String(notification?.targetType || '').toLowerCase();
    const targetId = notification?.targetId || '';
    const orderId = notification?.orderId || (targetType === 'order' ? targetId : '');
    const topupId = notification?.topupId || (targetType === 'topup' || targetType === 'deposit' || targetType === 'wallet' ? targetId : '');
    const targetRequestId = notification?.targetRequestId || (
      targetType.includes('target') || source.includes('target') ? targetId : ''
    );
    const userId = notification?.userId || (targetType === 'user' ? notification?.targetId : '');
    const text = `${notification?.title || ''} ${notification?.message || ''} ${source} ${targetType}`;

    if (source.includes('target') || targetType.includes('target') || /target/i.test(text)) {
      const basePath = isBackoffice ? '/admin/target-requests' : '/target-orders';
      return targetRequestId ? buildPathWithQuery(basePath, 'targetRequestId', targetRequestId) : basePath;
    }

    if (
      source.includes('deposit')
      || source.includes('wallet')
      || targetType === 'deposit'
      || topupId
      || targetType === 'topup'
      || targetType === 'wallet'
      || /wallet|topup|payment|deposit/i.test(text)
    ) {
      const basePath = isBackoffice ? '/admin/payments' : '/wallet/topup-history';
      return topupId ? buildPathWithQuery(basePath, 'topupId', topupId) : basePath;
    }
    const inferredId = text.match(/(?:الطلب|طلب|order|#)\s*([A-Za-z0-9_-]{4,})/i)?.[1] || '';

    if (orderId || targetType === 'order' || /طلب(?! شحن)|order/i.test(text)) {
      const id = orderId || inferredId;
      const basePath = isBackoffice ? '/admin/orders' : '/orders';
      return id ? `${basePath}?orderId=${encodeURIComponent(id)}` : basePath;
    }

    if (topupId || targetType === 'topup' || targetType === 'wallet' || /شحن|رصيد|محفظة|wallet|topup|payment/i.test(text)) {
      const basePath = isBackoffice ? '/admin/payments' : '/wallet/topup-history';
      return topupId ? buildPathWithQuery(basePath, 'topupId', topupId) : basePath;
    }

    if (userId || targetType === 'user' || /حساب|account|user/i.test(text)) {
      return isBackoffice ? '/admin/users' : '/account';
    }

    if (notification?.targetUrl) return notification.targetUrl;

    return getDefaultRouteForRole(user?.role);
  };

  const getNotificationTone = (type) => {
    const normalizedType = String(type || 'info').toLowerCase();
    if (normalizedType === 'success') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-500';
    if (normalizedType === 'warning') return 'border-amber-400/30 bg-amber-500/10 text-amber-500';
    if (normalizedType === 'error') return 'border-red-400/30 bg-red-500/10 text-red-500';
    return 'border-sky-400/30 bg-sky-500/10 text-sky-500';
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((previous) => {
      const nextIsOpen = !previous;

      if (nextIsOpen) {
        void loadNotifications().catch(() => {});
      } else {
        markAllAsRead();
      }

      return nextIsOpen;
    });
  };

  const handleNotificationClick = (notification) => {
    if (notification?.id && !notification?.read) {
      void markAsRead(notification.id);
    }
    markAllAsRead();
    navigate(resolveNotificationTarget(notification));
    setIsNotificationsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-w-full">
      <div className={cn(
        'app-shell-header-panel w-full max-w-full overflow-visible rounded-[20px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.74),rgb(var(--color-elevated-rgb)/0.58))] px-2.5 py-1.5 shadow-[var(--shadow-medium)] backdrop-blur-[22px] sm:rounded-[28px] sm:px-4 sm:py-2',
        isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(180deg,rgb(255_255_255/0.86),rgb(245_241_231/0.7))] shadow-[0_24px_64px_-46px_rgb(80_64_24/0.32)] dark:bg-[linear-gradient(180deg,rgb(26_26_26/0.82),rgb(12_12_12/0.68))] dark:shadow-[0_28px_72px_-48px_rgb(0_0_0/0.9)]'
      )}>
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <div className="flex min-w-0 shrink items-center gap-1 sm:shrink-0 sm:gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.26)] hover:text-[var(--color-primary)] min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10"
              aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
            >
              <Menu className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => navigate(getDefaultRouteForRole(user?.role))}
              className="rounded-[14px] px-0 py-0 transition-all hover:-translate-y-0.5"
            >
              <span className="sm:hidden flex min-w-0 items-center gap-1">
                <span className="scale-[0.78] min-[380px]:scale-[0.86]">
                  <BrandMark size="xs" compact showCaption={false} />
                </span>
                <span className="header-mobile-brand inline-flex max-w-[5.2rem] items-baseline gap-0.5 leading-none">
                  <span className="header-mobile-brand-store text-[0.56rem] font-extrabold tracking-[0.12em] text-[color:rgb(var(--color-text-secondary)/0.72)]">
                    STORE
                  </span>
                  <span className="header-mobile-brand-ms text-[0.98rem] font-black tracking-[0.03em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow min-[380px]:text-[1.05rem]">
                    MS
                  </span>
                </span>
              </span>
              <span className="hidden sm:block">
                <BrandMark size="xs" showCaption={false} />
              </span>
            </button>
          </div>

          <div className={cn(
            'header-mobile-actions flex min-w-0 shrink-0 items-center gap-0.5 px-1 min-[380px]:gap-1 min-[380px]:px-1.5 sm:gap-2 sm:px-0',
            isRTL ? 'mr-auto' : 'ml-auto'
          )}>
            {shouldShowWallet && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-primary-rgb)/0.06))] px-0.5 py-0.5 text-start shadow-[0_18px_34px_-28px_rgb(var(--color-primary-rgb)/0.32)] transition-all hover:-translate-y-0.5 min-[380px]:px-1 min-[380px]:py-1 sm:hidden"
                  aria-label={language === 'ar' ? 'الرصيد' : 'Balance'}
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.2)] text-[var(--color-primary)]">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                  <span className="header-wallet-balance hidden max-w-[72px] truncate text-[0.72rem] font-semibold text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow min-[380px]:block">
                    {walletDisplayValue}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="hidden items-center gap-3 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-primary-rgb)/0.06))] px-2 py-1.5 text-start shadow-[0_18px_34px_-28px_rgb(var(--color-primary-rgb)/0.32)] transition-all hover:-translate-y-0.5 sm:inline-flex"
                  aria-label={language === 'ar' ? 'المحفظة' : 'Wallet'}
                >
                  <span className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.2)] text-[var(--color-primary)]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-primary-soft)]">
                      {language === 'ar' ? 'الرصيد' : 'Balance'}
                    </span>
                    <span className="header-wallet-balance block truncate text-sm font-semibold text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow">
                      {walletDisplayValue}
                    </span>
                  </span>
                </button>
              </>
            )}

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={handleNotificationsToggle}
                className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.26)] hover:text-[var(--color-primary)] min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10"
                aria-label="الإشعارات"
              >
                <Bell className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -end-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-black text-[var(--color-button-text)] sm:h-5 sm:min-w-5 sm:text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className={`absolute top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-card-rgb)/0.96)] shadow-[0_26px_70px_-42px_rgb(0_0_0/0.92)] backdrop-blur-xl ${isRTL ? 'left-0' : 'right-0'}`}>
                  <div className="border-b border-[color:rgb(var(--color-border-rgb)/0.68)] px-4 py-3">
                    <p className="text-sm font-bold text-[var(--color-text)]">الإشعارات</p>
                  </div>
                  <div className="max-h-[calc(50vh-3.25rem)] overflow-y-auto p-2">
                    {notifications.length ? notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'block w-full rounded-xl border px-3 py-2.5 text-start transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]',
                          notification.read ? 'border-transparent opacity-75' : getNotificationTone(notification.type)
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <span className={`mt-1 h-2 w-2 rounded-full ${notification.read ? 'bg-[color:rgb(var(--color-border-rgb)/0.9)]' : 'bg-[var(--color-primary)]'}`} />
                          <span className="min-w-0">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{notification.title}</span>
                              {!notification.read ? (
                                <span className="shrink-0 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] px-1.5 py-0.5 text-[9px] font-black text-[var(--color-primary)]">
                                  جديد
                                </span>
                              ) : null}
                            </span>
                            {notification.message ? (
                              <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{notification.message}</span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    )) : (
                      <p className="px-3 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        لا توجد إشعارات
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <ThemeToggle compact className="h-8 w-8 shrink-0 min-[380px]:h-9 min-[380px]:w-9 sm:h-11 sm:w-11" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
