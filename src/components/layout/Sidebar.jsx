import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  Coins,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MonitorCog,
  Package,
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

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  const isExpanded = isOpen || isMobile || isPreviewExpanded;

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

  const handleContactClick = () => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  };

  const navItems = [
    {
      icon: Home,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin']
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
      label: t('sidebar.dashboard', { defaultValue: dir === 'rtl' ? 'لوحة التحكم' : 'Dashboard' }),
      path: '/admin/dashboard',
      roles: SUPERVISOR_ROLES
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
      label: t('header.orders', { defaultValue: dir === 'rtl' ? 'طلباتي' : 'My Orders' }),
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
    { icon: ShieldCheck, label: t('sidebar.paymentsManager'), path: '/admin/payments', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENTS },
    { icon: CreditCard, label: t('sidebar.paymentMethods'), path: '/admin/payment-methods', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENT_METHODS },
    { icon: Coins, label: t('sidebar.currencies'), path: '/admin/currencies', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_CURRENCIES },
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

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/72 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 304 : isExpanded ? 296 : 92,
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
          'fixed top-4 z-50 h-[calc(100vh-4rem)] overflow-hidden',
          dir === 'rtl' ? 'right-4' : 'left-4',
          isMobile && !isOpen && 'hidden'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel relative flex h-full flex-col rounded-[32px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.76),rgb(var(--color-elevated-rgb)/0.56))] shadow-[var(--shadow-medium)] backdrop-blur-[24px]',
          isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(180deg,rgb(255_255_255/0.86),rgb(245_241_231/0.72))] shadow-[0_34px_90px_-58px_rgb(80_64_24/0.36)] dark:bg-[linear-gradient(180deg,rgb(26_26_26/0.84),rgb(10_10_10/0.72))] dark:shadow-[0_34px_90px_-54px_rgb(0_0_0/0.94)]'
        )}>
          <div className="border-b border-[color:rgb(var(--color-border-rgb)/0.56)] px-4 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className={cn(
                  'flex items-center rounded-[24px] transition-all hover:-translate-y-0.5',
                  isExpanded ? 'bg-transparent' : 'mx-auto'
                )}
              >
                <BrandMark compact={!isExpanded} size={isExpanded ? 'sm' : 'md'} showCaption={false} />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-surface-rgb)/0.46)] text-[var(--color-text-secondary)] transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:text-[var(--color-primary)]',
                    !isExpanded && 'mx-auto'
                  )}
                  aria-label={dir === 'rtl' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-4.5 w-4.5 transition-transform', (dir === 'rtl' ? isExpanded : !isExpanded) && 'rotate-180')} />
                </button>
              )}
            </div>

            {isExpanded && (
              <>
                <div className="mt-4">
                  <LanguageSwitcher variant="sidebar" className="w-full justify-center bg-[color:rgb(var(--color-surface-rgb)/0.5)]" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=random`}
                    alt={user?.name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                    onClick={handleOpenMyAccount}
                    style={{ cursor: 'pointer' }}
                  />

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--color-text)]">{user?.name || user?.email || 'حسابي'}</div>
                      </div>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className={cn(
                      dir === 'rtl' ? 'mr-auto' : 'ml-auto',
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgb(var(--color-error-rgb)/0.42)] bg-[color:rgb(var(--color-error-rgb)/0.14)] text-[var(--color-error)] shadow-sm transition-all hover:bg-[color:rgb(var(--color-error-rgb)/0.22)] hover:border-[color:rgb(var(--color-error-rgb)/0.58)]'
                    )}
                    aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-4"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-2">
              {filteredNavItems.map((item) => (
                item.isExternal ? (
                  <button
                    key={item.path}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'group relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] border border-transparent px-3 py-3 text-[var(--color-text-secondary)] transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.16)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] hover:text-[var(--color-text)]',
                      !isExpanded && 'justify-center'
                    )}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
                      <item.icon className="h-4.5 w-4.5" />
                    </span>
                    {isExpanded && <span className="truncate text-sm font-medium">{item.label}</span>}
                  </button>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebarOnMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 overflow-hidden rounded-[22px] border px-3 py-3 transition-all',
                        !isExpanded && 'justify-center',
                        isActive
                          ? 'border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(90deg,rgb(var(--color-primary-rgb)/0.14),transparent)] text-[var(--color-text)] shadow-[0_18px_34px_-28px_rgb(var(--color-primary-rgb)/0.24)]'
                          : 'border-transparent text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.14)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.07)] hover:text-[var(--color-text)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className={cn('absolute inset-y-3 w-[3px] rounded-full bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-hover))]', dir === 'rtl' ? 'right-0' : 'left-0')} />
                        )}
                        <span className={cn(
                          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                          isActive ? 'bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]' : 'bg-[color:rgb(var(--color-surface-rgb)/0.42)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]'
                        )}
                        >
                          <item.icon className="h-4.5 w-4.5" />
                        </span>
                        {isExpanded && <span className="truncate text-sm font-medium">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
              ))}
            </div>
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
