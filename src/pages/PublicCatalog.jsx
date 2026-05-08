import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ChevronLeft,
  Menu,
  MessageCircle,
  LogIn,
  Search,
  UserPlus,
  Sparkles,
  Target,
  Home,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import Button from '../components/ui/Button';
import { cn } from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import BrandMark from '../components/layout/BrandMark';
import PublicSidebar from '../components/layout/PublicSidebar';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import StoreFooter from '../components/home/StoreFooter';
import { getDefaultRouteForRole } from '../utils/authRoles';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';
import slideOneImage from '../assets/سلايد 1.jpg';
import slideTwoImage from '../assets/سلايد 2.jpg';
import slideThreeImage from '../assets/سلايد 3.jpg';

const SERVICE_NOTICE_KEY = 'ms-store-public-service-notice-seen';
const COMMUNITY_NOTICE_KEY = 'ms-store-public-community-notice-seen';
const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/HMAlI6AfDndJ8VSMiqeHOs';

const getSessionNoticeFlag = (key) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const setSessionNoticeFlag = (key) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Best effort only; the modal still closes in-memory.
  }
};

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 shrink-0">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.6l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.7 19.6 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.2 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3 7.8C2.4 9 2 10.4 2 12s.4 3 1 4.2l3.2-2.5z" />
    <path fill="#FBBC05" d="M12 5c1.5 0 2.9.5 4 1.6l3-3C17 1.8 14.7 1 12 1 8 1 4.7 3.4 3 7.8l3.2 2.5C7 6.8 9.3 5 12 5z" />
  </svg>
);

const GoldShineButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-full border border-[#d8b36b]/75 bg-[linear-gradient(180deg,#f6e4a2_0%,#d4af37_48%,#b98a1e_100%)] px-4 text-sm font-extrabold text-white shadow-[0_18px_34px_-20px_rgba(212,175,55,0.95)] transition-all hover:-translate-y-0.5"
  >
    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_42%)] opacity-85" />
    <span className="absolute left-[-45%] top-[-18%] h-[140%] w-[30%] rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),rgba(255,255,255,0.95),rgba(255,255,255,0.22),transparent)] blur-[1px] mix-blend-screen animate-[gold-shine_2.8s_ease-in-out_infinite]" />
    <span className="relative z-10 flex items-center gap-2">
      <LogIn className="h-4 w-4" />
      {children}
    </span>
  </button>
);

