import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import apiClient from '../../services/client';
import Button, { cn } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/account/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../context/LanguageContext';

const EMPTY_STATUS = {
  isReady: false,
  isInitializing: false,
  qrDataUrl: null,
  lastError: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  adminNumberConfigured: false,
  dependencyAvailable: false,
};

const normalizeStatus = (status = {}) => ({
  ...EMPTY_STATUS,
  ...(status && typeof status === 'object' ? status : {}),
});

const formatDateTime = (value, locale) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const StatusTile = ({ icon: Icon, label, value, variant = 'default' }) => {
  const variants = {
    success: 'border-[color:rgb(var(--color-success-rgb)/0.18)] bg-[color:rgb(var(--color-success-rgb)/0.08)] text-[var(--color-success)]',
    warning: 'border-[color:rgb(var(--color-warning-rgb)/0.2)] bg-[color:rgb(var(--color-warning-rgb)/0.08)] text-[var(--color-warning)]',
    danger: 'border-[color:rgb(var(--color-error-rgb)/0.2)] bg-[color:rgb(var(--color-error-rgb)/0.08)] text-[var(--color-error)]',
    default: 'border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] text-[var(--color-text-secondary)]',
  };

  return (
    <div className={cn('min-w-0 rounded-[1rem] border p-3', variants[variant] || variants.default)}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] bg-[color:rgb(var(--color-card-rgb)/0.62)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 text-xs font-semibold text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-black text-[var(--color-text)]">{value}</p>
    </div>
  );
};

