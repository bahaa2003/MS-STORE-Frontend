import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  Check,
  Coins,
  Copy,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MonitorCog,
  Package,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  User,
  UserCog,
  Users,
  Wallet
} from 'lucide-react';
import ConfirmDialog from '../account/ConfirmDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { cn } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import WalletSidebarCard from './WalletSidebarCard';
import BrandMark from './BrandMark';
import { SUPERVISOR_ROLES, getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import { buildWhatsAppLink } from '../../utils/whatsapp';

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const copyToClipboard = async (value) => {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the hidden textarea copy path below.
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  const isExpanded = isOpen || isMobile || isPreviewExpanded;
  const userId = String(user?.id || user?._id || user?.userId || '').trim();
  const developerWhatsAppHref = buildWhatsAppLink({
    number: '01096451539',
    message: 'مرحباً، أريد التواصل مع المسؤول بخصوص MS STORE',
  });
  useEffect(() => {
    if (!copiedUserId) return undefined;
    const timer = window.setTimeout(() => setCopiedUserId(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedUserId]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    closeSidebarOnMobile();
    logout();
    navigate('/auth');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleOpenMyAccount = () => {
    closeSidebarOnMobile();
    navigate('/account');
  };

  const handleCopyUserId = async () => {
    if (!userId) return;

    if (await copyToClipboard(userId)) {
      setCopiedUserId(true);
      return;
    }

    setCopiedUserId(false);
  };

  const handleContactClick = () => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  };

  const navItems = [
    {
      icon: Home,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    {
      icon: Wallet,
      label: t('sidebar.adminWallet', { defaultValue: dir === 'rtl' ? 'محفظة الأدمن' : 'Admin Wallet' }),
      path: '/admin/wallet',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_WALLET,
    },
    {
      icon: LayoutDashboard,
      label: t('sidebar.adminDashboard', { defaultValue: dir === 'rtl' ? 'لوحة تحكم الأدمن' : 'Admin Dashboard' }),
      path: '/admin/dashboard',
      roles: ['admin', 'super_admin'],
    },
    { icon: User, label: t('sidebar.myAccount', { defaultValue: dir === 'rtl' ? 'حسابي' : 'My Account' }), path: '/account', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: ShieldCheck, label: t('sidebar.accountProtection', { defaultValue: dir === 'rtl' ? 'حماية الحساب' : 'Account Security' }), path: '/account-security', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: Wallet, label: t('sidebar.wallet'), path: '/wallet', roles: ['customer'] },
    {
      icon: ShoppingBag,
      label: dir === 'rtl' ? 'طلباتي' : 'My Orders',
      path: '/orders',
      roles: ['customer']
    },
    { icon: Target, label: 'بيع التارجت', path: '/buy-target', roles: ['customer'] },
    { icon: Users, label: t('sidebar.users'), path: '/admin/users', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_USERS },
    { icon: UserCog, label: t('sidebar.supervisors'), path: '/admin/supervisors', roles: ['admin'] },
    { icon: MonitorCog, label: 'مراقبة المشرفين', path: '/admin/supervisor-monitoring', roles: ['admin'] },
    { icon: Users, label: t('sidebar.groupsManager'), path: '/admin/groups', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_GROUPS },
    { icon: Package, label: t('sidebar.productsManager'), path: '/admin/products', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PRODUCTS },
    {
      icon: ShoppingBag,
      label: t('sidebar.ordersManager', { defaultValue: dir === 'rtl' ? 'إدارة الطلبات' : 'Orders Manager' }),
      path: '/admin/orders',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_ORDERS,
    },
    { icon: Target, label: 'طلبات التارجت', path: '/admin/target-requests', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_TARGET_REQUESTS },
    { icon: Building2, label: t('sidebar.suppliersManager'), path: '/admin/suppliers', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_SUPPLIERS },
    { icon: Scale, label: dir === 'rtl' ? 'منافسة أسعار الموردين' : 'Supplier Price Competition', path: '/admin/supplier-price-competition', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_SUPPLIERS },
    { icon: ShieldCheck, label: t('sidebar.paymentsManager'), path: '/admin/payments', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENTS },
    { icon: CreditCard, label: t('sidebar.paymentMethods'), path: '/admin/payment-methods', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENT_METHODS },
    { icon: Coins, label: t('sidebar.currencies'), path: '/admin/currencies', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_CURRENCIES },
    { icon: MessageCircle, label: 'واتساب', path: '/admin/whatsapp', roles: ['admin'] },
    {
      icon: Sparkles,
      label: t('sidebar.createdBy', { defaultValue: 'تم الإنشاء بواسطة' }),
      path: '/created-by',
      roles: ['customer', ...SUPERVISOR_ROLES]
    },
    {
      icon: MessageCircle,
      label: t('sidebar.contactUs', { defaultValue: 'اتصل بنا' }),
      path: '/contact-us',
      roles: ['customer', ...SUPERVISOR_ROLES],
      onClick: handleContactClick,
    },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] }
  ];

  const filteredNavItems = navItems.filter((item) => (
    hasRequiredRole(user?.role || 'customer', item.roles) && hasPermission(user, item.permission)
  ));
  const showWalletCard = String(user?.role || '').toLowerCase() === 'customer' && isExpanded;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const getNavSection = (item) => {
    const path = String(item?.path || '');
    if (path === '/dashboard') return 'account';
    if (path.startsWith('/admin') || path.startsWith('/manager') || path.startsWith('/supervisor')) return 'admin';
    if (['/account', '/account-security', '/settings', '/contact-us', '/created-by'].includes(path)) return 'account';
    return 'main';
  };
  const sectionLabels = {
    main: dir === 'rtl' ? 'المساحة' : 'Space',
    admin: dir === 'rtl' ? 'الإدارة' : 'Admin',
    account: dir === 'rtl' ? 'الحساب' : 'Account',
  };
  const navSections = filteredNavItems.reduce((sections, item) => {
    const sectionId = getNavSection(item);
    const existing = sections.find((section) => section.id === sectionId);
    if (existing) {
      existing.items.push(item);
      return sections;
    }
    return [...sections, { id: sectionId, items: [item] }];
  }, []);

  const accountPanel = isExpanded ? (
    <div className="mt-2 overflow-hidden rounded-[16px] border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.13),rgb(var(--color-card-rgb)/0.72))] p-2 shadow-[0_16px_34px_-28px_rgb(var(--color-primary-rgb)/0.55),inset_0_1px_0_rgb(255_255_255/0.14)]">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={handleOpenMyAccount} className="relative shrink-0" aria-label={dir === 'rtl' ? 'فتح حسابي' : 'Open my account'}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=random`}
            alt={user?.name || 'User'}
            className="h-9 w-9 rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.36)] object-cover shadow-[0_10px_22px_-16px_rgb(0_0_0/0.55)]"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--color-card-rgb))] bg-[var(--color-success)]" />
        </button>

        <button type="button" onClick={handleOpenMyAccount} className="min-w-0 flex-1 text-start">
          <span className="block truncate text-xs font-black text-[var(--color-text)]">{user?.name || 'حسابي'}</span>
          <span className="block truncate text-[9px] font-medium text-[var(--color-text-secondary)]">{user?.email || user?.role || ''}</span>
        </button>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[color:rgb(var(--color-error-rgb)/0.3)] bg-[color:rgb(var(--color-error-rgb)/0.08)] text-[var(--color-error)] transition-colors hover:bg-[color:rgb(var(--color-error-rgb)/0.16)]"
          aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>

      {userId ? (
        <button
          type="button"
          onClick={handleCopyUserId}
          className="mt-1.5 flex w-full items-center gap-1.5 rounded-[10px] border border-[color:rgb(var(--color-border-rgb)/0.56)] bg-[color:rgb(var(--color-card-rgb)/0.62)] px-2 py-1 text-[9px] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.36)] hover:text-[var(--color-primary)]"
          title={copiedUserId ? 'تم نسخ ID المستخدم' : 'اضغط لنسخ ID المستخدم'}
        >
          {copiedUserId ? <Check className="h-3 w-3 shrink-0 text-[var(--color-success)]" /> : <Copy className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />}
          <span className="truncate" dir="ltr">{copiedUserId ? 'Copied' : `ID ${userId}`}</span>
        </button>
      ) : null}
    </div>
  ) : (
    <button
      type="button"
      onClick={handleOpenMyAccount}
      className="mx-auto mt-2 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] shadow-[0_12px_24px_-18px_rgb(var(--color-primary-rgb)/0.5)]"
      aria-label={dir === 'rtl' ? 'حسابي' : 'My account'}
    >
      <img
        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=random`}
        alt={user?.name || 'User'}
        className="h-full w-full object-cover"
      />
    </button>
  );

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/72 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 270 : isExpanded ? 246 : 72,
          x: isMobile && !isOpen ? (dir === 'rtl' ? 320 : -320) : 0
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onMouseEnter={() => {
          if (!isMobile && !isOpen) {
            setIsPreviewExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsPreviewExpanded(false);
          }
        }}
        className={cn(
          'fixed top-4 z-[90] h-[calc(100vh-2rem)] overflow-hidden',
          dir === 'rtl' ? 'right-4' : 'left-4',
          isMobile && !isOpen && 'hidden'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(165deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-surface-rgb)/0.82)_48%,rgb(var(--color-elevated-rgb)/0.68))] shadow-[0_30px_86px_-50px_rgb(0_0_0/0.72)] backdrop-blur-[26px]',
          isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(180deg,rgb(255_255_255/0.86),rgb(245_241_231/0.72))] shadow-[0_34px_90px_-58px_rgb(80_64_24/0.36)] dark:bg-[linear-gradient(180deg,rgb(26_26_26/0.84),rgb(10_10_10/0.72))] dark:shadow-[0_34px_90px_-54px_rgb(0_0_0/0.94)]'
        )}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_right,rgb(var(--color-primary-rgb)/0.16),transparent_68%)]" />
          <div className="relative border-b border-[color:rgb(var(--color-border-rgb)/0.5)] px-2.5 pb-2.5 pt-2.5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className={cn(
                  'flex min-w-0 items-center rounded-[22px] transition-all hover:-translate-y-0.5',
                  isExpanded
                    ? 'min-h-[3.65rem] flex-1 justify-start border border-[color:rgb(var(--color-border-rgb)/0.58)] bg-[linear-gradient(135deg,rgb(var(--color-surface-rgb)/0.68),rgb(var(--color-primary-rgb)/0.06))] px-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
                    : 'mx-auto'
                )}
              >
                <BrandMark
                  compact={!isExpanded}
                  size="xs"
                  stacked={isExpanded}
                  centerStackedText={isExpanded}
                  showCaption={false}
                />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-surface-rgb)/0.46)] text-[var(--color-text-secondary)] transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:text-[var(--color-primary)]',
                    !isExpanded && 'mx-auto'
                  )}
                  aria-label={dir === 'rtl' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-4.5 w-4.5 transition-transform', (dir === 'rtl' ? isExpanded : !isExpanded) && 'rotate-180')} />
                </button>
              )}
            </div>

            {accountPanel}

            {isExpanded && (
              <div className="mt-2">
                <LanguageSwitcher variant="sidebar" className="w-full justify-center rounded-[15px] border border-[color:rgb(var(--color-border-rgb)/0.5)] bg-[color:rgb(var(--color-surface-rgb)/0.46)]" />
              </div>
            )}
          </div>

          <div className="relative flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-hide">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-4"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-3">
              {navSections.map((section) => (
                <div key={section.id} className="space-y-1.5">
                  {isExpanded && (
                    <div className="px-3 pb-1 text-[0.64rem] font-black uppercase tracking-[0.24em] text-[color:rgb(var(--color-text-secondary)/0.58)]">
                      {sectionLabels[section.id]}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      item.isExternal ? (
                  <button
                    key={item.path}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'group relative flex min-h-[2.7rem] w-full items-center gap-2.5 overflow-hidden rounded-[14px] border border-transparent px-2 py-1.5 text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[color:rgb(var(--color-primary-rgb)/0.16)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] hover:text-[var(--color-text)]',
                      !isExpanded && 'justify-center px-2'
                    )}
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {isExpanded && <span className="truncate text-xs font-semibold">{item.label}</span>}
                  </button>
                      ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebarOnMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex min-h-[2.7rem] items-center gap-2.5 overflow-hidden rounded-[14px] border px-2 py-1.5 transition-all duration-200',
                        !isExpanded && 'justify-center px-2',
                        isActive
                          ? 'border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.16),rgb(var(--color-primary-rgb)/0.05))] text-[var(--color-text)] shadow-[0_18px_38px_-30px_rgb(var(--color-primary-rgb)/0.5),inset_0_1px_0_rgb(255_255_255/0.08)]'
                          : 'border-transparent text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.14)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.07)] hover:text-[var(--color-text)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className={cn('absolute inset-y-2.5 w-[3px] rounded-full bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-hover))]', dir === 'rtl' ? 'right-0' : 'left-0')} />
                        )}
                        <span className={cn(
                          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                          isActive ? 'bg-[color:rgb(var(--color-primary-rgb)/0.15)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]' : 'bg-[color:rgb(var(--color-surface-rgb)/0.42)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]'
                        )}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {isExpanded && <span className="truncate text-xs font-semibold">{item.label}</span>}
                        {isExpanded && isActive && (
                          <span className={cn('ms-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_rgb(var(--color-primary-rgb)/0.65)]', dir === 'rtl' && 'ms-0 me-auto')} />
                        )}
                      </>
                    )}
                  </NavLink>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {isExpanded && (
              <footer className="mt-5 border-t border-[color:rgb(var(--color-border-rgb)/0.48)] pt-3">
                <div className="overflow-hidden rounded-[16px] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.08),rgb(var(--color-card-rgb)/0.64))] p-3 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]">
                  <p className="text-[10px] font-bold leading-5 text-[var(--color-text-secondary)]">
                    © 2026 جميع الحقوق محفوظة
                  </p>
                  <span className="mx-auto mt-1.5 block h-px w-12 bg-[linear-gradient(90deg,transparent,var(--color-primary),transparent)] opacity-60" />
                  <p className="mt-2 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    للتواصل مع المسؤول
                  </p>

                  <a
                    href={developerWhatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-[linear-gradient(135deg,#128c7e,#25d366)] px-3.5 py-2.5 text-xs font-black text-white shadow-[0_14px_28px_-20px_rgba(37,211,102,0.8)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                    aria-label="التواصل مع المسؤول عبر واتساب"
                  >
                    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M16.03 3.2c-7.08 0-12.81 5.71-12.81 12.77 0 2.26.6 4.48 1.73 6.42L3 29l6.79-1.78a12.84 12.84 0 0 0 6.24 1.6h.01c7.08 0 12.81-5.72 12.81-12.78A12.75 12.75 0 0 0 16.03 3.2Zm0 23.49h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-4.03 1.05 1.08-3.92-.25-.4a10.57 10.57 0 0 1-1.63-5.66c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.55 1.1 7.57 3.13a10.58 10.58 0 0 1 3.13 7.56c0 5.9-4.8 10.7-10.72 10.7Zm5.87-8.01c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.31-.82 1.04-1 1.25-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.56-1.55-.95-.85-1.6-1.9-1.79-2.21-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.19.21-.31.31-.52.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.98-2.33-.25-.6-.5-.51-.7-.52h-.6c-.21 0-.56.08-.85.39-.29.31-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.26 3.45 5.48 4.84.76.33 1.36.52 1.82.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.16-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z"
                      />
                    </svg>
                    <span dir="ltr">+20 10 96451539</span>
                  </a>
                </div>
              </footer>
            )}
          </div>

        </div>
      </motion.aside>
      <ConfirmDialog
        open={showLogoutConfirm}
        title={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
        description={dir === 'rtl' ? 'هل متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?'}
        confirmLabel={dir === 'rtl' ? 'نعم، تسجيل الخروج' : 'Yes, logout'}
        cancelLabel={dir === 'rtl' ? 'إلغاء' : 'Cancel'}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
