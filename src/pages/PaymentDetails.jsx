import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Copy, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UploadReceiptBox from '../components/wallet/UploadReceiptBox';
import { useLanguage } from '../context/LanguageContext';
import useSystemStore from '../store/useSystemStore';
import useTopupStore from '../store/useTopupStore';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { inputBaseClassName, textareaClassName } from '../components/ui/Input';
import { findPaymentMethodById } from '../utils/paymentSettings';
import { devLogger } from '../utils/devLogger';
import { resolveImageUrl } from '../utils/imageUrl';

const getMethodPresentation = (method) => {
  const token = `${method?.id || ''} ${method?.name || ''}`.toLowerCase();

  if (token.includes('vodafone')) return { icon: 'VC', color: 'from-red-500 to-pink-500' };
  if (token.includes('etisalat')) return { icon: 'EC', color: 'from-green-500 to-teal-500' };
  if (token.includes('orange')) return { icon: 'OC', color: 'from-orange-500 to-red-500' };
  if (String(method?.type || '') === 'bank_transfer') return { icon: 'BT', color: 'from-blue-500 to-purple-500' };
  if (String(method?.type || '') === 'paypal') return { icon: 'PP', color: 'from-cyan-500 to-blue-600' };
  if (String(method?.type || '') === 'credit_card') return { icon: 'CC', color: 'from-amber-500 to-orange-600' };

  return { icon: 'PM', color: 'from-emerald-500 to-teal-600' };
};

