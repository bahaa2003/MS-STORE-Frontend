import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, LogIn, Menu, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import BrandMark from '../components/layout/BrandMark';
import PublicSidebar from '../components/layout/PublicSidebar';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../utils/whatsapp';

const GoldShineButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-full border border-[#d8b36b]/75 bg-[linear-gradient(180deg,#f6e4a2_0%,#d4af37_48%,#b98a1e_100%)] px-4 text-sm font-extrabold text-white shadow-[0_18px_34px_-20px_rgba(212,175,55,0.95)] transition-all hover:-translate-y-0.5"
  >
    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_42%)] opacity-85" />
    <span className="absolute left-[18%] top-[-18%] h-[140%] w-[18%] rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),rgba(255,255,255,0.52),rgba(255,255,255,0.16),transparent)] blur-[1px] mix-blend-screen" />
    <span className="relative z-10 flex items-center gap-2">
      <LogIn className="h-4 w-4" />
      {children}
    </span>
  </button>
);

const AboutUsPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');

  const whatsappLink = useMemo(() => buildWhatsAppLink({
    number: getAdminWhatsAppNumber(),
    message: isArabic
      ? 'مرحبا، أريد التواصل مع خدمة العملاء بخصوص شكوى.'
      : 'Hello, I want to contact customer support about a complaint.',
  }), [isArabic]);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:rgb(var(--color-border-rgb)/0.32)] bg-[color:rgb(var(--color-bg-rgb)/0.88)] shadow-[0_18px_44px_-34px_rgb(var(--color-primary-rgb)/0.28)] backdrop-blur-md">
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

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-4xl items-center justify-center"
        >
          <div className="w-full overflow-hidden rounded-[2rem] border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.88),rgb(var(--color-elevated-rgb)/0.7))] p-6 text-center shadow-[0_30px_80px_-56px_rgb(var(--color-primary-rgb)/0.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="mx-auto mb-6 flex justify-center">
              <BrandMark size="md" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black text-[var(--color-text)] sm:text-4xl">
                {isArabic ? 'من نحن' : 'About us'}
              </h1>
              <p className="mx-auto max-w-2xl text-lg font-semibold leading-9 text-[var(--color-text)]">
                {isArabic
                  ? 'موقعنا يقدم خدمات شحن التطبيقات و الالعاب'
                  : 'Our website provides app and game top-up services.'}
              </p>
            </div>

            <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { icon: Zap, label: isArabic ? 'سرعة' : 'Speed' },
                { icon: CheckCircle2, label: isArabic ? 'دقة' : 'Accuracy' },
                { icon: ShieldCheck, label: isArabic ? 'مصداقية في العمل' : 'Trust in our work' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-4 py-3 text-sm font-bold text-[var(--color-text)]"
                >
                  <item.icon className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-xl rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-surface-rgb)/0.48)] p-4">
              <p className="text-sm font-semibold leading-7 text-[var(--color-text-secondary)]">
                {isArabic
                  ? 'للشكوي تواصل مع خدمه العملاء'
                  : 'For complaints, contact customer support.'}
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-400/45 bg-[linear-gradient(135deg,#22c55e,#16a34a)] px-4 text-sm font-extrabold text-white shadow-[0_18px_34px_-22px_rgba(34,197,94,0.9)] transition-all hover:-translate-y-0.5 sm:w-auto"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                {isArabic ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
              </a>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default AboutUsPage;
