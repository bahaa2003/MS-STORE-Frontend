import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Globe,
  Layers3,
  MessageCircleMore,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Users2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import { cn } from '../components/ui/Button';
import PublicSidebar from '../components/layout/PublicSidebar';
import PublicHeader from '../components/layout/PublicHeader';
import PublicLoginButton from '../components/ui/PublicLoginButton';
import digitechLogo from '../assets/digitech.png';
import ahmedImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM.jpeg';
import kareemImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM (1).jpeg';
import bahaaImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM (2).jpeg';

const WHATSAPP_NUMBER = '01096451539';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/^0/, '20')}`;
const COMPANY_WEBSITE_LINK = 'https://digiteech.me/';

const services = [
  { title: 'تطوير المواقع', icon: Globe },
  { title: 'المتاجر الإلكترونية', icon: Store },
  { title: 'تطبيقات الدردشة الصوتية', icon: MessageCircleMore },
  { title: 'تصميم UI/UX', icon: Palette },
  { title: 'أنظمة مخصصة', icon: Layers3 },
  { title: 'حلول رقمية آمنة وسريعة', icon: ShieldCheck },
];

const team = [
  {
    name: 'ENG: AHMED ELSHARKAWY',
    role: 'مهندس برمجيات ومسؤول الشركة ومتخصص Frontend Development',
    image: ahmedImage,
  },
  {
    name: 'ENG: KAREEM MOHAMED',
    role: 'مهندس برمجيات ومدير الشركة ومتخصص Cyber Security',
    image: kareemImage,
  },
  {
    name: 'ENG: BAHAA MOHAMED',
    role: 'مهندس برمجيات وأحد أفضل مؤسسي الشركة ومتخصص Backend Development',
    image: bahaaImage,
  },
];

const SectionTitle = ({ icon: Icon, label, title, description, tone = 'sky' }) => {
  const toneClasses = {
    sky: 'border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[color:rgb(var(--color-primary-rgb)/0.09)] text-[var(--color-primary)]',
    orange: 'border-orange-200/70 bg-orange-50/85 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200',
    emerald: 'border-emerald-200/70 bg-emerald-50/85 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  };

  return (
    <div className="text-center">
      <div className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.16em]', toneClasses[tone])}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {title ? (
        <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-black leading-snug text-slate-950 dark:text-white sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300/80 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
};

const CreatedByPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isArabic = i18n.resolvedLanguage === 'ar';

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleCreateAccount = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAbout = useCallback(() => {
    navigate('/about-us');
  }, [navigate]);

  const handleCreatedBy = useCallback(() => {
    navigate('/created-by');
  }, [navigate]);

  return (
    <div className={cn(embedded ? 'min-h-0 pb-2' : 'min-h-screen pb-5 pt-[4.9rem] sm:pt-[6.5rem]')}>
      {!embedded ? (
        <>
          <PublicHeader
            isArabic={isArabic}
            onMenuToggle={() => setIsMenuOpen((previous) => !previous)}
            onHome={handleHome}
          />

          <div className="px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
            <div className="mx-auto max-w-[var(--shell-max-width)]">
              <PublicLoginButton onClick={handleLogin}>
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </PublicLoginButton>
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
        </>
      ) : null}

      <main className={cn(
        'relative z-10 mx-auto flex w-full flex-col gap-5',
        embedded ? 'max-w-none px-0 py-0' : 'max-w-6xl px-4 py-5 sm:px-6 lg:px-8'
      )}>
        <section className="admin-premium-hero relative overflow-hidden p-4 sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(var(--color-primary-rgb)/0.14),transparent_36%),linear-gradient(145deg,rgb(var(--color-card-rgb)/0.72),rgb(var(--color-surface-rgb)/0.3))]" />
          <div className="relative mx-auto w-full max-w-5xl">
            <div className="grid gap-5 md:grid-cols-[15rem_1fr] md:items-center">
              <div>
                <div className="relative mx-auto w-full max-w-[15rem]">
                  <div className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-[radial-gradient(circle,rgb(var(--color-primary-rgb)/0.2),transparent_66%)] blur-xl" />
                  <div className="relative h-48 w-full overflow-hidden rounded-[1.5rem] border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-primary-rgb)/0.1))] shadow-[0_24px_56px_-36px_rgb(var(--color-primary-rgb)/0.5)]">
                    <div className="digitech-logo-float relative z-10 flex h-full w-full items-center justify-center">
                      <img
                        src={digitechLogo}
                        alt="DigiTech Solutions"
                        className="h-[82%] w-[82%] object-contain drop-shadow-[0_18px_30px_rgb(var(--color-primary-rgb)/0.26)]"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
                  DigiTech Solutions
                </p>
              </div>

              <div className="space-y-3 text-center md:text-right">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[color:rgb(var(--color-primary-rgb)/0.09)] px-3 py-1.5 text-[10px] font-bold text-[var(--color-primary)]">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  تنفيذ DigiTech Solutions
                </span>
                <h1 className="text-2xl font-black leading-[1.35] text-[var(--color-text)] sm:text-3xl">
                  نصنع تجارب رقمية تليق بفكرتك
                </h1>
                <p className="text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                  فريق متخصص في تطوير المواقع والمتاجر والحلول الرقمية بتصميم أنيق وأداء موثوق.
                </p>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-[#18b158] px-4 text-xs font-extrabold text-white shadow-[0_16px_30px_-22px_rgba(22,163,74,0.72)] transition hover:brightness-105"
                  >
                    <MessageCircleMore className="h-5 w-5" />
                    تواصل معنا الآن
                  </a>
                  <a
                    href={COMPANY_WEBSITE_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft))] px-4 text-xs font-extrabold text-[var(--color-button-text)] shadow-[0_16px_30px_-22px_rgb(var(--color-primary-rgb)/0.68)] transition hover:brightness-105"
                  >
                    <Globe className="h-4.5 w-4.5" />
                    عرض أعمالنا
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle
            icon={Users2}
            label="فريق DigiTech Solutions"
          />

          <div className="mx-auto grid w-full max-w-5xl gap-3 md:grid-cols-3">
            {team.map((member) => (
              <article
                key={member.name}
                className="flex items-center gap-3 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.84)] p-3 text-right shadow-[var(--shadow-subtle)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.32)]"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-16 w-16 shrink-0 rounded-[0.9rem] border border-[color:rgb(var(--color-primary-rgb)/0.25)] object-cover shadow-[0_14px_28px_-22px_rgb(0_0_0/0.52)]"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-black text-[var(--color-text)]">{member.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-[var(--color-text-secondary)]">{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle
            icon={Sparkles}
            label="أبرز خدماتنا"
          />

          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="flex items-center gap-2.5 rounded-[0.95rem] border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.82)] p-2.5 shadow-[var(--shadow-subtle)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.32)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft))] text-[var(--color-button-text)] shadow-[0_12px_24px_-18px_rgb(var(--color-primary-rgb)/0.72)]">
                  <service.icon className="h-4 w-4" />
                </div>
                <h3 className="text-right text-xs font-extrabold leading-5 text-[var(--color-text)]">
                  {service.title}
                </h3>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default CreatedByPage;