const PaymentDetails = () => {
  const { methodId } = useParams();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { paymentSettings, loadPaymentSettings } = useSystemStore();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';

  const [formData, setFormData] = useState({
    amount: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    loadPaymentSettings();
  }, [loadPaymentSettings]);

  const selectedMethodEntry = useMemo(
    () => findPaymentMethodById(paymentSettings, methodId),
    [paymentSettings, methodId]
  );

  const group = selectedMethodEntry?.group || null;
  const method = selectedMethodEntry?.method || null;

  const methodPresentation = useMemo(
    () => getMethodPresentation(method),
    [method]
  );

  const methodFields = method?.fields || ['amount'];
  const visibleMethodFields = useMemo(
    () => methodFields.filter((field) => field !== 'senderNumber'),
    [methodFields]
  );
  const rawMethodInstructions = method?.instructions || paymentSettings?.instructions || t('payments.chooseMethod');
  const methodInstructions = String(rawMethodInstructions)
    .replace(/\s*ورقم العملية\.?/g, '')
    .replace(/\s*ورقم المعاملة\.?/g, '')
    .trim();
  const requiresReceipt = Boolean(method?.accountNumber);
  const feePercent = useMemo(() => {
    const value = Number(method?.feePercent);
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }, [method?.feePercent]);
  const enteredAmount = Number(formData.amount || 0);
  const baseAmount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : 0;
  const feeAmount = Number(((baseAmount * feePercent) / 100).toFixed(2));
  const payableAmount = Number((baseAmount + feeAmount).toFixed(2));

  const formatMoney = (value) => {
    const safeValue = Number(value || 0);
    const currencyCode = String(user?.currency || 'USD').toUpperCase();

    try {
      return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch (_error) {
      return `${safeValue.toFixed(2)} ${currencyCode}`;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyAccount = async () => {
    const value = String(method?.accountNumber || '').trim();
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

  const validate = () => {
    const amountValue = Number(formData.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) return t('payments.validationAmount');
    if (requiresReceipt && !uploadedFile) return t('payments.validationReceipt');
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      window.alert(validationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const { requestTopup } = useTopupStore.getState();

      await requestTopup({
        requestedAmount: baseAmount,
        amount: baseAmount,
        paymentMethodId: method?.id || '',
        paymentFeePercent: feePercent,
        paymentFeeAmount: feeAmount,
        amountWithFee: payableAmount,
        senderWalletNumber: '',
        transferredFromNumber: '',
        proofImage: uploadedFile || null,
        paymentChannel: method?.name || methodId || '',
        currencyCode: group?.currency || method?.currency || user?.currency || 'USD',
        userId: user?.id || '',
        userName: user?.name || '',
        type: 'regular',
      });

      setSubmitStatus('success');
      setTimeout(() => navigate('/wallet'), 3000);
    } catch (error) {
      devLogger.warnUnlessBenign('Topup submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldConfigs = {
    amount: {
      label: t('payments.fields.amount'),
      placeholder: t('payments.fields.amountPlaceholder'),
      type: 'number',
      min: '0.01',
      step: '0.01',
    },
    senderNumber: {
      label: t('payments.fields.senderNumber'),
      placeholder: t('payments.fields.senderNumberPlaceholder'),
      type: 'tel',
    },
    transactionId: {
      label: t('payments.fields.transactionId'),
      placeholder: t('payments.fields.transactionIdPlaceholder'),
      type: 'text',
    },
    cardNumber: {
      label: t('payments.fields.cardNumber'),
      placeholder: t('payments.fields.cardNumberPlaceholder'),
      type: 'text',
    },
    expiryDate: {
      label: t('payments.fields.expiryDate'),
      placeholder: t('payments.fields.expiryDatePlaceholder'),
      type: 'text',
    },
    cvv: {
      label: t('payments.fields.cvv'),
      placeholder: t('payments.fields.cvvPlaceholder'),
      type: 'text',
    },
  };

  if (!method) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-8 text-center dark:border-gray-800 dark:bg-gray-900/70">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('payments.invalidMethodTitle')}</h1>
          <button
            type="button"
            onClick={() => navigate('/wallet/add-balance')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            {t('payments.invalidMethodAction')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={isRTL ? 'text-right' : 'text-left'}
        >
          <div className={`mb-2 flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {method.image ? (
              <img
                src={resolveImageUrl(method.image)}
                alt={method.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-14 w-14 shrink-0 rounded-2xl border border-gray-200 object-cover dark:border-gray-700"
              />
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${methodPresentation.color}`}>
                <span className="text-xs font-bold text-white">{methodPresentation.icon}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{method.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{methodInstructions}</p>
              {group?.name && (
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  {group.name}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {method.accountNumber && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-gray-200 bg-white/80 p-4 backdrop-blur-xl sm:p-6 dark:border-gray-800 dark:bg-gray-900/70"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('payments.accountDetails')}</h3>
            {method.image ? (
              <div className={`mb-4 flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <img
                  src={resolveImageUrl(method.image)}
                  alt={method.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-28 w-full max-w-xs rounded-2xl border border-gray-200 object-cover dark:border-gray-700"
                />
              </div>
            ) : null}
            <div className="rounded-lg border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-800 dark:bg-gray-950/60">
              <div className={`mb-2 text-sm text-gray-600 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {methodInstructions}
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className={`flex w-full flex-col items-start gap-2 rounded border border-gray-200 bg-white px-3 py-2 font-mono text-gray-900 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-indigo-500/40 dark:hover:bg-gray-900 ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                <span className="w-full break-all text-sm sm:w-auto sm:max-w-[70%] sm:truncate">{method.accountNumber}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 ${isRTL ? 'flex-row-reverse self-end sm:self-auto' : ''}`}>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('payments.copyAccount', { defaultValue: dir === 'rtl' ? 'نسخ الرقم' : 'Copy number' })}</span>
                </span>
              </button>
              {method.accountName && (
                <div className={`mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('payments.accountHolder', { defaultValue: dir === 'rtl' ? 'اسم صاحب الحساب' : 'Account holder' })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{method.accountName}</p>
                </div>
              )}
              {method.bankName && (
                <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {method.bankName}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-gray-200 bg-white/82 p-4 backdrop-blur-xl sm:p-6 dark:border-gray-800 dark:bg-gray-900/72"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{t('payments.paymentDetails')}</h3>

          {visibleMethodFields.map((field) => {
            const config = fieldConfigs[field];
            if (!config) return null;

            return (
              <div key={field} className="mb-4">
                <label className={`mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {config.label}
                </label>
                <input
                  type={config.type}
                  value={formData[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={config.placeholder}
                  min={config.min}
                  step={config.step}
                  className={`${inputBaseClassName} ${isRTL ? 'text-right' : 'text-left'}`}
                  disabled={isSubmitting}
                />
              </div>
            );
          })}

          <div className="mb-6">
            <label className={`mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('payments.notesOptional')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('payments.notesPlaceholder')}
              rows={3}
              className={`${textareaClassName} ${isRTL ? 'text-right' : 'text-left'}`}
              disabled={isSubmitting}
            />
          </div>

          {requiresReceipt && (
            <div className="mb-6">
              <label className={`mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('payments.uploadReceipt')}
              </label>
              <UploadReceiptBox onFileUpload={setUploadedFile} />
            </div>
          )}

          <div className="mb-6 rounded-xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className={`flex items-center justify-between gap-3 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">
                {t('payments.subtotalLabel', {
                  defaultValue: dir === 'rtl' ? 'المبلغ الأساسي' : 'Base amount',
                })}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(baseAmount)}</span>
            </div>

            {feePercent > 0 && (
              <div className={`mt-2 flex items-center justify-between gap-3 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-700 dark:text-gray-300">
                  {t('payments.feeAmountLabel', {
                    defaultValue: dir === 'rtl' ? 'رسوم التحويل' : 'Payment fee',
                  })}
                  {` (${feePercent}%)`}
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-300">{formatMoney(feeAmount)}</span>
              </div>
            )}

            <div className={`mt-3 flex items-center justify-between gap-3 border-t border-amber-200/70 pt-3 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-semibold text-gray-900 dark:text-white">
                {t('payments.totalToTransferLabel', {
                  defaultValue: dir === 'rtl' ? 'الإجمالي المطلوب تحويله' : 'Total to transfer',
                })}
              </span>
              <span className="text-base font-bold text-amber-700 dark:text-amber-300">{formatMoney(payableAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            aria-busy={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>{t('common.processing')}</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>{t('payments.confirmPayment')}</span>
              </>
            )}
          </button>
        </motion.form>

        {submitStatus === 'success' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/20 p-6 text-center"
          >
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
            <h3 className="mb-2 text-xl font-semibold text-green-500 dark:text-green-400">{t('payments.submitSuccessTitle')}</h3>
            <p className="text-green-700 dark:text-green-300">{t('payments.submitSuccessDesc')}</p>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/20 p-6 text-center"
          >
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-xl font-semibold text-red-500 dark:text-red-400">{t('payments.submitErrorTitle')}</h3>
            <p className="text-red-700 dark:text-red-300">{t('payments.submitErrorDesc')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;

