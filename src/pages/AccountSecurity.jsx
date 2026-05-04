import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import TwoFactorCard from '../components/account/TwoFactorCard';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../context/LanguageContext';

const AccountSecurity = () => {
  const { user } = useAuthStore();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const text = useMemo(
    () =>
      isEnglish
        ? {
            title: 'Account Protection',
            subtitle: 'Manage advanced security settings for your account.',
            securityOverview: 'Security Overview',
            securityHint:
              'Keep two-factor authentication enabled to protect your account from unauthorized access.'
          }
        : {
            title: 'حماية الحساب',
            subtitle: 'إدارة إعدادات الأمان المتقدمة الخاصة بحسابك.',
            securityOverview: 'ملخص الأمان',
            securityHint:
              'الحفاظ على تفعيل المصادقة الثنائية يساعد في حماية حسابك من الوصول غير المصرح به.'
          },
    [isEnglish]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="security-glow-card rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5 shadow-[var(--shadow-subtle)] backdrop-blur-md"
      >
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{text.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text.subtitle}</p>
      </motion.header>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="security-glow-card rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
            <ShieldCheck className="h-[18px] w-[18px] text-[var(--color-primary)]" />
            {text.securityOverview}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{text.securityHint}</p>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <TwoFactorCard
          userId={user?.id}
          email={String(user?.email || '')}
          twoFactorEnabled={Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled)}
          emailChangedPending={false}
        />
      </motion.section>
    </div>
  );
};

export default AccountSecurity;