const PublicCatalog = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const { categories, products, loadProducts } = useMediaStore();
  useGroupStore((state) => state.groupsLastLoadedAt);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showServiceNotice, setShowServiceNotice] = useState(false);
  const [showCommunityNotice, setShowCommunityNotice] = useState(false);

  const language = getStorefrontLanguage(i18n);
  const isArabic = language === 'ar';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForRole(userRole), { replace: true });
    }
  }, [isAuthenticated, navigate, userRole]);

  useEffect(() => {
    loadProducts({ force: true });
  }, [loadProducts]);

  useEffect(() => {
    const serviceSeen = getSessionNoticeFlag(SERVICE_NOTICE_KEY);
    const communitySeen = getSessionNoticeFlag(COMMUNITY_NOTICE_KEY);

    if (!serviceSeen) {
      setShowServiceNotice(true);
      setShowCommunityNotice(false);
      return;
    }

    if (!communitySeen) {
      setShowServiceNotice(false);
      setShowCommunityNotice(true);
    }
  }, []);

  const handleCloseServiceNotice = useCallback(() => {
    setSessionNoticeFlag(SERVICE_NOTICE_KEY);
    setShowServiceNotice(false);
    if (!getSessionNoticeFlag(COMMUNITY_NOTICE_KEY)) {
      setShowCommunityNotice(true);
    }
  }, []);

  const handleCloseCommunityNotice = useCallback(() => {
    setSessionNoticeFlag(COMMUNITY_NOTICE_KEY);
    setShowCommunityNotice(false);
  }, []);

  const heroSlides = useMemo(
    () => ([
      { id: 'landing-slide-1', image: slideOneImage, title: '' },
      { id: 'landing-slide-2', image: slideTwoImage, title: '', href: WHATSAPP_COMMUNITY_LINK },
      { id: 'landing-slide-3', image: slideThreeImage, title: '' },
    ]),
    []
  );

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: 'Normal',
      userGroupPercentage: null,
    }),
    [language, products]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(categories, storefrontProducts, language),
    [categories, storefrontProducts, language]
  );

  const visibleHomepageCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      if (category.id === 'all') return false;
      const parent = category.parentCategory;
      if (!parent) return true;
      if (typeof parent === 'string' && !parent.trim()) return true;
      return false;
    }),
    [storefrontCategories]
  );

  const handleCategorySelect = useCallback((categoryId) => {
    navigate(categoryId === 'all' ? '/products' : `/products?category=${encodeURIComponent(categoryId)}`);
  }, [navigate]);

  const handleProductSelect = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleCreateAccount = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const handleCreatedBy = useCallback(() => {
    navigate('/created-by');
  }, [navigate]);

  const handleAbout = useCallback(() => {
    navigate('/about-us');
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-5 pt-[4.75rem]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:rgb(var(--color-border-rgb)/0.32)] bg-[color:rgb(var(--color-background-rgb)/0.88)] shadow-[0_18px_44px_-34px_rgb(var(--color-primary-rgb)/0.36)] backdrop-blur-xl">
        <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2.5 sm:px-4 lg:px-6">
          <div className="flex flex-col items-start gap-2 rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/0.22)] bg-[color:rgb(var(--color-card-rgb)/0.22)] px-3 py-2 shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:px-4 sm:py-2.5">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((previous) => !previous)}
                  className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.55)] text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:text-[var(--color-primary)]"
                  aria-label={isArabic ? 'القائمة' : 'Menu'}
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
                <BrandMark size="xs" />
              </div>

              <ThemeToggle variant="glass" compact className="h-8 w-8" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
        <div className="mx-auto max-w-[var(--shell-max-width)]">
          <GoldShineButton onClick={handleLogin}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </GoldShineButton>
        </div>
      </div>

      <PublicSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onHome={handleHome}
        onAbout={handleAbout}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onGoogleLogin={handleGoogleLogin}
        onCreatedBy={handleCreatedBy}
        isBusy={false}
        isArabic={isArabic}
      />

      {showServiceNotice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/58 px-4 backdrop-blur-[7px]">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 310, damping: 27 }}
            className="relative w-full max-w-[20rem] overflow-visible rounded-[1.35rem] border border-[color:rgb(var(--color-warning-rgb)/0.24)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-elevated-rgb)/0.92))] p-4 text-center shadow-[0_26px_70px_-44px_rgb(var(--color-warning-rgb)/0.62)] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-notice-title"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgb(var(--color-warning-rgb)/0.2),transparent_58%)]" />

            <div className="relative mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[color:rgb(var(--color-warning-rgb)/0.24)] bg-[color:rgb(var(--color-warning-rgb)/0.12)] text-[var(--color-warning)] shadow-[0_14px_30px_-24px_rgb(var(--color-warning-rgb)/0.8)]">
              <AlertTriangle className="h-5.5 w-5.5" />
            </div>

            <div className="relative space-y-3">
              <h2 id="service-notice-title" className="text-base font-black leading-7 text-[var(--color-text)]">
                تنويه 📢📢 هام 💡💡
              </h2>

              <div className="space-y-2 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.58)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] p-3 text-sm font-bold leading-6 text-[var(--color-text)]">
                <p>لا يوجد استرداد لأي منتج لدينا 🚫🚫</p>
                <p className="text-[var(--color-text-secondary)]">
                  يرجى قراءة شروط الخدمة 📠
                  <br />
                  قبل إجراء أي عملية تحويل ♻️
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseServiceNotice}
                className="inline-flex h-10 w-full items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] px-4 text-sm font-extrabold text-[var(--color-button-text)] shadow-[0_18px_34px_-24px_rgb(var(--color-primary-rgb)/0.74)] transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                موافق
              </button>
            </div>

            <button
              type="button"
              onClick={handleCloseServiceNotice}
              className="absolute -bottom-14 left-1/2 -translate-x-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:rgb(var(--color-error-rgb)/0.32)] bg-[color:rgb(var(--color-card-rgb)/0.96)] text-[var(--color-error)] shadow-[0_14px_30px_-22px_rgb(var(--color-error-rgb)/0.76)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgb(var(--color-error-rgb)/0.12)]"
              aria-label={isArabic ? 'إغلاق التنويه' : 'Close notice'}
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}

      {showCommunityNotice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/58 px-4 backdrop-blur-[7px]">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 310, damping: 27 }}
            className="relative w-full max-w-[20rem] overflow-visible rounded-[1.35rem] border border-[rgba(34,197,94,0.24)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-elevated-rgb)/0.92))] p-4 text-center shadow-[0_26px_70px_-44px_rgba(34,197,94,0.54)] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-notice-title"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_58%)]" />

            <div className="relative mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.12)] text-emerald-500 shadow-[0_14px_30px_-24px_rgba(34,197,94,0.78)]">
              <MessageCircle className="h-5.5 w-5.5" />
            </div>

            <div className="relative space-y-3">
              <h2 id="community-notice-title" className="text-base font-black leading-7 text-[var(--color-text)]">
                تنويه المجتمع
              </h2>

              <div className="space-y-2 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.58)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] p-3 text-sm font-bold leading-6 text-[var(--color-text)]">
                <p>عدم متابعتك للمجتمع مسؤوليتك الشخصية</p>
                <p className="text-[var(--color-text-secondary)]">
                  واي اهمال في المتابعة تعرضك للمخاطر دون اي مسؤولية علينا
                </p>
              </div>

              <div className="flex justify-center" aria-hidden="true">
                <span className="inline-flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-[rgba(34,197,94,0.34)] bg-[rgba(34,197,94,0.12)] text-emerald-500 shadow-[0_14px_30px_-22px_rgba(34,197,94,0.9)]">
                  <ArrowDown className="h-5 w-5" />
                </span>
              </div>

              <a
                href={WHATSAPP_COMMUNITY_LINK}
                target="_blank"
                rel="noreferrer"
                onClick={handleCloseCommunityNotice}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[linear-gradient(135deg,#22c55e,#16a34a)] px-4 text-sm font-extrabold text-white shadow-[0_18px_34px_-24px_rgba(34,197,94,0.74)] transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                <MessageCircle className="h-4 w-4" />
                مجتمع الواتساب
              </a>
            </div>

            <button
              type="button"
              onClick={handleCloseCommunityNotice}
              className="absolute -bottom-14 left-1/2 -translate-x-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:rgb(var(--color-error-rgb)/0.32)] bg-[color:rgb(var(--color-card-rgb)/0.96)] text-[var(--color-error)] shadow-[0_14px_30px_-22px_rgb(var(--color-error-rgb)/0.76)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgb(var(--color-error-rgb)/0.12)]"
              aria-label={isArabic ? 'إغلاق التنويه' : 'Close notice'}
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[var(--shell-max-width)] space-y-5 sm:space-y-6">
          <HeroSlider slides={heroSlides} />

          <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
              <ProductSearchBar
                products={storefrontProducts}
                language={language}
                onSelectProduct={handleProductSelect}
                forceIconRight
                placeholder={isArabic ? 'ابحث عن منتج...' : 'Search for a product...'}
                noResultsLabel={isArabic ? 'لا يوجد منتج مطابق' : 'No matching product found'}
                className="mx-auto w-full"
                inputClassName="h-12 rounded-full"
              />
            </div>

            <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
              {visibleHomepageCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  active={false}
                  index={index}
                  onSelect={handleCategorySelect}
                />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/buy-target')}
                className="group inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.36)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] px-5 py-3 text-sm font-black text-[var(--color-button-text)] shadow-[0_20px_46px_-28px_rgb(var(--color-primary-rgb)/0.72)] transition-all hover:-translate-y-0.5 hover:brightness-105 sm:w-auto sm:min-w-[18rem]"
              >
                <Target className="h-4.5 w-4.5" />
                <span>{isArabic ? 'اضغط هنا لبيع تارجت' : 'Sell Target Here'}</span>
                <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          </section>

          <StoreFooter
            title="MS STORE"
            description={isArabic ? 'تجربة شحن راقية للألعاب والخدمات الصوتية.' : 'A refined recharge storefront.'}
            chips={[]}
            copyright={isArabic ? (
              <>
                <span className="font-semibold tracking-[0.08em] text-[var(--color-text)]">MS STORE</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.55)]" />
                <span>© 2026</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.55)]" />
                <span>جميع الحقوق محفوظة</span>
              </>
            ) : (
              <>
                <span className="font-semibold tracking-[0.08em] text-[var(--color-text)]">MS STORE</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.55)]" />
                <span>© 2026</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.55)]" />
                <span>All rights reserved</span>
              </>
            )}
            metaLine=""
          />
        </div>
      </main>
    </div>
  );
};

export default PublicCatalog;
