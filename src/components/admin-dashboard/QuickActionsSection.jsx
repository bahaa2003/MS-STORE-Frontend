import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { cn } from '../ui/Button';

const QuickActionsSection = ({ actions, isArabic }) => {
  return (
    <Card variant="elevated" className="mx-auto w-[calc(100vw-1.5rem)] max-w-[42rem] p-3 sm:w-full sm:p-6 xl:max-w-none">
      <div className={cn('mb-3 sm:mb-4', isArabic ? 'text-right' : 'text-left')}>
        <h2 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">
          {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <p className="mt-1.5 hidden text-xs leading-6 text-[var(--color-text-secondary)] sm:block sm:text-sm">
          {isArabic
            ? 'اختصارات مباشرة للمهام الأكثر استخدامًا داخل لوحة الإدارة.'
            : 'Direct shortcuts to the admin tasks you use most often.'}
        </p>
      </div>

      <div className="grid gap-2.5">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group relative overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[linear-gradient(180deg,rgb(255_255_255/0.035),rgb(255_255_255/0.015))] px-3 py-3 shadow-[var(--shadow-subtle)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.06)] sm:px-4 sm:py-3.5"
          >
            <span className="pointer-events-none absolute inset-y-3 w-1 rounded-full bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-hover))] opacity-0 transition-opacity group-hover:opacity-100 ltr:left-0 rtl:right-0" />

            <div className={cn('flex items-center gap-3', isArabic && 'flex-row-reverse text-right')}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] transition-all group-hover:scale-105 group-hover:bg-[color:rgb(var(--color-primary-rgb)/0.16)]">
                <action.icon className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-5 text-[var(--color-text)]">
                  {action.label}
                </p>
                <p className="mt-0.5 hidden truncate text-xs leading-5 text-[var(--color-text-secondary)] sm:block">
                  {action.description}
                </p>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] text-[var(--color-muted)] transition-all group-hover:border-[color:rgb(var(--color-primary-rgb)/0.3)] group-hover:text-[var(--color-primary)]">
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default QuickActionsSection;
