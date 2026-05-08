import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Target } from 'lucide-react';
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
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[color:rgb(var(--color-warning-rgb)/0.35)] bg-[color:rgb(var(--color-warning-rgb)/0.12)] px-2.5 py-2 text-center text-[10px] text-[var(--color-text)] sm:px-3 sm:py-2.5 sm:text-[11px]">
        {language === 'ar' ? (
          <p className="leading-5 sm:leading-[1.35rem]">
            <span aria-hidden="true" className="me-1 text-[color:rgb(var(--color-warning-rgb)/0.95)]">⚠</span>
            حرصا على أمان حسابك يجب تفعيل{' '}
            <Link to="/account-security" className="font-semibold text-[color:rgb(var(--color-warning-rgb)/0.95)] underline underline-offset-2 hover:text-[color:rgb(var(--color-warning-rgb)/0.78)]">
              المصادقة الثنائية
            </Link>
            .
          </p>
        ) : (
          <p className="leading-5 sm:leading-[1.35rem]">
            <span aria-hidden="true" className="me-1 text-[color:rgb(var(--color-warning-rgb)/0.95)]">⚠</span>
            For your account safety, you should enable{' '}
            <Link to="/account-security" className="font-semibold text-[color:rgb(var(--color-warning-rgb)/0.95)] underline underline-offset-2 hover:text-[color:rgb(var(--color-warning-rgb)/0.78)]">
              two-factor authentication
            </Link>
            .
          </p>
        )}
      </section>

      <HeroSlider slides={heroSlides} />

      <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
          <ProductSearchBar products={storefrontProducts} language={language} onSelectProduct={handleProductSelect} forceIconRight placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'} noResultsLabel={language === 'ar' ? 'لا يوجد منتج مطابق' : 'No matching product found'} className="mx-auto w-full" inputClassName="h-12 rounded-full" />
        </div>

        <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {visibleHomepageCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={false} index={index} onSelect={handleCategorySelect} />
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link
            to="/buy-target"
            className="group inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.36)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] px-5 py-3 text-sm font-black text-[var(--color-button-text)] shadow-[0_20px_46px_-28px_rgb(var(--color-primary-rgb)/0.72)] transition-all hover:-translate-y-0.5 hover:brightness-105 sm:w-auto sm:min-w-[18rem]"
          >
            <Target className="h-4.5 w-4.5" />
            <span>{language === 'ar' ? 'اضغط هنا لبيع تارجت' : 'Sell Target Here'}</span>
            <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </section>

      <StoreFooter title="MS STORE" description={language === 'ar' ? 'تجربة شحن راقية للألعاب والخدمات الصوتية.' : 'A refined recharge storefront.'} chips={[]} copyright={language === 'ar' ? (
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
