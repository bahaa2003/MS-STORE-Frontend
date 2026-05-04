import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Home,
  Info,
  LogIn,
  Store,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '../ui/Button';
import BrandMark from './BrandMark';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 shrink-0">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.6l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.7 19.6 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.2 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3 7.8C2.4 9 2 10.4 2 12s.4 3 1 4.2l3.2-2.5z" />
    <path fill="#FBBC05" d="M12 5c1.5 0 2.9.5 4 1.6l3-3C17 1.8 14.7 1 12 1 8 1 4.7 3.4 3 7.8l3.2 2.5C7 6.8 9.3 5 12 5z" />
  </svg>
);

const PublicSidebar = ({ isOpen, onClose, onLogin, onHome, onAbout, onCreateAccount, onGoogleLogin, onCreatedBy, isBusy, isArabic }) => {
  const [isMobile, setIsMobile] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    {
      icon: Home,
      label: isArabic ? 'الرئيسية' : 'Home',
      onClick: onHome,
      isActive: pathname === '/',
    },
    {
      icon: Info,
      label: isArabic ? 'من نحن' : 'About us',
      onClick: onAbout,
      isActive: pathname === '/about-us',
    },
    {
      icon: Sparkles,
      label: isArabic ? 'تم الإنشاء بواسطة' : 'Created By',
      onClick: onCreatedBy,
      isActive: pathname === '/created-by',
    },
  ];

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        />
      ) : null}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 'min(312px, calc(100vw - 1.5rem))' : 308,
          x: isOpen ? 0 : 332,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed right-3 top-3 z-50 block h-[calc(100vh-1.5rem)] overflow-hidden sm:right-4 sm:top-4 sm:h-[calc(100vh-2rem)]"
      >
        <div className={cn(
          'app-shell-sidebar-panel relative flex h-full flex-col overflow-hidden rounded-[30px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-elevated-rgb)/0.74))] shadow-[0_30px_80px_-50px_rgb(var(--color-primary-rgb)/0.42)] backdrop-blur-[24px]',
          'dark:bg-[linear-gradient(180deg,rgb(26_26_26/0.9),rgb(10_10_10/0.78))] dark:shadow-[0_34px_90px_-54px_rgb(0_0_0/0.94)]'
        )}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,rgb(var(--color-primary-rgb)/0.18),transparent_54%)]" />

          <div className="relative border-b border-[color:rgb(var(--color-border-rgb)/0.56)] px-4 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onHome}
                className="flex min-w-0 items-center rounded-[24px] transition-all hover:-translate-y-0.5"
              >
                <BrandMark size="sm" showCaption={false} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] text-[var(--color-text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:text-[var(--color-primary)]"
                aria-label={isArabic ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-4">
              <LanguageSwitcher variant="sidebar" className="w-full justify-center bg-[color:rgb(var(--color-surface-rgb)/0.58)]" />
            </div>

            <div className="mt-4 rounded-[24px] border border-[color:rgb(var(--color-primary-rgb)/0.14)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-surface-rgb)/0.56))] p-3 shadow-[0_22px_48px_-38px_rgb(var(--color-primary-rgb)/0.48)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]">
                  <Store className="h-4.5 w-4.5" />
                </span>
                <span className="truncate">{isArabic ? 'ابدأ مع MS STORE' : 'Start with MS STORE'}</span>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-transparent bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] px-3 text-sm font-bold text-[var(--color-button-text)] shadow-[0_20px_42px_-26px_rgb(var(--color-primary-rgb)/0.72)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onCreateAccount}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[16px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-elevated-rgb)/0.76)] px-2 text-xs font-bold text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.22)] hover:text-[var(--color-primary)]"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span className="truncate">{isArabic ? 'حساب جديد' : 'Sign up'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[16px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-elevated-rgb)/0.76)] px-2 text-xs font-bold text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleMark />
                    <span className="truncate">Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col gap-2 overflow-y-auto p-3 scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={cn(
                  'group relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] border px-3 py-3 transition-all',
                  item.isActive
                    ? 'border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(90deg,rgb(var(--color-primary-rgb)/0.15),transparent)] text-[var(--color-text)] shadow-[0_18px_34px_-28px_rgb(var(--color-primary-rgb)/0.28)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.16)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] hover:text-[var(--color-text)]'
                )}
              >
                {item.isActive && (
                  <span className="absolute inset-y-3 right-0 w-[3px] rounded-full bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-hover))]" />
                )}
                <span className={cn(
                  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                  item.isActive
                    ? 'bg-[color:rgb(var(--color-primary-rgb)/0.16)] text-[var(--color-primary)]'
                    : 'bg-[color:rgb(var(--color-surface-rgb)/0.52)] text-[var(--color-primary)] group-hover:bg-[color:rgb(var(--color-primary-rgb)/0.14)]'
                )}>
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="truncate text-sm font-bold">{item.label}</span>
              </button>
            ))}

            <div className="mt-auto rounded-[22px] border border-[color:rgb(var(--color-border-rgb)/0.52)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] p-3 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
              MS STORE
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default PublicSidebar;
