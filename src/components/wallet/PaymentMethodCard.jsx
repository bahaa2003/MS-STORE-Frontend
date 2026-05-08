import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';
import { resolveImageUrl } from '../../utils/imageUrl';

const PaymentMethodCard = ({ method, onSelect, index }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';

  const IconComponent = method.icon;
  const hasImage = Boolean(method.image);
  const title = String(method.displayName || method.name || '').trim();
  const description = String(method.description || '').trim();
  const groupLabel = String(method.groupLabel || '').trim();
  const instructionText = String(method.instructions || '').trim();

  const handleCopyAccount = async (event) => {
    event.stopPropagation();
    const value = String(method.accountNumber || '').trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(
        t('payments.copySuccess', { defaultValue: dir === 'rtl' ? 'تم نسخ الرقم' : 'Number copied' }),
        'success'
      );
    } catch (_error) {
      addToast(
        t('payments.copyFailed', { defaultValue: dir === 'rtl' ? 'تعذر نسخ الرقم' : 'Unable to copy number' }),
        'error'
      );
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative"
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-[24px] border border-[#d3b171]/55 bg-[linear-gradient(145deg,rgba(93,72,33,0.15),rgba(246,215,148,0.14)_38%,rgba(255,251,236,0.94)_100%)] p-4 shadow-[0_18px_34px_-28px_rgba(125,92,33,0.68)] transition-all hover:border-[#caa159]/75 sm:p-6"
        onClick={() => onSelect(method)}
      >
        <div className={`mb-3.5 flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex min-w-0 items-start gap-3 sm:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {hasImage ? (
              <img
                src={resolveImageUrl(method.image)}
                alt={method.name}
                className="h-11 w-11 shrink-0 rounded-[16px] border border-[#d8bd8b]/75 object-cover shadow-[0_10px_20px_-16px_rgba(125,92,33,0.72)] transition-transform group-hover:scale-110 sm:h-12 sm:w-12"
              />
            ) : (
              <motion.div
                animate={{ y: [0, -2, 0], rotate: [0, 4, 0, -4, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#d8b36b]/60 bg-[linear-gradient(180deg,rgba(255,246,218,0.95),rgba(242,214,150,0.62))] text-[#8c631f] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] transition-transform group-hover:scale-110 sm:h-12 sm:w-12"
              >
                <IconComponent className="h-6 w-6" />
              </motion.div>
            )}
            <div className="min-w-0">
              {groupLabel ? (
                <p className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-[#a37b35]">
                  {groupLabel}
                </p>
              ) : null}
              {title ? <h3 className="truncate text-[0.95rem] font-semibold text-[#6f4f18] sm:text-lg">{title}</h3> : null}
              {description && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8f6e36] sm:text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className={`flex shrink-0 items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {method.available === false && (
              <span className="rounded-full border border-red-300/60 bg-red-50/85 px-2 py-1 text-xs text-red-600">{t('common.unavailable')}</span>
            )}
            <ArrowLeft className={`h-5 w-5 text-[#8f6e36] transition-colors group-hover:text-[#8c631f] ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {method.accountNumber && (
          <div className="mb-3.5">
            <div className="rounded-[18px] border border-[#dcc79a]/70 bg-white/55 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:p-4">
              {instructionText ? (
                <div className={`mb-2.5 text-[11px] leading-5 text-[#8f6e36] sm:text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                  {instructionText}
                </div>
              ) : null}
              <div className={`mb-2 text-[10px] font-semibold tracking-[0.08em] text-[#a37b35] ${isRTL ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'رقم أو حساب التحويل' : 'Transfer account'}
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className={`flex w-full flex-col items-start gap-2 rounded-[14px] border border-[#d8bd8b]/75 bg-[linear-gradient(180deg,rgba(255,248,227,0.92),rgba(255,255,255,0.82))] px-3 py-2 font-mono text-[#6f4f18] transition-colors hover:border-[#caa159]/80 hover:bg-[linear-gradient(180deg,rgba(255,246,218,0.98),rgba(255,252,244,0.92))] sm:flex-row sm:items-center sm:justify-between ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                <span className="w-full break-all text-sm leading-6 sm:w-auto sm:max-w-[70%] sm:truncate">{method.accountNumber}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8c631f] ${isRTL ? 'flex-row-reverse self-end sm:self-auto' : ''}`}>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('payments.copyAccount', { defaultValue: dir === 'rtl' ? 'نسخ' : 'Copy' })}</span>
                </span>
              </button>
              {method.accountName && (
                <div className={`mt-2.5 rounded-[12px] border border-[#dcc79a]/60 bg-[linear-gradient(180deg,rgba(255,248,227,0.72),rgba(255,255,255,0.62))] px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-[10px] font-semibold tracking-[0.08em] text-[#a37b35]">
                    {dir === 'rtl' ? 'اسم صاحب الحساب' : 'Account holder'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#6f4f18]">{method.accountName}</p>
                </div>
              )}
              {method.bankName && (
                <div className={`mt-2 text-xs leading-5 text-[#8f6e36] ${isRTL ? 'text-right' : 'text-left'}`}>
                  {method.bankName}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`flex items-center gap-2 text-[11px] text-[#8f6e36] ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Lock className="h-3 w-3" />
          <span>{t('payments.securityProtected')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentMethodCard;
