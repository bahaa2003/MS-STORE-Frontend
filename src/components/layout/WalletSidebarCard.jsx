import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowUpLeft, LoaderCircle, ReceiptText, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { useLanguage } from '../../context/LanguageContext';
import { formatWalletAmount } from '../../utils/storefront';
import { cn } from '../ui/Button';

const WalletSidebarCard = ({ className, isVisible = true, onNavigate }) => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { user, refreshProfile } = useAuthStore();
  const primedUserIdRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshError, setHasRefreshError] = useState(false);

  useEffect(() => {
    if (!user?.id || primedUserIdRef.current === user.id) return;
    primedUserIdRef.current = null;
    setHasRefreshError(false);
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const normalizedRole = String(user?.role || '').toLowerCase();
    const canUseWalletCard = normalizedRole === 'customer';

    if (!isVisible || !canUseWalletCard || !user?.id || typeof refreshProfile !== 'function') {
      return undefined;
    }

    if (primedUserIdRef.current === user.id) {
      return undefined;
    }

    primedUserIdRef.current = user.id;
    setIsRefreshing(true);
    setHasRefreshError(false);

    Promise.resolve(refreshProfile({ force: true }))
      .catch(() => {
        if (!isActive) return;
        setHasRefreshError(true);
      })
      .finally(() => {
        if (!isActive) return;
        setIsRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [isVisible, refreshProfile, user?.id, user?.role]);

  const walletValue = Number(user?.coins || 0);
  const walletCurrency = String(user?.currency || 'USD').toUpperCase();
  const walletDisplayValue = useMemo(
    () => formatWalletAmount(walletValue, walletCurrency, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    [walletCurrency, walletValue]
  );
  const isNegativeBalance = walletValue < 0;

  const handleNavigate = (path) => {
    navigate(path);
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  };

  return (
    <section
      dir={dir === 'rtl' ? 'rtl' : 'ltr'}
      className={cn(
        'sidebar-wallet-shimmer relative isolate overflow-hidden rounded-[17px] border border-[#d3b171]/50 bg-[linear-gradient(145deg,rgba(93,72,33,0.16),rgba(246,215,148,0.14)_38%,rgba(255,251,236,0.9)_100%)] p-2.5 shadow-[0_12px_24px_-22px_rgba(125,92,33,0.66)]',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,243,200,0.56),transparent_45%)] before:opacity-80',
        className
      )}
    >
      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold tracking-[0.1em] text-[#8d6a2d]">
              رصيد المحفظة
            </p>
            <div className="mt-1 min-h-[1.65rem]">
              {(!user && isRefreshing) ? (
                <div className="space-y-1">
                  <div className="h-2.5 w-18 animate-pulse rounded-full bg-[#d8c091]/45" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[#cba665]/35" />
                </div>
              ) : (
                <p className={`truncate text-[0.98rem] font-black tracking-[-0.01em] sm:text-[1.08rem] ${isNegativeBalance ? 'text-[#b42323]' : 'text-[#6f4f18]'}`}>
                  {walletDisplayValue}
                </p>
              )}
            </div>
          </div>

          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[#d8b36b]/55 bg-[linear-gradient(180deg,rgba(255,246,218,0.95),rgba(242,214,150,0.6))] text-[#8c631f] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]">
            <Wallet className="h-4 w-4" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigate('/wallet')}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[12px] border border-[#d8bd8b]/70 bg-white/66 px-2 text-[10px] font-semibold text-[#7b5a1f] transition-all hover:-translate-y-0.5 hover:border-[#caa159] hover:bg-white/82"
          >
            <ReceiptText className="h-3 w-3" />
            <span>تفاصيل</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('/wallet/add-balance')}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[12px] border border-[#b88b36]/80 bg-[linear-gradient(180deg,#dcb76f,#bf8f35)] px-2 text-[10px] font-bold text-white shadow-[0_9px_16px_-14px_rgba(111,78,20,0.95)] transition-all hover:-translate-y-0.5 hover:brightness-[1.03]"
          >
            <ArrowUpLeft className="h-3 w-3" />
            <span>اشحن الآن</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WalletSidebarCard;
