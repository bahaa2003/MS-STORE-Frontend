import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpLeft,
  BadgeCheck,
  Building2,
  Globe,
  Layers3,
  LogIn,
  Menu,
  MessageCircleMore,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Users2,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import { cn } from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import BrandMark from '../components/layout/BrandMark';
import PublicSidebar from '../components/layout/PublicSidebar';
import digitechLogo from '../assets/digitech.jpg';
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

const principles = [
  { title: 'رؤية تنفيذية واضحة', icon: Sparkles },
  { title: 'ثقة تقنية حقيقية', icon: ShieldCheck },
  { title: 'سرعة وتجربة مستقرة', icon: Zap },
  { title: 'منتج يرفع قيمة البراند', icon: ArrowUpLeft },
];

const GoldButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d8b36b]/75 bg-[linear-gradient(180deg,#f6e4a2_0%,#d4af37_52%,#b98a1e_100%)] px-4 text-sm font-extrabold text-white shadow-[0_16px_30px_-22px_rgba(184,138,30,0.85)] transition hover:-translate-y-0.5 hover:brightness-105"
  >
    <LogIn className="h-4 w-4" />
    {children}
  </button>
);

const SectionTitle = ({ icon: Icon, label, title, description, tone = 'sky' }) => {
  const toneClasses = {
    sky: 'border-sky-200/70 bg-sky-50/85 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200',
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
    <div className={cn(embedded ? 'min-h-0 pb-2' : 'min-h-screen pb-5 pt-[4.75rem]')}>
      {!embedded ? (
        <>
          <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:rgb(var(--color-border-rgb)/0.32)] bg-[color:rgb(var(--color-bg-rgb)/0.9)] shadow-[0_18px_44px_-34px_rgb(var(--color-primary-rgb)/0.28)] backdrop-blur-md">
            <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2.5 sm:px-4 lg:px-6">
              <div className="flex items-center justify-between gap-2 rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.22)] bg-[color:rgb(var(--color-card-rgb)/0.22)] px-3 py-2 shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((previous) => !previous)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.55)] text-[var(--color-text)] transition hover:text-[var(--color-primary)]"
                    aria-label={isArabic ? 'القائمة' : 'Menu'}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <BrandMark size="xs" />
                </div>

                <ThemeToggle variant="glass" compact className="h-8 w-8" />
              </div>
            </div>
          </header>

          <div className="px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
            <div className="mx-auto max-w-[var(--shell-max-width)]">
              <GoldButton onClick={handleLogin}>
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </GoldButton>
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
        'relative z-10 mx-auto flex w-full flex-col gap-8',
        embedded ? 'max-w-none px-0 py-0' : 'max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
      )}>
        <section className="admin-premium-hero relative overflow-hidden p-5 sm:p-7 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.12))] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/85 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-sky-700 shadow-[0_10px_30px_-20px_rgba(14,116,244,0.38)] backdrop-blur-xl dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
                <BadgeCheck className="h-4 w-4" />
                Trusted &amp; Built for MS STORE
              </span>

              <div className="space-y-4">
                <div className="relative w-full max-w-[46rem]">
                  <div className="pointer-events-none absolute -inset-3 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_50%,rgba(14,116,244,0.22),transparent_42%),radial-gradient(circle_at_72%_50%,rgba(249,115,22,0.2),transparent_40%)] opacity-75 blur-2xl dark:opacity-85" />
                  <div className="relative h-[16.5rem] w-full overflow-hidden rounded-[2rem] border border-slate-200/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(230,241,255,0.94)_50%,rgba(255,241,224,0.9))] shadow-[0_28px_74px_-42px_rgba(2,8,23,0.42)] ring-1 ring-white/75 dark:border-white/12 dark:bg-[linear-gradient(135deg,rgba(7,15,30,0.96),rgba(10,27,52,0.92)_50%,rgba(52,27,16,0.84))] dark:ring-white/10 sm:h-[21rem] lg:h-[23.5rem] xl:h-[25rem]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,rgba(14,116,244,0.16),transparent_34%),radial-gradient(circle_at_72%_48%,rgba(249,115,22,0.15),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.42),transparent_54%)] dark:bg-[radial-gradient(circle_at_28%_48%,rgba(14,116,244,0.3),transparent_36%),radial-gradient(circle_at_72%_48%,rgba(249,115,22,0.24),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_56%)]" />
                    <div className="digitech-logo-float relative z-10 flex h-full w-full items-center justify-center">
                      <img
                        src={digitechLogo}
                        alt="DigiTech Solutions"
                        className="h-full w-full scale-[1.28] object-cover sm:scale-[1.32] lg:scale-[1.36]"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
                <p className="max-w-[46rem] text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300/80">
                  DigiTech Solutions
                </p>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-3xl font-black leading-[1.25] text-slate-950 dark:text-white sm:text-4xl lg:text-[3.1rem]">
                  تصميم منصات ومواقع باسمك، بتنفيذ يليق بفكرتك وشكل البراند الذي تريده.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300/80 sm:text-lg">
                  نصمم مواقع ومتاجر وتطبيقات حديثة تجمع بين الجمال، السرعة، والثقة لتظهر علامتك التجارية بالشكل الذي تستحقه.
                </p>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-[1rem] border border-emerald-200/45 bg-[#18b158] px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_34px_-22px_rgba(22,163,74,0.72)] transition hover:-translate-y-0.5 hover:bg-[#12a24f]"
                  >
                    <MessageCircleMore className="h-5 w-5" />
                    تواصل معنا الآن
                  </a>
                  <a
                    href={COMPANY_WEBSITE_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 rounded-[1rem] border border-cyan-200/60 bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_34px_-24px_rgba(14,165,233,0.72)] transition hover:-translate-y-0.5 hover:bg-sky-500"
                  >
                    <Globe className="h-4.5 w-4.5" />
                    عرض أعمالنا
                  </a>
                </div>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/75 bg-white/88 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
              <div className="space-y-4">
                <div className="rounded-[1.2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(235,245,255,0.82))] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Digital Excellence
                      </p>
                      <h2 className="mt-1.5 text-xl font-extrabold text-slate-900 dark:text-white">
                        نبني الثقة قبل أن نبني الواجهة
                      </h2>
                    </div>
                    <span className="rounded-full border border-sky-200/70 bg-sky-50 px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                      Premium
                    </span>
                  </div>
                </div>

                {[
                  'مظهر بصري فاخر يعكس قيمة البراند.',
                  'أداء سريع وتجربة استخدام واضحة.',
                  'تفاصيل مدروسة ترفع ثقة العميل.',
                ].map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-2.5 rounded-[1rem] border border-slate-200/75 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs leading-6 text-slate-700 dark:text-slate-300/85 sm:text-sm">{point}</p>
                  </div>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.1rem] border border-slate-200/75 bg-slate-950 px-4 py-4 text-white dark:border-white/10">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-sky-300">Premium Delivery</p>
                    <p className="mt-2 text-xs leading-6 text-slate-200 sm:text-sm">
                      من الفكرة وحتى الإطلاق، بمنهجية تمنح المشروع حضورًا راقيًا وتجربة متماسكة.
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-orange-200/80 bg-orange-50/90 px-4 py-4 dark:border-orange-400/20 dark:bg-orange-500/10">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Brand Impact</p>
                    <p className="mt-2 text-xs leading-6 text-slate-700 dark:text-slate-200/90 sm:text-sm">
                      نصمم ما يترك أثرًا بصريًا يجعل مشروعك يبدو أقوى وأكثر إقناعًا.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            icon={Users2}
            label="فريق DigiTech Solutions"
            description="خبرات متخصصة تعمل بروح واحدة: بناء منتج يليق بطموحك."
          />

          <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
            {team.map((member) => (
              <article
                key={member.name}
                className="rounded-[1.35rem] border border-slate-200/75 bg-white/88 p-4 text-center shadow-[0_18px_44px_-34px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05]"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="mx-auto h-24 w-24 rounded-full border border-slate-200/80 object-cover shadow-[0_16px_34px_-24px_rgba(15,23,42,0.45)] dark:border-white/10 sm:h-28 sm:w-28"
                  loading="lazy"
                />
                <h3 className="mt-4 text-sm font-black tracking-[0.02em] text-slate-950 dark:text-white">
                  {member.name}
                </h3>
                <p className="mx-auto mt-2 max-w-[18rem] text-xs leading-6 text-slate-600 dark:text-slate-300/75">
                  {member.role}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionTitle
            icon={Sparkles}
            label="أبرز خدماتنا"
            title="خدمات مصممة لتجعل مشروعك يبدو أقوى ويعمل أفضل"
            description="نمنح مشروعك حضورًا أوضح وتجربة استخدام أكثر أناقة واستقرارًا."
            tone="orange"
          />

          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-[1.15rem] border border-slate-300/70 bg-white/92 p-4 text-center shadow-[0_18px_44px_-34px_rgba(15,23,42,0.26)] transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-white/[0.05]"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#0f4cdb,#1d4ed8_55%,#f97316)] text-white shadow-[0_16px_30px_-22px_rgba(37,99,235,0.85)]">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold leading-6 text-slate-900 dark:text-white">
                  {service.title}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionTitle
            icon={BadgeCheck}
            label="نفذنا مشاريع ناجحة مثل"
            description="MS STORE مثال واضح على قدرتنا على تنفيذ حلول رقمية قوية تجمع بين الأداء والثقة وسهولة الاستخدام."
            tone="emerald"
          />

          <article className="relative overflow-hidden rounded-[1.6rem] border border-slate-200/70 bg-white/88 p-5 shadow-[0_22px_58px_-40px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.05] sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                  <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  متجر رقمي احترافي
                </div>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">MS STORE</h3>
                <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300/80">
                  نموذج عملي يجسد قدرتنا على تقديم منصة تجمع بين الأداء العالي، الثقة، وسهولة الاستخدام ضمن تجربة متقنة بصريًا ووظيفيًا.
                </p>
              </div>

              <div className="min-w-[220px] rounded-[1.25rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white dark:border-white/10">
                <span className="text-xs uppercase tracking-[0.2em] text-sky-300">Showcase Project</span>
                <p className="mt-2 text-lg font-bold">حل رقمي يوازن بين الجمال العملي والقوة التشغيلية</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  تجربة موثوقة قابلة للتوسع
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {principles.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.05rem] border border-slate-300/75 bg-white/92 p-3 text-center shadow-[0_16px_38px_-30px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-white/[0.05]"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#0f4cdb,#2aa7ff_58%,#f97316)] text-white">
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-2.5 text-xs font-extrabold leading-5 text-slate-900 dark:text-white">
                {item.title}
              </h3>
            </article>
          ))}
        </section>

        <footer className="pb-4 pt-2 text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400">
            نصمم تجارب رقمية تليق بطموحك وتمنح مشروعك حضورًا يفرض احترامه.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CreatedByPage;