const WhatsAppSettings = () => {
  const { addToast } = useToast();
  const { dir, language } = useLanguage();
  const isEnglish = language === 'en';
  const locale = isEnglish ? 'en-US' : 'ar-EG';
  const tx = useCallback((ar, en) => (isEnglish ? en : ar), [isEnglish]);

  const [status, setStatus] = useState(EMPTY_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const applyStatus = useCallback((nextStatus) => {
    setStatus(normalizeStatus(nextStatus));
  }, []);

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const nextStatus = await apiClient.whatsapp.getStatus();
      applyStatus(nextStatus);
      setErrorMessage('');
      return nextStatus;
    } catch (error) {
      const message = error?.message || tx('تعذر تحميل حالة واتساب.', 'Unable to load WhatsApp status.');
      setErrorMessage(message);
      if (!silent) {
        addToast(tx('تعذر تحميل حالة واتساب.', 'Unable to load WhatsApp status.'), 'error');
      }
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addToast, applyStatus, tx]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const shouldPoll = !status.isReady || Boolean(status.qrDataUrl) || status.isInitializing;
  useEffect(() => {
    if (!shouldPoll) return undefined;
    const timer = window.setInterval(() => {
      loadStatus({ silent: true });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [loadStatus, shouldPoll]);

  const runAction = async (action, runner, successMessage) => {
    setActiveAction(action);
    try {
      const nextStatus = await runner();
      applyStatus(nextStatus);
      setErrorMessage('');
      addToast(successMessage, 'success');
    } catch (error) {
      const message = error?.message || tx('تعذر تنفيذ العملية.', 'Unable to complete the action.');
      setErrorMessage(message);
      addToast(message, 'error');
    } finally {
      setActiveAction('');
    }
  };

  const handleReconnect = () => runAction(
    'reconnect',
    () => apiClient.whatsapp.reconnect(),
    tx('تم إرسال أمر إعادة الاتصال.', 'Reconnect requested.')
  );

  const handleReset = () => runAction(
    'reset',
    () => apiClient.whatsapp.reset(),
    tx('تمت إعادة ضبط جلسة واتساب.', 'WhatsApp session reset requested.')
  );

  const connectionBadge = useMemo(() => {
    if (!status.dependencyAvailable) {
      return { label: tx('المكتبة غير متاحة', 'Dependency missing'), variant: 'danger', icon: XCircle };
    }
    if (status.isReady) {
      return { label: tx('متصل', 'Connected'), variant: 'success', icon: Wifi };
    }
    if (status.isInitializing) {
      return { label: tx('جاري التهيئة', 'Initializing'), variant: 'warning', icon: Loader2 };
    }
    return { label: tx('غير متصل', 'Disconnected'), variant: 'warning', icon: WifiOff };
  }, [status.dependencyAvailable, status.isInitializing, status.isReady, tx]);

  const ConnectionIcon = connectionBadge.icon;
  const resetLoading = activeAction === 'reset';

  return (
    <div className="space-y-5" dir={dir}>
      <section className="flex flex-col gap-4 rounded-[1.35rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-surface-rgb)/0.56))] p-4 shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="section-kicker text-[10px] sm:text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            {tx('إعدادات الإدارة', 'Admin settings')}
          </span>
          <h1 className="mt-3 text-2xl font-black text-[var(--color-text)] sm:text-3xl">
            {tx('واتساب', 'WhatsApp')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            {tx(
              'حالة اتصال واتساب الخاص بإشعارات الإدارة فقط.',
              'Connection status for admin-only WhatsApp notifications.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => loadStatus()}
            disabled={isLoading || Boolean(activeAction)}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            {tx('تحديث', 'Refresh')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            disabled={Boolean(activeAction)}
          >
            <Wifi className={cn('h-4 w-4', activeAction === 'reconnect' && 'animate-pulse')} />
            {tx('إعادة اتصال', 'Reconnect')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setResetConfirmOpen(true)}
            disabled={Boolean(activeAction)}
          >
            <RotateCcw className="h-4 w-4" />
            {tx('إعادة ضبط', 'Reset')}
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-[1rem] border border-[color:rgb(var(--color-error-rgb)/0.22)] bg-[color:rgb(var(--color-error-rgb)/0.08)] p-4 text-[var(--color-error)]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="min-w-0 text-sm font-semibold leading-6">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card variant="flat" className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {tx('الحالة الحالية', 'Current status')}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
                  <ConnectionIcon className={cn('h-5 w-5', status.isInitializing && 'animate-spin')} />
                </span>
                <div className="min-w-0">
                  <Badge variant={connectionBadge.variant}>{connectionBadge.label}</Badge>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {status.qrDataUrl
                      ? tx('امسح رمز QR لإكمال الربط.', 'Scan the QR code to complete login.')
                      : tx('تظهر بيانات الاتصال من الخادم مباشرة.', 'Connection details come directly from the backend.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatusTile
              icon={Smartphone}
              label={tx('رقم الأدمن', 'Admin number')}
              value={status.adminNumberConfigured ? tx('مضبوط', 'Configured') : tx('غير مضبوط', 'Missing')}
              variant={status.adminNumberConfigured ? 'success' : 'danger'}
            />
            <StatusTile
              icon={ShieldCheck}
              label={tx('المكتبة', 'Dependency')}
              value={status.dependencyAvailable ? tx('متاحة', 'Available') : tx('غير متاحة', 'Missing')}
              variant={status.dependencyAvailable ? 'success' : 'danger'}
            />
            <StatusTile
              icon={CheckCircle2}
              label={tx('آخر اتصال', 'Last connected')}
              value={formatDateTime(status.lastConnectedAt, locale)}
            />
            <StatusTile
              icon={WifiOff}
              label={tx('آخر فصل', 'Last disconnected')}
              value={formatDateTime(status.lastDisconnectedAt, locale)}
            />
          </div>

          <div className="mt-3 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] p-3">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{tx('آخر خطأ', 'Last error')}</p>
            <p className="mt-2 break-words text-sm font-semibold text-[var(--color-text)]">
              {status.lastError || '-'}
            </p>
          </div>
        </Card>

        <Card variant="flat" className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {tx('رمز الربط', 'Login QR')}
              </p>
              <h2 className="mt-2 text-lg font-black text-[var(--color-text)]">
                {status.qrDataUrl ? tx('امسح الرمز من واتساب', 'Scan from WhatsApp') : tx('لا يوجد رمز حاليًا', 'No QR available')}
              </h2>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
              <QrCode className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 flex min-h-[20rem] items-center justify-center rounded-[1.2rem] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-surface-rgb)/0.34)] p-4">
            {status.qrDataUrl ? (
              <img
                src={status.qrDataUrl}
                alt={tx('رمز QR لتسجيل الدخول إلى واتساب', 'WhatsApp login QR code')}
                className="aspect-square w-full max-w-[18rem] rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-white p-3 shadow-[var(--shadow-subtle)]"
              />
            ) : (
              <div className="max-w-md text-center">
                <QrCode className="mx-auto h-12 w-12 text-[var(--color-text-secondary)]" />
                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">
                  {status.isReady
                    ? tx('العميل متصل بالفعل ولا يحتاج إلى رمز جديد.', 'The client is already connected and does not need a new QR code.')
                    : tx('اضغط إعادة اتصال أو انتظر قليلًا حتى يظهر الرمز.', 'Reconnect or wait a moment for the QR code to appear.')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title={tx('إعادة ضبط جلسة واتساب', 'Reset WhatsApp session')}
        description={tx(
          'سيتم حذف جلسة الربط الحالية وسيظهر رمز QR جديد عند توفره.',
          'The current session will be cleared and a new QR code will appear when available.'
        )}
        confirmLabel={tx('إعادة ضبط', 'Reset')}
        cancelLabel={tx('إلغاء', 'Cancel')}
        isLoading={resetLoading}
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={async () => {
          await handleReset();
          setResetConfirmOpen(false);
        }}
      />
    </div>
  );
};

export default WhatsAppSettings;
