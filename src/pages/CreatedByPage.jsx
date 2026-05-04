import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpLeft,
  BadgeCheck,
  Building2,
  Globe,
  Layers3,
  Menu,
  MessageCircleMore,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Users2,
  Zap,
  LogIn,
  UserPlus,
  Home,
  ChevronLeft,
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
import digitechLogo from '../assets/digitech-solutions.png';
import ahmedImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM.jpeg';
import kareemImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM (1).jpeg';
import bahaaImage from '../assets/WhatsApp Image 2026-03-26 at 7.18.08 AM (2).jpeg';

const WHATSAPP_NUMBER = '01096451539';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/^0/, '20')}`;
const COMPANY_WEBSITE_LINK = 'https://digiteech.me/';


const services = [
  {
    title: 'تطوير المواقع',
    icon: Globe,
  },
  {
    title: 'المتاجر الإلكترونية',
    icon: Store,
  },
  {
    title: 'تطبيقات الدردشة الصوتية',
    icon: MessageCircleMore,
  },
  {
    title: 'تصميم UI/UX',
    icon: Palette,
  },
  {
    title: 'أنظمة مخصصة',
    icon: Layers3,
  },
  {
    title: 'حلول رقمية آمنة وسريعة',
    icon: ShieldCheck,
  },
];

const projects = [
  {
    name: 'MS STORE',
    category: 'متجر رقمي احترافي',
    summary:
      'نموذج عملي يجسد قدرتنا على تقديم منصة تجمع بين الأداء العالي، الثقة، وسهولة الاستخدام ضمن تجربة متقنة بصريًا ووظيفيًا.',
  },
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

const companyPrinciples = [
  {
    title: 'رؤية تنفيذية راقية',
    icon: Sparkles,
  },
  {
    title: 'ثقة تقنية حقيقية',
    icon: ShieldCheck,
  },
  {
    title: 'سرعة في الإحساس قبل الأرقام',
    icon: Zap,
  },
  {
    title: 'منتج يرفع قيمة البراند',
    icon: ArrowUpLeft,
  },
];

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const scrollSectionVariants = {
  hidden: {
    opacity: 0,
    y: 56,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.09,
    },
  },
};

const scrollCardVariants = {
  hidden: {
    opacity: 0,
    y: 42,
    scale: 0.985,
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sectionViewport = {
  once: true,
  amount: 0.18,
  margin: '0px 0px -8% 0px',
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

const CreatedByPage = () => {
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

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="admin-premium-hero relative overflow-hidden p-6 sm:p-8 lg:p-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.10),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,255,255,0.16))] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.12),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
          <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-sky-400/40 to-transparent dark:block lg:block" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-7">
              <motion.div variants={heroItemVariants} className="inline-flex">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/85 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-sky-700 shadow-[0_10px_30px_-18px_rgba(14,116,244,0.45)] backdrop-blur-xl dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
                  <BadgeCheck className="h-4 w-4" />
                  Trusted &amp; Built for MS STORE
                </span>
              </motion.div>

              <motion.div variants={heroItemVariants} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative h-36 w-full max-w-[30rem] overflow-hidden rounded-[1.8rem] border border-white/60 bg-white/90 shadow-[0_22px_55px_-28px_rgba(37,99,235,0.45)] ring-1 ring-sky-100 dark:border-white/10 dark:bg-white/10 dark:ring-white/5 sm:h-44 lg:h-48">
                    <img
                      src={digitechLogo}
                      alt="DigiTech Solutions"
                      className="absolute left-[54%] top-1/2 h-[250%] w-[250%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                    />
                  </div>
                  <div className="w-full max-w-[30rem] text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300/80">
                      DigiTech Solutions
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-3xl font-black leading-[1.25] text-slate-950 dark:text-white sm:text-4xl lg:text-[3.4rem]">
                    تصميم (منصة باسمك) أو مواقع إلكترونية باسمك، أي موقع يتصمم على مزاجك زي ما تحب.
                  </h1>
                  <div className="max-w-2xl rounded-[1.6rem] border border-cyan-200/70 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.96),rgba(34,197,94,0.08))] p-4 text-center shadow-[0_22px_55px_-36px_rgba(14,165,233,0.38)] backdrop-blur-xl dark:border-cyan-400/20 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(255,255,255,0.04),rgba(34,197,94,0.10))] sm:p-5">
                
                    <motion.a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -4, scale: 1.06 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                      className="group relative mt-4 inline-flex items-center justify-center"
                    >
                      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[142%] w-[126%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/22 blur-2xl opacity-70" />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[108%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/25 opacity-75" />
                      <span className="relative isolate inline-flex items-center justify-center gap-3 overflow-hidden rounded-[1.15rem] border border-emerald-200/45 bg-[linear-gradient(135deg,#0f9f47_0%,#18b158_36%,#25d366_70%,#63f3a7_100%)] px-6 py-3 text-sm font-extrabold text-white shadow-[0_24px_56px_-20px_rgba(22,163,74,0.85)] sm:px-7 sm:text-base">
                        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),transparent_58%)]" />
                        <motion.span
                          aria-hidden="true"
                          className="absolute left-[-42%] top-[-18%] h-[136%] w-[32%] rotate-[14deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),rgba(255,255,255,0.82),rgba(255,255,255,0.16),transparent)] blur-[1px] mix-blend-screen"
                          animate={{ x: ['-150%', '430%'] }}
                          transition={{ duration: 2.25, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.9 }}
                        />
                        <MessageCircleMore className="relative h-5 w-5" />
                        <span className="relative">تواصل معنا الآن</span>
                      </span>
                    </motion.a>

                    <motion.a
                      href={COMPANY_WEBSITE_LINK}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -4, scale: 1.04 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                      className="group relative mt-3 inline-flex items-center justify-center"
                    >
                      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.26),rgba(14,165,233,0.18),transparent_72%)] blur-2xl opacity-75" />
                      <span className="relative inline-flex items-center justify-center gap-2.5 rounded-[1.05rem] border border-cyan-200/60 bg-[linear-gradient(135deg,rgba(8,145,178,0.96),rgba(14,165,233,0.96),rgba(34,197,94,0.92))] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_18px_40px_-18px_rgba(14,165,233,0.75)] backdrop-blur-xl transition-all duration-200 group-hover:border-cyan-300 group-hover:shadow-[0_22px_48px_-18px_rgba(14,165,233,0.92)] sm:px-6 sm:text-base">
                        <Globe className="relative h-4.5 w-4.5" />
                        <span className="relative">اضغط هنا لعرض اعمالنا</span>
                      </span>
                    </motion.a>
                  </div>
                  <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300/80 sm:text-lg">
                    نصمم مواقع ومتاجر وتطبيقات حديثة تجمع بين الجمال، السرعة، والثقة لتظهر علامتك التجارية بالشكل الذي تستحقه.
                  </p>
                </div>
              </motion.div>

            </div>

            <motion.div variants={heroItemVariants} className="relative">
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/75 bg-white/90 p-5 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_28%)]" />
                <div className="relative space-y-4">
                  <div className="rounded-[1.35rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(235,245,255,0.82))] p-3.5 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                          Digital Excellence
                        </p>
                        <h2 className="mt-1.5 text-xl font-extrabold text-slate-900 dark:text-white">
                          نبني الثقة قبل أن نبني الواجهة
                        </h2>
                      </div>
                      <div className="rounded-full border border-sky-200/70 bg-sky-50 px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                        Premium
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2.5">
                    {[
                      'مظهر بصري فاخر يعكس قيمة البراند.',
                      'أداء سريع وتجربة استخدام واضحة.',
                      'تفاصيل مدروسة ترفع ثقة العميل.',
                    ].map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-2.5 rounded-[1.05rem] border border-slate-200/75 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                          <BadgeCheck className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-xs leading-6 text-slate-700 dark:text-slate-300/85 sm:text-sm">{point}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[1.1rem] border border-slate-200/75 bg-slate-900 px-3.5 py-4 text-white dark:border-white/10 dark:bg-slate-950">
                      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-sky-300">Premium Delivery</p>
                      <p className="mt-1.5 text-xs leading-6 text-slate-200 sm:text-sm">
                        من الفكرة وحتى الإطلاق، نعمل بمنهجية تمنح المشروع حضورًا راقيًا وتجربة متماسكة.
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] border border-orange-200/80 bg-orange-50/90 px-3.5 py-4 dark:border-orange-400/20 dark:bg-orange-500/10">
                      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Brand Impact</p>
                      <p className="mt-1.5 text-xs leading-6 text-slate-700 dark:text-slate-200/90 sm:text-sm">
                        نصمم ما يترك أثرًا بصريًا ونفسيًا يجعل مشروعك يبدو أقوى وأكثر إقناعًا.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          variants={scrollSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          className="space-y-5"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/85 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
              <Users2 className="h-4 w-4" />
              فريق DigiTech Solutions
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300/80">
              خبرات متخصصة تعمل بروح واحدة: بناء منتج يليق بطموحك
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-y-8">
            {team.map((member) => (
              <motion.div
                key={member.name}
                variants={scrollCardVariants}
                whileHover={{ y: -4 }}
                className="will-change-transform flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_68%)] blur-xl dark:bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_68%)]" />
                  <img
                    src={member.image}
                    alt={member.name}
                    className="relative h-24 w-24 rounded-full border border-slate-200/80 object-cover shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] dark:border-white/10 sm:h-28 sm:w-28"
                  />
                </div>
                <h3 className="mt-4 text-sm font-black tracking-[0.04em] text-slate-950 dark:text-white sm:text-base">
                  {member.name}
                </h3>
                <p className="mt-2 max-w-[19rem] text-xs leading-6 text-slate-600 dark:text-slate-300/75 sm:text-sm">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={scrollSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50/85 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200">
              <Sparkles className="h-4 w-4" />
              أبرز خدماتنا
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              خدمات مصممة لتجعل مشروعك يبدو أقوى ويعمل أفضل
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300/80">
              خدماتنا مصممة لتمنح مشروعك حضورًا أقوى وتجربة استخدام أكثر أناقة ووضوحًا.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4">
            {services.map((service) => (
              <motion.div
                key={service.title}
                variants={scrollCardVariants}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group will-change-transform relative overflow-hidden rounded-[1.25rem] border border-slate-300/80 bg-white/95 p-4 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.42)] backdrop-blur-xl transition-all dark:border-white/12 dark:bg-white/[0.06] sm:p-5"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_35%)]" />
                <div className="relative flex min-h-[8.5rem] flex-col items-center justify-center text-center sm:min-h-[9.25rem]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#0f4cdb,#1d4ed8_55%,#f97316)] text-white shadow-[0_20px_36px_-24px_rgba(37,99,235,0.95)] transition-transform duration-300 group-hover:scale-105 sm:h-[3.25rem] sm:w-[3.25rem]">
                    <service.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-extrabold leading-6 text-slate-900 dark:text-white sm:text-base">
                    {service.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={scrollSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/85 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <BadgeCheck className="h-4 w-4" />
              نفذنا مشاريع ناجحة مثل
            </div>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300/80">
              MS STORE مثال واضح على قدرتنا على تنفيذ حلول رقمية قوية تجمع بين الأداء والثقة وسهولة الاستخدام.
            </p>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <motion.div
                key={project.name}
                variants={scrollCardVariants}
                whileHover={{ y: -6 }}
                className="will-change-transform relative overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] sm:p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.1),transparent_24%)]" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      {project.category}
                    </div>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">{project.name}</h3>
                    <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300/80">{project.summary}</p>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white dark:border-white/10">
                    <span className="text-xs uppercase tracking-[0.24em] text-sky-300">Showcase Project</span>
                    <p className="text-lg font-bold">حل رقمي يوازن بين الجمال العملي والقوة التشغيلية</p>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <BadgeCheck className="h-4 w-4 text-emerald-300" />
                      تجربة موثوقة قابلة للتوسع
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={scrollSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          className="space-y-5"
        >
          <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-4">
            {companyPrinciples.map((item) => (
              <motion.div
                key={item.title}
                variants={scrollCardVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group will-change-transform relative overflow-hidden rounded-[1.1rem] border border-slate-300/80 bg-white/95 p-3 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.06] sm:p-4"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_35%)]" />
                <div className="relative flex min-h-[6.75rem] flex-col items-center justify-center text-center sm:min-h-[7.25rem]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#0f4cdb,#2aa7ff_58%,#f97316)] text-white shadow-[0_18px_32px_-20px_rgba(37,99,235,0.9)] transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-extrabold leading-5 text-slate-900 dark:text-white sm:text-sm">
                    {item.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.section>

        <motion.footer
          variants={scrollSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          className="pb-4 pt-2 text-center"
        >
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500 dark:text-slate-400">
            نصمم تجارب رقمية تليق بطموحك وتمنح مشروعك حضورًا يفرض احترامه.
          </p>
        </motion.footer>
      </main>
    </div>
  );
};

export default CreatedByPage;
