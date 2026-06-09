import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/Button';

const CategoryCard = ({
  category,
  active,
  activeLabel = 'Active',
  index,
  onSelect,
  variant = 'catalog',
}) => {
  const displayName = category?.title || category?.name || 'Category';
  const imageSrc = String(category?.image || '').trim();

  if (variant === 'product') {
    return (
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className="group relative isolate flex h-full w-full origin-center select-none flex-col rounded-[1.4rem] text-start transition-all duration-200 ease-out"
        aria-label={displayName}
      >
        <div className="relative overflow-hidden rounded-[1.2rem]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={displayName}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 18vw"
              className="relative block aspect-square h-full w-full bg-transparent object-contain object-center transition duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="relative grid aspect-square h-full w-full place-items-center rounded-[1.2rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.72)] text-2xl font-black text-[var(--color-text-secondary)] transition duration-500 group-hover:scale-[1.03]"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
          {displayName}
        </h3>
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(category.id)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ delay: index * 0.05, duration: 0.32 }}
      whileHover={{ y: -2, scale: 1.002 }}
      className={cn(
        'group relative flex h-full flex-col overflow-visible rounded-[1.9rem] border border-transparent bg-transparent text-start shadow-none transition-all',
        active
          ? 'border-transparent bg-transparent'
          : 'border-transparent bg-transparent'
      )}
    >
      <div className="flex w-full justify-center">
        <div className="relative inline-block max-w-full overflow-hidden rounded-[1.35rem] p-px shadow-[0_0_12px_rgb(var(--color-primary-rgb)/0.14)]">
          <span className="pointer-events-none absolute -inset-[36%] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_52deg,rgb(var(--color-primary-rgb)/0.72)_60deg,rgb(255_245_190/0.82)_65deg,rgb(var(--color-primary-rgb)/0.62)_70deg,transparent_80deg,transparent_360deg)] blur-[1px] motion-safe:animate-[spin_3.8s_linear_infinite]" />
          <span className="pointer-events-none absolute inset-px z-20 rounded-[1.28rem] border border-[color:rgb(var(--color-primary-rgb)/0.42)] shadow-[0_0_9px_rgb(var(--color-primary-rgb)/0.26),inset_0_0_10px_rgb(var(--color-primary-rgb)/0.1)]" />
          <span className="pointer-events-none absolute inset-x-5 top-1/2 z-10 h-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-primary-rgb)/0.18),rgb(var(--color-primary-rgb)/0.07)_42%,transparent_72%)] blur-xl" />
          <img
            src={category.image}
            alt={displayName}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              'relative z-10 block h-auto max-w-full bg-transparent transition-transform duration-500',
              category.id === 'all' ? 'p-3' : ''
            )}
          />
        </div>
      </div>

      <div className="relative px-3 pb-4 pt-1 text-center sm:px-4">
        {active && (
          <span className="mb-2 inline-flex rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            {activeLabel}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[3rem] text-center text-[0.98rem] font-semibold leading-6 text-[var(--color-text)]">
          {displayName}
        </h3>
      </div>
    </motion.button>
  );
};

export default React.memo(CategoryCard);
