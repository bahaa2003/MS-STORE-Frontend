import React, { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AmbientBackground from './AmbientBackground';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import BackToTopButton from '../ui/BackToTopButton';
import SiteFooter from './SiteFooter';
import {
  getDashboardPathForRole,
  getPreviousVisitedPath,
  isSidebarRootPath,
  registerVisitedPath,
} from '../../utils/navigation';

const Layout = ({ children = null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { dir } = useLanguage();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    registerVisitedPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.body.dataset.sidebarOpen = String(isSidebarOpen);
    return () => {
      delete document.body.dataset.sidebarOpen;
    };
  }, [isSidebarOpen]);

  const isHomePage = [
    '/dashboard',
    '/admin/dashboard',
  ].includes(location.pathname);
  const isCustomerDashboard = location.pathname === '/dashboard';
  const isBuyTargetPage = location.pathname === '/buy-target';
  const isWalletTopupPage = (
    location.pathname === '/wallet/add-balance'
    || location.pathname.startsWith('/wallet/payment-details/')
  );
  const shellOffset = !isMobile ? (isSidebarOpen ? '266px' : '92px') : '0';

  const handleGoBack = () => {
    const path = String(location.pathname || '');
    const isWalletTopupFlow = (
      path === '/wallet/add-balance'
      || path.startsWith('/wallet/payment-details/')
    );
    const openedFromSettings = Boolean(location?.state?.fromSettings);
    const isAdmin = isAdminRole(user?.role);
    const isAdminWallet = path === '/admin/wallet';

    if (isWalletTopupFlow) {
      navigate('/wallet');
      return;
    }

    if (openedFromSettings) {
      navigate('/settings');
      return;
    }

    if (isAdmin && isAdminWallet) {
      navigate('/dashboard');
      return;
    }

    if (isSidebarRootPath(path, user?.role)) {
      navigate(getDashboardPathForRole(user?.role));
      return;
    }

    const previousPath = getPreviousVisitedPath(path);
    if (previousPath) {
      navigate(previousPath);
      return;
    }

    if (isAdmin && !isAdminWallet) {
      navigate('/admin/dashboard');
      return;
    }

    navigate(getDashboardPathForRole(user?.role));
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-[var(--color-text)]">
      <AmbientBackground />
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      <div
        className="flex min-h-screen min-w-0 max-w-full flex-col transition-all duration-300"
        style={{ [dir === 'rtl' ? 'marginRight' : 'marginLeft']: shellOffset }}
      >
        <div
          className="fixed z-40 max-w-full transition-all duration-300"
          style={{
            top: isMobile ? 'max(0.75rem, env(safe-area-inset-top))' : '1rem',
            [dir === 'rtl' ? 'right' : 'left']: isMobile ? '12px' : shellOffset,
            [dir === 'rtl' ? 'left' : 'right']: isMobile ? '12px' : '16px',
          }}
        >
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <div className="h-[4.9rem] sm:h-[6.5rem]" aria-hidden="true" />

        {!isHomePage && (
          <div className="mt-1 w-full px-3 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="group relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.22),rgb(var(--color-card-rgb)/0.94)_58%,rgb(var(--color-primary-rgb)/0.12))] text-[var(--color-primary)] shadow-[0_8px_22px_rgb(var(--color-primary-rgb)/0.18),inset_0_1px_0_rgb(255_255_255/0.3)] backdrop-blur-xl transition-all duration-300 before:absolute before:inset-0 before:translate-x-[-120%] before:bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.32)_50%,transparent_70%)] before:transition-transform before:duration-700 hover:-translate-y-0.5 hover:scale-105 hover:border-[color:rgb(var(--color-primary-rgb)/0.7)] hover:shadow-[0_11px_28px_rgb(var(--color-primary-rgb)/0.3),inset_0_1px_0_rgb(255_255_255/0.36)] hover:before:translate-x-[120%] active:translate-y-0 active:scale-95"
                aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
                title={dir === 'rtl' ? 'رجوع' : 'Back'}
              >
                <ArrowRight className="relative z-10 h-[18px] w-[18px] transition-transform duration-300 ease-out group-hover:translate-x-0.5" strokeWidth={2.5} />
              </button>

              {isBuyTargetPage || isWalletTopupPage ? (
                <button
                  type="button"
                  onClick={() => navigate(isBuyTargetPage ? '/target-orders' : '/wallet/topup-history')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-subtle)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.42)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.14)]"
                  aria-label={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                  title={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">{dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        <main className={`min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8 ${isHomePage ? 'scrollbar-hide' : ''} ${isCustomerDashboard ? '!pt-0 sm:!pt-0 md:!pt-0 lg:!pt-0' : ''}`}>
          <div className="mx-auto w-full min-w-0 max-w-[var(--shell-max-width)] animate-[page-fade-in_0.35s_ease-out]">
            {children || <Outlet />}
          </div>
        </main>
        {!isCustomerDashboard ? <SiteFooter /> : null}
      </div>
      <BackToTopButton />
    </div>
  );
};

export default Layout;
