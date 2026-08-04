import React, { useEffect, useRef, useState } from 'react';
import { Headset, Phone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import {
  buildWhatsAppLink,
  getAdminWhatsAppNumber,
  normalizeWhatsAppNumber,
} from '../../utils/whatsapp';

const FloatingWhatsApp = () => {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const shouldHideForRole = isAdminRole(user?.role);
  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar')
    .toLowerCase()
    .startsWith('ar');

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (shouldHideForRole) return null;

  const supportNumber = normalizeWhatsAppNumber(getAdminWhatsAppNumber());
  const whatsappHref = buildWhatsAppLink({
    number: supportNumber,
    message: isArabic
      ? 'مرحباً، أحتاج مساعدة من فريق MS STORE'
      : 'Hello, I need help from the MS STORE team',
  });

  return (
    <div ref={menuRef} className="floating-whatsapp" dir={isArabic ? 'rtl' : 'ltr'}>
      <div
        className={`absolute bottom-[calc(100%+0.75rem)] right-0 w-44 origin-bottom-right rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.75)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-2 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.48)] backdrop-blur-xl transition-all duration-200 ${
          isOpen ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-2 scale-95 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <p className="px-2 pb-1.5 pt-1 text-right text-[11px] font-bold text-[var(--color-text-secondary)]">
          {isArabic ? 'اختر طريقة التواصل' : 'Choose contact method'}
        </p>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold text-[var(--color-text)] transition hover:bg-emerald-500/10"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-white shadow-[0_10px_20px_-14px_rgba(37,211,102,0.8)]">
            <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16.03 3.2c-7.08 0-12.81 5.71-12.81 12.77 0 2.26.6 4.48 1.73 6.42L3 29l6.79-1.78a12.84 12.84 0 0 0 6.24 1.6h.01c7.08 0 12.81-5.72 12.81-12.78A12.75 12.75 0 0 0 16.03 3.2Zm0 23.49h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-4.03 1.05 1.08-3.92-.25-.4a10.57 10.57 0 0 1-1.63-5.66c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.55 1.1 7.57 3.13a10.58 10.58 0 0 1 3.13 7.56c0 5.9-4.8 10.7-10.72 10.7Zm5.87-8.01c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.31-.82 1.04-1 1.25-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.56-1.55-.95-.85-1.6-1.9-1.79-2.21-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.19.21-.31.31-.52.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.98-2.33-.25-.6-.5-.51-.7-.52h-.6c-.21 0-.56.08-.85.39-.29.31-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.26 3.45 5.48 4.84.76.33 1.36.52 1.82.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.16-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z"
              />
            </svg>
          </span>
          <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
        </a>

        <a
          href={`tel:+${supportNumber}`}
          onClick={() => setIsOpen(false)}
          className="mt-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold text-[var(--color-text)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.1)]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)),rgb(var(--color-primary-rgb)/0.72))] text-[var(--color-button-text)] shadow-[0_10px_20px_-14px_rgb(var(--color-primary-rgb)/0.75)]">
            <Phone className="h-[17px] w-[17px]" />
          </span>
          <span>{isArabic ? 'اتصال مباشر' : 'Call us'}</span>
        </a>
      </div>

      <span className="floating-whatsapp-ring" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label={isArabic ? 'خيارات التواصل' : 'Contact options'}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-[15px] border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-primary-rgb)/0.2))] text-[var(--color-primary)] shadow-[0_14px_30px_-19px_rgb(var(--color-primary-rgb)/0.52),inset_0_1px_0_rgb(255_255_255/0.3)] backdrop-blur-xl transition-colors duration-300 hover:border-[color:rgb(var(--color-primary-rgb)/0.62)] active:opacity-90"
      >
        {isOpen ? <X className="h-[17px] w-[17px]" strokeWidth={2.4} /> : <Headset className="h-5 w-5" strokeWidth={2.15} />}
      </button>
    </div>
  );
};

export default FloatingWhatsApp;
