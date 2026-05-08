import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';
import { formatDateTime } from '../../utils/intl';
import { formatWalletAmount } from '../../utils/storefront';

const getTransactionIcon = (type) => {
  switch (type) {
    case 'deposit':
      return ArrowDownLeft;
    case 'withdrawal':
      return ArrowUpRight;
    case 'transfer':
      return RefreshCw;
    case 'purchase':
      return ShoppingCart;
    default:
      return ArrowDownLeft;
  }
};

const getTransactionTone = (type) => {
  switch (type) {
    case 'deposit':
      return {
        cardClass: 'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96)_58%,rgba(240,253,250,0.88)_100%)] shadow-[0_14px_28px_-24px_rgba(16,185,129,0.35)] dark:border-emerald-900/55 dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.26),rgba(15,23,42,0.84)_58%,rgba(6,95,70,0.2)_100%)]',
        iconClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300',
        amountClass: 'text-emerald-700 dark:text-emerald-300',
        glowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_55%)]',
        railClass: 'bg-emerald-400/70 dark:bg-emerald-500/65',
      };
    case 'withdrawal':
      return {
        cardClass: 'border-[#e2b0b0]/75 bg-[linear-gradient(145deg,rgba(173,64,64,0.08),rgba(254,244,244,0.94)_42%,rgba(255,255,255,0.96)_100%)] shadow-[0_16px_30px_-24px_rgba(156,54,54,0.22)]',
        iconClass: 'border-[#e4aaaa]/65 bg-[linear-gradient(180deg,rgba(255,249,249,0.98),rgba(240,181,181,0.62))] text-[#a14646]',
        badgeClass: 'border-[#de9f9f]/60 bg-[#fdf0f0]/90 text-[#a54848]',
        amountClass: 'text-[#a54848]',
        glowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(226,132,132,0.16),transparent_55%)]',
        railClass: 'bg-[#dc8b8b]/70',
      };
    case 'transfer':
      return {
        cardClass: 'border-[#a9cde8]/75 bg-[linear-gradient(145deg,rgba(64,120,173,0.08),rgba(241,248,253,0.94)_42%,rgba(255,255,255,0.96)_100%)] shadow-[0_16px_30px_-24px_rgba(49,109,164,0.22)]',
        iconClass: 'border-[#9fc5e3]/65 bg-[linear-gradient(180deg,rgba(249,253,255,0.98),rgba(174,211,238,0.62))] text-[#2f6f9e]',
        badgeClass: 'border-[#96c1e1]/60 bg-[#eef7fd]/90 text-[#2e6e9d]',
        amountClass: 'text-[#2e6e9d]',
        glowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(127,178,215,0.16),transparent_55%)]',
        railClass: 'bg-[#7fb2d7]/70',
      };
    case 'purchase':
      return {
        cardClass: 'border-slate-200/85 bg-[linear-gradient(145deg,rgba(248,250,252,0.96),rgba(255,255,255,0.96)_58%,rgba(241,245,249,0.88)_100%)] shadow-[0_14px_28px_-24px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(15,23,42,0.88)_58%,rgba(51,65,85,0.42)_100%)]',
        iconClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
        badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
        amountClass: 'text-slate-700 dark:text-slate-200',
        glowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.1),transparent_55%)]',
        railClass: 'bg-slate-300/80 dark:bg-slate-600/70',
      };
    default:
      return {
        cardClass: 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.92)] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.18)]',
        iconClass: 'border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-elevated-rgb)/0.86)] text-[var(--color-text)]',
        badgeClass: 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.82)] text-[var(--color-text-secondary)]',
        amountClass: 'text-[var(--color-text)]',
        glowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.12),transparent_55%)]',
        railClass: 'bg-[color:rgb(var(--color-border-rgb)/0.9)]',
      };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'failed':
      return XCircle;
    case 'pending':
    default:
      return Clock;
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/55 dark:text-rose-300';
    case 'pending':
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/55 dark:text-amber-300';
  }
};

