import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import BrandMark from '../components/layout/BrandMark';
import PublicHeader from '../components/layout/PublicHeader';
import PublicSidebar from '../components/layout/PublicSidebar';
import PublicLoginButton from '../components/ui/PublicLoginButton';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../utils/whatsapp';

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
    <div className="min-h-screen pb-5 pt-[4.9rem] sm:pt-[6.5rem]">
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
