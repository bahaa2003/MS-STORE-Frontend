import React from 'react';
import { cn } from '../ui/Button';
import brandIconImage from '../../assets/ms-removebg-preview.png';

const stylesBySize = {
  xs: {
    wrapper: 'gap-2.5',
    iconShell: 'h-12 w-12 rounded-[9px]',
    title: 'text-[0.88rem]',
    stackedTitle: 'text-[1.35rem]',
    caption: 'text-[0.54rem] tracking-[0.26em]',
  },
  sm: {
    wrapper: 'gap-3',
    iconShell: 'h-14 w-14 rounded-[10px]',
    title: 'text-[0.96rem]',
    stackedTitle: 'text-[1.75rem]',
    caption: 'text-[0.58rem] tracking-[0.32em]',
  },
  md: {
    wrapper: 'gap-3.5',
    iconShell: 'h-16 w-16 rounded-[12px]',
    title: 'text-[1.05rem]',
    stackedTitle: 'text-[2.05rem]',
    caption: 'text-[0.62rem] tracking-[0.34em]',
  },
  lg: {
    wrapper: 'gap-4',
    iconShell: 'h-20 w-20 rounded-[14px]',
    title: 'text-[1.16rem]',
    stackedTitle: 'text-[2.45rem]',
    caption: 'text-[0.66rem] tracking-[0.38em]',
  },
};

const BrandMark = ({
  className,
  compact = false,
  showCaption = true,
  size = 'md',
  stacked = false,
  centerStackedText = false,
  titleClassName,
  captionClassName,
}) => {
  const styles = stylesBySize[size] || stylesBySize.md;

  return (
    <div className={cn('flex items-center', styles.wrapper, centerStackedText && 'relative w-full', className)}>
      <div className={cn('relative overflow-hidden', styles.iconShell)}>
        <img
          src={brandIconImage}
          alt="MS STORE"
          loading="eager"
          decoding="async"
          className="relative h-full w-full object-contain"
        />
      </div>

      {!compact && (
        <div
          className={cn(
            'min-w-0',
            stacked && 'leading-none',
            centerStackedText && 'pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center'
          )}
        >
          {stacked ? (
            <div className={cn('flex flex-col', stacked && 'items-center text-center')}>
              <span
                className={cn(
                  'font-black uppercase leading-none tracking-[0.08em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow',
                  styles.stackedTitle,
                  titleClassName
                )}
              >
                MS
              </span>
              <span
                className={cn(
                  'mt-1.5 ps-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.48em] text-[color:rgb(var(--color-text-secondary)/0.72)]',
                  captionClassName
                )}
              >
                STORE
              </span>
            </div>
          ) : (
            <p
              className={cn(
                'font-extrabold uppercase tracking-[0.28em]',
                styles.title,
                titleClassName
              )}
            >
              <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,#fff7cf_0%,#f3de9b_28%,#d4af37_52%,#fff3bf_76%,#f0cf66_100%)] animate-shimmer-slow">
                MS
              </span>
              <span className="mx-1.5 text-[color:rgb(var(--color-text-secondary)/0.64)]">/</span>
              <span className="text-[color:rgb(var(--color-text-secondary)/0.64)]">STORE</span>
            </p>
          )}
          {showCaption && (
            <p
              className={cn(
                'mt-0.5 truncate font-medium uppercase text-[color:rgb(var(--color-primary-rgb)/0.8)]',
                styles.caption,
                captionClassName
              )}
            >
              Gaming & Voice Recharge
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandMark;
