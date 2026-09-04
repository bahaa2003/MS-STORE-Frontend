import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Smartphone, Wallet } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import useSystemStore from '../store/useSystemStore';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatWalletAmount } from '../utils/storefront';
import { getActivePaymentGroups } from '../utils/paymentSettings';

const getMethodPresentation = (method) => {
    const token = `${method?.id || ''} ${method?.name || ''}`.toLowerCase();

    if (token.includes('vodafone')) {
        return { icon: Smartphone, color: 'from-red-500 via-rose-500 to-pink-500', glow: 'shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_12px_24px_-16px_rgba(244,63,94,0.7)]' };
    }
    if (token.includes('etisalat')) {
        return { icon: Smartphone, color: 'from-emerald-500 via-green-500 to-teal-500', glow: 'shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_12px_24px_-16px_rgba(34,197,94,0.7)]' };
    }
    if (token.includes('orange')) {
        return { icon: Smartphone, color: 'from-orange-500 via-amber-500 to-red-500', glow: 'shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_12px_24px_-16px_rgba(249,115,22,0.72)]' };
    }
    if (String(method?.type || '') === 'bank_transfer') {
        return { icon: Building2, color: 'from-sky-500 via-blue-500 to-indigo-500', glow: 'shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_12px_24px_-16px_rgba(59,130,246,0.72)]' };
    }

    return { icon: Smartphone, color: 'from-emerald-500 via-cyan-500 to-sky-500', glow: 'shadow-[0_0_0_1px_rgba(34,197,94,0.16),0_12px_24px_-16px_rgba(34,197,94,0.68)]' };
};

const CompactPaymentMethodTile = ({ method, presentation, onSelect, index }) => {
    const IconComponent = presentation.icon;
    const hasImage = Boolean(method?.image);
    const currency = method?.currency ? String(method.currency).toUpperCase() : null;

    return (
        <motion.button
            type="button"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28, delay: index * 0.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(method)}
            className="relative flex min-h-[178px] flex-col items-center justify-center rounded-2xl px-3 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89a3a]/55 sm:min-h-[208px] sm:px-4"
        >
            {hasImage ? (
                <img
                    src={resolveImageUrl(method.image)}
                    alt={method.name}
                    className="h-24 w-24 rounded-[22px] object-cover shadow-[0_16px_28px_-18px_rgba(15,23,42,0.5)] sm:h-28 sm:w-28 sm:rounded-[26px]"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <motion.div
                    className={`flex h-24 w-24 items-center justify-center rounded-[22px] bg-gradient-to-br ${presentation.color} text-white shadow-lg sm:h-28 sm:w-28 sm:rounded-[26px] ${presentation.glow}`}
                >
                    <IconComponent className="h-10 w-10" />
                </motion.div>
            )}
            <span className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-gray-900 dark:text-white">
                {method.name}
            </span>
            {currency && <span className="mt-1 text-[11px] font-medium tracking-wide text-gray-500 dark:text-gray-400">{currency}</span>}
        </motion.button>
    );
};