const TransactionCard = ({ transaction, index }) => {
  const { dir } = useLanguage();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';
  const locale = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('en')
    ? 'en-US'
    : 'ar-EG';

  const statusLabelKey = `wallet.status${transaction.status?.charAt(0)?.toUpperCase() || ''}${transaction.status?.slice(1) || ''}`;
  const typeLabelKey = `wallet.type${transaction.type?.charAt(0)?.toUpperCase() || ''}${transaction.type?.slice(1) || ''}`;
  const rawDescription = transaction.descriptionKey
    ? t(transaction.descriptionKey)
    : (transaction.description ?? transaction.type);
  const transactionDescription = (() => {
    if (rawDescription === null || rawDescription === undefined) return '';
    if (typeof rawDescription === 'string' || typeof rawDescription === 'number') return String(rawDescription);
    if (typeof rawDescription === 'object') {
      const picked = rawDescription?.label || rawDescription?.title || rawDescription?.name || rawDescription?.text || '';
      return String(picked || '');
    }
    return String(rawDescription);
  })();
  const originalCurrency = String(transaction.originalCurrency || '').trim().toUpperCase();
  const currentCurrency = String(transaction.currentCurrency || '').trim().toUpperCase();
  const showOriginalCurrency = Boolean(originalCurrency) && originalCurrency !== currentCurrency;
  const originalAmount = Number(transaction.originalAmount);
  const showOriginalAmount = showOriginalCurrency && Number.isFinite(originalAmount) && originalAmount > 0;
  const hasBalanceSnapshot = transaction?.balanceBefore !== null
    && transaction?.balanceBefore !== undefined
    && transaction?.balanceAfter !== null
    && transaction?.balanceAfter !== undefined;

  const Icon = getTransactionIcon(transaction.type);
  const StatusIcon = getStatusIcon(transaction.status);
  const tone = getTransactionTone(transaction.type);

  const referenceText = (() => {
    const value = transaction?.reference;
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();

    if (typeof value === 'object') {
      const candidate =
        value?.reference
        || value?.referenceId
        || value?.orderNumber
        || value?.siteOrderNumber
        || value?._id
        || value?.id
        || '';
      return String(candidate || '').trim();
    }

    return String(value).trim();
  })();

  const handleCopyReference = async () => {
    const value = referenceText;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(t('wallet.transactionNumberCopied', { defaultValue: 'Transaction number copied' }), 'success');
    } catch (_error) {
      addToast(t('wallet.copyTransactionNumberFailed', { defaultValue: 'Unable to copy transaction number' }), 'error');
    }
  };

  return (
    <motion.div
      initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative isolate overflow-hidden rounded-[14px] border p-2 backdrop-blur-sm transition-all hover:-translate-y-0.5 sm:p-2.5 ${tone.cardClass}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${tone.glowClass}`} />
      <div className={`pointer-events-none absolute inset-y-2.5 w-0.5 rounded-full ${tone.railClass} ${isRTL ? 'right-0' : 'left-0'}`} />

      <div className={`relative z-10 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[11px] border sm:h-8 sm:w-8 sm:rounded-[12px] ${tone.iconClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`mb-0.5 flex flex-col gap-1 ${isRTL ? 'items-end text-right' : 'items-start text-left'} sm:flex-row sm:items-start sm:justify-between`}>
            <div className="min-w-0">
              <div className={`flex flex-wrap items-center gap-1.5 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <h4 className="line-clamp-1 break-words text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-100 sm:text-xs">
                  {transactionDescription}
                </h4>
                <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${tone.badgeClass}`}>
                  {t(typeLabelKey, { defaultValue: transaction.type })}
                </span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getStatusTone(transaction.status)}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              <span>{t(statusLabelKey, { defaultValue: transaction.status })}</span>
            </div>
          </div>

          <div className={`flex flex-col gap-1 ${isRTL ? 'items-end text-right' : 'items-start text-left'} sm:flex-row sm:items-center sm:justify-between`}>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
              {formatDateTime(transaction.date, locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className={`whitespace-nowrap text-xs font-black [direction:ltr] sm:text-[13px] ${tone.amountClass}`}>
              {formatWalletAmount(transaction.amount, transaction.currency, { signed: true })}
            </div>
          </div>

          <div className={`mt-1 flex flex-wrap items-center gap-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
            {hasBalanceSnapshot ? (
              <div className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-2 py-0.5 text-[9px] font-semibold dark:border-slate-700 dark:bg-slate-900/55 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-rose-600 line-through dark:text-rose-300">
                  {formatWalletAmount(transaction.balanceBefore, transaction.currency)}
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  {formatWalletAmount(transaction.balanceAfter, transaction.currency)}
                </span>
              </div>
            ) : null}

            {referenceText && (
              <button
                type="button"
                onClick={handleCopyReference}
                className={`inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 px-2 py-0.5 text-[9px] text-slate-500 transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.28)] hover:text-[var(--color-primary)] dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}
                title={t('wallet.copyTransactionNumber', { defaultValue: 'Copy transaction number' })}
              >
                <span>{t('wallet.reference')}: {referenceText}</span>
                <Copy className="h-3 w-3" />
              </button>
            )}

            {showOriginalCurrency && (
              <div className={`inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[9px] font-medium text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/55 dark:text-cyan-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {showOriginalAmount
                  ? `${isRTL ? 'المبلغ المدفوع' : 'Paid amount'}: ${formatWalletAmount(originalAmount, originalCurrency)}`
                  : `${t('wallet.executionCurrency', { defaultValue: 'Transaction currency at execution' })}: ${originalCurrency}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionCard;
