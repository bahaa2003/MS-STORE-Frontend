import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, Tag, CheckCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const FilterBar = ({ onFilterChange }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange(next);
  };

  const resetFilters = () => {
    const initialFilters = {
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  const typeOptions = [
    { value: 'all', label: t('wallet.allTypes') },
    { value: 'deposit', label: t('wallet.typeDeposit') },
    { value: 'withdrawal', label: t('wallet.typeWithdrawal') },
    { value: 'transfer', label: t('wallet.typeTransfer') },
    { value: 'purchase', label: t('wallet.typePurchase') }
  ];

  const statusOptions = [
    { value: 'all', label: t('wallet.allStatuses') },
    { value: 'completed', label: t('wallet.statusCompleted') },
    { value: 'pending', label: t('wallet.statusPending') },
    { value: 'failed', label: t('wallet.statusFailed') }
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="mb-3 rounded-[1rem] border border-[#dec89d]/80 bg-[linear-gradient(180deg,rgba(255,252,244,0.92),rgba(255,247,229,0.86)_56%,rgba(241,221,181,0.72)_100%)] p-2.5 shadow-[0_16px_30px_-24px_rgba(98,71,22,0.45)] backdrop-blur-xl dark:border-[#5f4f2f]/68 dark:bg-[linear-gradient(180deg,rgba(42,34,20,0.96),rgba(29,24,17,0.92)_56%,rgba(54,41,18,0.86)_100%)] sm:p-3"
    >
      <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`wallet-accent-chip px-2 py-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Filter className="h-3 w-3 text-[#8c631f]" />
          <h3 className="text-[12px] font-semibold text-[#8a6528]">{t('wallet.filters')}</h3>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className={`inline-flex items-center gap-1 rounded-full border border-[#d2ad67]/76 bg-[#fff7e6]/82 px-2 py-0.5 text-[10px] font-semibold text-[#7a5418] transition-colors hover:bg-white dark:border-[#846a3a]/76 dark:bg-[#3b2f1f]/80 dark:text-[#f1ddb1] dark:hover:bg-[#4a3d2b]/86 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('wallet.all', { defaultValue: 'All' })}
        </button>
      </div>

      <div className={`grid grid-cols-2 gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          <label className={`wallet-accent-chip mb-1 px-1.5 py-0.5 text-[9px] font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Tag className="h-2.5 w-2.5 text-[#8c631f]" />
            {t('wallet.type')}
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className={`h-[34px] w-full rounded-[0.75rem] border border-[#d4b982] bg-[#fffbf2]/96 px-2 text-[11px] font-medium text-[#322006] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors focus:border-[#b9852c] focus:outline-none focus:ring-2 focus:ring-[#d6a64c]/22 dark:border-[#7c6235] dark:bg-[#211b12]/95 dark:text-[#fff2d2] dark:focus:border-[#d3a44a] ${isRTL ? 'text-right' : 'text-left'}`}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#fffbf2] text-[#322006] dark:bg-[#211b12] dark:text-[#fff2d2]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`wallet-accent-chip mb-1 px-1.5 py-0.5 text-[9px] font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CheckCircle className="h-2.5 w-2.5 text-[#8c631f]" />
            {t('wallet.statusLabel')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={`h-[34px] w-full rounded-[0.75rem] border border-[#d4b982] bg-[#fffbf2]/96 px-2 text-[11px] font-medium text-[#322006] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors focus:border-[#b9852c] focus:outline-none focus:ring-2 focus:ring-[#d6a64c]/22 dark:border-[#7c6235] dark:bg-[#211b12]/95 dark:text-[#fff2d2] dark:focus:border-[#d3a44a] ${isRTL ? 'text-right' : 'text-left'}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#fffbf2] text-[#322006] dark:bg-[#211b12] dark:text-[#fff2d2]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div>
          <label className={`wallet-accent-chip mb-1 px-1.5 py-0.5 text-[9px] font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Calendar className="h-2.5 w-2.5 text-[#8c631f]" />
            {t('wallet.startDate', { defaultValue: 'التاريخ من' })}
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="mm/dd/yyyy"
            className={`h-8 w-full rounded-[0.7rem] border border-[#d4b982] bg-[#fffbf2]/96 px-2 text-[10.5px] text-[#322006] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors focus:border-[#b9852c] focus:outline-none focus:ring-2 focus:ring-[#d6a64c]/22 dark:border-[#7c6235] dark:bg-[#211b12]/95 dark:text-[#fff2d2] dark:focus:border-[#d3a44a] ${isRTL ? 'text-right' : 'text-left'}`}
          />
        </div>

        <div>
          <label className={`wallet-accent-chip mb-1 px-1.5 py-0.5 text-[9px] font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Calendar className="h-2.5 w-2.5 text-[#8c631f]" />
            {t('wallet.endDate', { defaultValue: 'حتى التاريخ' })}
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="mm/dd/yyyy"
            className={`h-8 w-full rounded-[0.7rem] border border-[#d4b982] bg-[#fffbf2]/96 px-2 text-[10.5px] text-[#322006] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors focus:border-[#b9852c] focus:outline-none focus:ring-2 focus:ring-[#d6a64c]/22 dark:border-[#7c6235] dark:bg-[#211b12]/95 dark:text-[#fff2d2] dark:focus:border-[#d3a44a] ${isRTL ? 'text-right' : 'text-left'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
