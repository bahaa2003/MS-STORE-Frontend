import React from 'react';
import Card from '../ui/Card';
import { cn } from '../ui/Button';
import './AdminNeonGlow.css';

const StatCard = ({ title, value, note, icon: Icon, progress = 40, wide = false }) => {
  const progressValue = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <Card
      variant="elevated"
      className={cn(
        'admin-stat-card relative w-full p-0 transition-all duration-300',
        wide && 'col-span-2'
      )}
    >
      <span className="admin-stat-card-shimmer" aria-hidden="true" />
      <div className="relative flex min-h-[7.5rem] flex-col items-center justify-center overflow-hidden rounded-[inherit] p-3 text-center sm:min-h-[8.5rem] sm:p-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.08)] bg-[color:rgb(var(--color-primary-rgb)/0.035)] text-[var(--color-primary)] opacity-50 sm:h-32 sm:w-32">
          <Icon className="h-10 w-10 opacity-20 sm:h-12 sm:w-12" />
        </div>

        <div className="admin-icon-glow relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] sm:h-9 sm:w-9">
          <Icon className="relative z-10 h-4 w-4" />
        </div>

        <div className="relative z-10 mt-2.5 w-full">
          <p className="text-[9px] font-bold uppercase leading-4 tracking-[0.08em] text-[var(--color-muted)] sm:text-[10px] sm:tracking-[0.1em]">
            {title}
          </p>
          <p className="mt-1 break-words text-[1.35rem] font-black leading-tight text-[var(--color-text)] sm:text-[1.7rem]">
            {value}
          </p>
          {note && (
            <p className="mx-auto mt-1.5 max-w-[17rem] text-[9px] leading-4 text-[var(--color-text-secondary)] sm:text-[10px] sm:leading-5">
              {note}
            </p>
          )}
        </div>

        <div className="relative z-10 mt-2.5 h-1 w-full max-w-[15rem] overflow-hidden rounded-full bg-[color:rgb(var(--color-border-rgb)/0.42)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-hover))] transition-all duration-500"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
