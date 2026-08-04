import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const SiteFooter = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <footer className="mt-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[var(--shell-max-width)] flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-[color:rgb(var(--color-border-rgb)/0.6)] px-2 pt-4 text-center text-xs text-[var(--color-muted)]">
        <span className="font-bold tracking-[0.08em] text-[var(--color-text-secondary)]">MS STORE</span>
        <span>© 2026</span>
        <span>—</span>
        <span>
          {isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
        </span>
      </div>
    </footer>
  );
};

export default SiteFooter;
