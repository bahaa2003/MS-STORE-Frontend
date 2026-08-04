import React from 'react';
import { Menu } from 'lucide-react';
import BrandMark from './BrandMark';
import ThemeToggle from '../ui/ThemeToggle';

const PublicHeader = ({ isArabic = true, onMenuToggle, onHome }) => (
  <header dir={isArabic ? 'rtl' : 'ltr'} className="fixed inset-x-3 top-3 z-50 sm:inset-x-4 sm:top-4">
    <div className="app-shell-header-panel w-full overflow-visible rounded-[20px] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.74),rgb(var(--color-elevated-rgb)/0.58))] px-2.5 py-1.5 shadow-[var(--shadow-medium)] backdrop-blur-[22px] sm:rounded-[28px] sm:px-4 sm:py-2">
      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <div className="flex min-w-0 shrink items-center gap-1 sm:shrink-0 sm:gap-2">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.26)] hover:text-[var(--color-primary)] min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10"
            aria-label={isArabic ? 'فتح القائمة' : 'Open menu'}
          >
            <Menu className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>

          <button type="button" onClick={onHome} className="rounded-[14px] transition-all hover:-translate-y-0.5">
            <span className="sm:hidden flex min-w-0 items-center gap-1">
              <span className="scale-[0.78] min-[380px]:scale-[0.86]">
                <BrandMark size="xs" compact showCaption={false} />
              </span>
              <span className="header-mobile-brand inline-flex max-w-[5.2rem] items-baseline gap-0.5 leading-none">
                <span className="header-mobile-brand-store text-[0.56rem] font-extrabold tracking-[0.12em] text-[color:rgb(var(--color-text-secondary)/0.72)]">STORE</span>
                <span className="header-mobile-brand-ms text-[0.98rem] font-black tracking-[0.03em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow min-[380px]:text-[1.05rem]">MS</span>
              </span>
            </span>
            <span className="hidden sm:block">
              <BrandMark size="xs" showCaption={false} />
            </span>
          </button>
        </div>

        <div className={isArabic ? 'mr-auto' : 'ml-auto'}>
          <ThemeToggle compact className="h-8 w-8 shrink-0 min-[380px]:h-9 min-[380px]:w-9 sm:h-11 sm:w-11" />
        </div>
      </div>
    </div>
  </header>
);

export default PublicHeader;