const AddBalance = () => {
    const { dir } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuthStore();
    const { paymentSettings, loadPaymentSettings } = useSystemStore();
    const isRTL = dir === 'rtl';

    useEffect(() => {
        void loadPaymentSettings({ force: true }).catch(() => null);
    }, [loadPaymentSettings]);

    const currentBalance = Number(user?.coins || 0);
    const currentCurrency = String(user?.currency || 'USD').toUpperCase();
    const balanceDisplayValue = formatWalletAmount(currentBalance, currentCurrency);
    const isNegativeBalance = currentBalance < 0;

    const paymentGroups = useMemo(
        () => getActivePaymentGroups(paymentSettings, { fallbackToDefault: false }),
        [paymentSettings]
    );

    const paymentMethods = useMemo(
        () => paymentGroups.flatMap((group) => group.methods.map((method) => ({
            ...method,
            image: method.image || group.image,
            currency: method.currency || group.currency,
        }))),
        [paymentGroups]
    );

    const handleMethodSelect = (method) => {
        const requestedAmount = Number(searchParams.get('amount'));
        const amountQuery = Number.isFinite(requestedAmount) && requestedAmount > 0
            ? `?amount=${encodeURIComponent(String(requestedAmount))}`
            : '';
        navigate(`/wallet/payment-details/${method.id}${amountQuery}`);
    };

    return (
        <div className="space-y-4 sm:space-y-5" dir={dir}>
            <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5">
                <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="rounded-[22px] border border-gray-200 bg-white/85 p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:rounded-[24px] sm:p-5 dark:border-gray-800 dark:bg-gray-900/65"
                    >
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                <span className="inline-flex items-center rounded-full border border-[#d8bd8b]/70 bg-[linear-gradient(180deg,rgba(255,248,227,0.92),rgba(255,255,255,0.82))] px-3 py-1 text-[11px] font-semibold text-[#8c631f]">
                                    {isRTL ? 'شحن يدوي' : 'Manual top-up'}
                                </span>
                                <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-gray-100/80 px-3 py-1 text-[11px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400">
                                    <span>{isRTL ? 'شحن تلقائي' : 'Auto top-up'}</span>
                                    <span className="text-[10px] font-medium">{isRTL ? 'قريبًا سوف يتم إضافة الميزة' : 'Coming soon'}</span>
                                </span>
                            </div>
                            <h1 className="mt-3 text-[1.45rem] font-bold tracking-[-0.02em] text-gray-900 sm:text-3xl dark:text-white">{t('wallet.addBalance')}</h1>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.18 }}
                        className="relative overflow-hidden rounded-[22px] border border-[#b98d3e]/55 bg-[linear-gradient(145deg,rgba(88,61,18,0.34),rgba(176,128,43,0.3)_42%,rgba(234,200,121,0.72)_100%)] p-4 shadow-[0_16px_30px_-22px_rgba(92,62,14,0.7)] sm:rounded-[24px]"
                    >
                        <div className={`relative z-10 flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                                <p className="text-[10px] font-bold tracking-[0.14em] text-[#fff1c9]">{t('wallet.currentBalance')}</p>
                                <p className={`mt-2 text-[1.35rem] font-black tracking-[-0.03em] leading-none sm:text-[1.6rem] ${isNegativeBalance ? 'text-[#ffb4b4]' : 'text-[#fff8e8]'}`}>
                                    {balanceDisplayValue}
                                </p>
                            </div>
                            <motion.span
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[#f1d089]/35 bg-[linear-gradient(180deg,rgba(255,239,194,0.34),rgba(189,133,35,0.3))] text-[#fff1c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            >
                                <Wallet className="h-[1.15rem] w-[1.15rem]" />
                            </motion.span>
                        </div>
                    </motion.div>
                </div>

                <motion.section
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="rounded-[22px] border border-gray-200 bg-white/85 p-3.5 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:rounded-[24px] sm:p-4 dark:border-gray-800 dark:bg-gray-900/65"
                >
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        {paymentMethods.map((method, index) => {
                                            const presentation = getMethodPresentation(method);

                                            return (
                                                <CompactPaymentMethodTile
                                                    key={method.id}
                                                    method={method}
                                                    presentation={presentation}
                                                    onSelect={handleMethodSelect}
                                                    index={index}
                                                />
                                            );
                                        })}

                                        {!paymentMethods.length && (
                                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400">
                                                {isRTL ? `لا توجد طرق دفع متاحة حاليًا لعملتك (${currentCurrency}). يرجى التواصل مع الدعم.` : `No payment methods are currently available for your currency (${currentCurrency}). Please contact support.`}
                                            </div>
                                        )}
                                    </div>
                                </motion.section>

                                <motion.footer
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="rounded-[22px] border border-gray-200 bg-white/85 p-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/65 sm:p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className={`inline-flex items-center rounded-full border border-[#d8bd8b]/70 bg-[linear-gradient(180deg,rgba(255,248,227,0.92),rgba(255,255,255,0.82))] px-2.5 py-1 text-[10px] font-semibold text-[#8c631f] ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            {isRTL ? 'نهاية الصفحة' : 'End section'}
                                        </div>
                                        <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'ملخص سريع قبل المتابعة.' : 'Quick summary before continuing.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {[
                                            isRTL ? 'شحن آمن' : 'Secure top-up',
                                            isRTL ? 'إيصال محفوظ' : 'Receipt kept',
                                            isRTL ? 'دعم مباشر' : 'Live support',
                                        ].map((item, idx) => (
                                            <div
                                                key={item}
                                                className={`flex min-h-[56px] items-center gap-2 rounded-[12px] border border-gray-200/70 bg-white/75 px-2 py-2 text-[10px] font-semibold text-gray-700 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.25)] dark:border-gray-700 dark:bg-gray-950/45 dark:text-gray-300 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                            >
                                                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${idx === 0 ? 'bg-orange-400' : idx === 1 ? 'bg-pink-400' : 'bg-purple-400'}`} />
                                                <span className="leading-4">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.footer>
                            </div>
                        </div>
        );
    }

export default AddBalance;
