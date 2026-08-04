import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Target } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import StoreFooter from '../components/home/StoreFooter';
import slideOneHeroImage from '../assets/سلايد 1.jpg';
import slideTwoHeroImage from '../assets/سلايد 2.jpg';
import slideThreeHeroImage from '../assets/سلايد 3.jpg';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';

const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/HMAlI6AfDndJ8VSMiqeHOs';

const Dashboard = () => {
  const { user, refreshProfile } = useAuthStore();
  const { categories, products, loadProducts } = useMediaStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const language = getStorefrontLanguage(i18n);

  useEffect(() => {
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    loadProducts({ force: true });
  }, [loadProducts]);

  const heroSlides = useMemo(() => ([
    { id: 'landing-slide-1', image: slideOneHeroImage, title: '' },
    { id: 'landing-slide-2', image: slideTwoHeroImage, title: '', href: WHATSAPP_COMMUNITY_LINK },
    { id: 'landing-slide-3', image: slideThreeHeroImage, title: '' },
  ]), []);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: user?.groupId || user?.group || 'Normal',
      userGroupPercentage: user?.groupPercentage ?? null,
    }),
    [groupsLastLoadedAt, language, products, user?.group, user?.groupId, user?.groupPercentage]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(categories, storefrontProducts, language),
    [categories, storefrontProducts, language]
  );

  const visibleHomepageCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      if (category.id === 'all') return false;
      const p = category.parentCategory;
      if (!p) return true;
      if (typeof p === 'string' && !p.trim()) return true;
      return false;
    }),
    [storefrontCategories]
  );

  const handleCategorySelect = useCallback((categoryId) => {
    navigate(categoryId === 'all' ? '/products' : `/products?category=${encodeURIComponent(categoryId)}`);
  }, [navigate]);

  const handleProductSelect = useCallback((product) => {
    const next = new URLSearchParams();
    if (product?.category) next.set('category', product.category);
    next.set('request', product.id);
    navigate(`/products?${next.toString()}`);
  }, [navigate]);

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      <section className="group relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-2 py-1.5 shadow-[0_12px_28px_-26px_rgb(var(--color-primary-rgb)/0.68)] backdrop-blur-xl">
        <span className="pointer-events-none absolute -end-6 -top-8 h-16 w-16 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.09)] blur-xl" />

        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>

            <p className="truncate text-start text-[9px] font-semibold text-[var(--color-text-secondary)] sm:text-[10px]">
              {language === 'ar'
                ? 'حرصًا على أمان حسابك، فعّل المصادقة الثنائية.'
                : 'Keep your account safer with two-factor authentication.'}
            </p>
          </div>

          <Link
            to="/account-security"
            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.35)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft))] px-2.5 text-[9px] font-extrabold text-[var(--color-button-text)] shadow-[0_9px_18px_-15px_rgb(var(--color-primary-rgb)/0.8)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgb(var(--color-primary-rgb)/0.25)]"
          >
            {language === 'ar' ? 'تفعيل الآن' : 'Enable now'}
          </Link>
        </div>
      </section>

      <HeroSlider slides={heroSlides} />

      <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl justify-center px-2 sm:px-4">
          <ProductSearchBar products={storefrontProducts} language={language} onSelectProduct={handleProductSelect} forceIconRight placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'} noResultsLabel={language === 'ar' ? 'لا يوجد منتج مطابق' : 'No matching product found'} className="mx-auto w-full" inputClassName="h-10 rounded-full sm:h-11" />
        </div>

        <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {visibleHomepageCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={false} index={index} onSelect={handleCategorySelect} />
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link
            to="/buy-target"
            className="group relative inline-flex h-11 w-full max-w-sm items-center gap-2 overflow-hidden rounded-[0.95rem] border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-primary-rgb)/0.09))] p-1.5 pe-2.5 text-[var(--color-text)] shadow-[0_16px_34px_-28px_rgb(var(--color-primary-rgb)/0.72)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.5)] hover:shadow-[0_20px_38px_-26px_rgb(var(--color-primary-rgb)/0.82)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft))] text-[var(--color-button-text)] shadow-[0_10px_20px_-14px_rgb(var(--color-primary-rgb)/0.92)]">
              <Target className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1 text-start text-[11px] font-extrabold sm:text-xs">
              {language === 'ar' ? 'بيع تارجت' : 'Sell Target'}
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] text-[var(--color-primary)]">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      <StoreFooter variant="home" description={language === 'ar' ? 'تجربة شحن راقية للألعاب والخدمات الصوتية.' : 'A refined recharge storefront.'} chips={[]} copyright={language === 'ar' ? (
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
      )} metaLine="" />

    </div>
  );
};

export default Dashboard;
