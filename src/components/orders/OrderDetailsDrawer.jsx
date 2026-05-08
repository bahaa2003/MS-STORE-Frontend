import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Package, RefreshCw, X } from 'lucide-react';
import Badge from '../ui/Badge';
import Button, { cn } from '../ui/Button';
import Card from '../ui/Card';
import OrderStatusBadge from './OrderStatusBadge';
import AdminOrderActions from './AdminOrderActions';
import ManualReviewActions from './ManualReviewActions';
import {
  getCustomerOrderFeedback,
  formatOrderDateTime,
  formatOrderMoney,
  getProviderDisplayName,
} from '../../utils/orders';

const DetailTile = ({ label, value, hint = '', onClick, copyable = false }) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-[0.9rem] border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[color:rgb(var(--color-card-rgb)/0.8)] px-3 py-2.5 text-start',
        onClick && 'w-full transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.28)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
          <p className="mt-1.5 break-words text-sm font-medium text-[var(--color-text)]">{value || '-'}</p>
          {hint ? (
            <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">{hint}</p>
          ) : null}
        </div>
        {copyable ? <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" /> : null}
      </div>
    </Component>
  );
};

const OrderDetailsDrawer = ({
  isOpen,
  onClose,
  order,
  isArabic,
  currencies,
  view = 'admin',
  onUpdateStatus = () => {},
  canUpdateStatus = true,
  onSync = () => {},
  isActionLoading = false,
  isSyncing = false,
}) => {
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const [copyState, setCopyState] = useState('idle');
  const primaryIdentifierField = order?.primaryIdentifierField || null;
  const requestFields = Array.isArray(order?.requestDetails?.fields) ? order.requestDetails.fields : [];
  const customerFeedback = view === 'customer'
    ? getCustomerOrderFeedback(order, isArabic ? 'ar' : 'en')
    : null;
  const customerName = order?.customerName || order?.userName || order?.userRecord?.name || '';
  const customerEmail = order?.customerEmail || order?.userEmail || order?.userRecord?.email || '';
  const customerAvatar = order?.customerAvatar || order?.userRecord?.avatar || '';
  const customerSiteId = order?.userId || order?.userRecord?.id || order?.userRecord?._id || '';
  const copyToClipboard = async (value) => {
    const text = String(value || '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard failures.
    }
  };
  const orderNumber = order?.siteOrderNumber || order?.orderNumber || '';

  useEffect(() => {
    if (copyState === 'idle') return undefined;

    const timer = window.setTimeout(() => {
      setCopyState('idle');
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (!isOpen) {
      setCopyState('idle');
    }
  }, [isOpen]);

  const handleCopyOrderNumber = async () => {
    const value = String(orderNumber || '').trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopyState('success');
    } catch (_error) {
      setCopyState('error');
    }
  };
  const detailItems = [
    {
      key: 'site-order-number',
      label: isArabic ? 'رقم الطلب' : 'Order no.',
      value: order?.siteOrderNumber || order?.orderNumber,
      copyable: true,
    },
    {
      key: 'date',
      label: isArabic ? 'تاريخ الطلب' : 'Order date',
      value: formatOrderDateTime(order?.createdAt, locale),
    },
    {
      key: 'quantity',
      label: isArabic ? 'الكمية' : 'Quantity',
      value: order?.quantity || 1,
    },
    primaryIdentifierField ? {
      key: 'primary-identifier',
      label: primaryIdentifierField.label,
      value: primaryIdentifierField.value,
    } : null,
    order?.supplierName ? {
      key: 'supplier',
      label: isArabic ? 'المورد' : 'Supplier',
      value: order.supplierName,
    } : null,
    view === 'admin' && order?.providerCode ? {
      key: 'provider-code',
      label: isArabic ? 'مزود الخدمة' : 'Service provider',
      value: getProviderDisplayName(order.providerCode, isArabic ? 'ar' : 'en'),
    } : null,
    view === 'admin' && order?.supplierOrderNumber ? {
      key: 'supplier-order-number',
      label: isArabic ? 'رقم طلب المورد' : 'Supplier order no.',
      value: order.supplierOrderNumber,
    } : null,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && order ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          />

          <div className="pointer-events-none fixed inset-0 z-[81] flex justify-end">
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="pointer-events-auto h-full w-full max-w-[30rem] border-s border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[color:rgb(var(--color-surface-rgb)/0.98)] shadow-[var(--shadow-medium)]"
            >
              <div className="flex h-full flex-col">
                <div className="border-b border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.76)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={handleCopyOrderNumber}
                        className="inline-flex max-w-full items-center gap-1 text-base font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
                        title={isArabic ? 'نسخ رقم الطلب' : 'Copy order number'}
                      >
                        <span className="truncate">#{order.siteOrderNumber || order.orderNumber}</span>
                        <Copy className="h-3.5 w-3.5 shrink-0" />
                      </button>
                      {copyState !== 'idle' ? (
                        <p
                          className={cn(
                            'mt-1 text-[11px] font-medium',
                            copyState === 'success'
                              ? 'text-[var(--color-success)]'
                              : 'text-[var(--color-danger)]'
                          )}
                        >
                          {copyState === 'success'
                            ? (isArabic ? 'تم نسخ رقم الطلب' : 'Order number copied')
                            : (isArabic ? 'تعذر نسخ رقم الطلب' : 'Unable to copy order number')}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={order.status} isArabic={isArabic} />
                        <Badge variant={order.typeVariant}>{order.typeLabel}</Badge>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-3.5">
                    <Card variant="premium" className="overflow-hidden p-3.5">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[color:rgb(var(--color-card-rgb)/0.82)]">
                            {order.productImage ? (
                              <img src={order.productImage} alt={order.productName} decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-[var(--color-text)]">{order.productName}</h3>
                            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                              {formatOrderMoney(order, currencies, locale)}
                            </p>
                          </div>
                        </div>

                        {view === 'admin' ? (
                          <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.78)] px-3 py-3">
                            <div className="flex items-center gap-3">
                              {customerAvatar ? (
                                <img
                                  src={customerAvatar}
                                  alt={customerName}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  className="h-10 w-10 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.9)] object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-xs font-black text-[var(--color-primary)]">
                                  {String(customerName || 'U').trim().slice(0, 1).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{customerName || (isArabic ? 'عميل غير معروف' : 'Unknown customer')}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-muted)]">
                                  <button type="button" onClick={() => copyToClipboard(customerName)} className="max-w-full truncate hover:text-[var(--color-primary)]">
                                    {isArabic ? 'اسم الحساب:' : 'Account name:'} {customerName || '-'}
                                  </button>
                                  <button type="button" onClick={() => copyToClipboard(customerSiteId)} className="max-w-full truncate hover:text-[var(--color-primary)]">
                                    {isArabic ? 'المعرف:' : 'ID:'} {customerSiteId || '-'}
                                  </button>
                                </div>
                                {customerEmail ? (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(customerEmail)}
                                    className="mt-1 block truncate text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                                  >
                                    {customerEmail}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.78)] px-3 py-2.5">
                            <p className="text-[11px] font-medium text-[var(--color-muted)]">{isArabic ? 'نوع التنفيذ' : 'Fulfilment type'}</p>
                            <div className="mt-1.5">
                              <Badge variant={order.typeVariant}>{order.typeLabel}</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    <div className={cn('grid gap-2.5', view === 'customer' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
                      {detailItems.map((item) => (
                        <DetailTile
                          key={item.key}
                          label={item.label}
                          value={item.value}
                          copyable={item.copyable}
                          onClick={item.copyable ? handleCopyOrderNumber : undefined}
                        />
                      ))}
                    </div>

                    {customerFeedback ? (
                      <Card
                        variant="flat"
                        className={cn(
                          'p-3.5',
                          customerFeedback.tone === 'success'
                            ? 'border-[color:rgb(var(--color-success-rgb)/0.28)] bg-[color:rgb(var(--color-success-rgb)/0.1)]'
                            : customerFeedback.tone === 'danger'
                              ? 'border-[color:rgb(var(--color-error-rgb)/0.28)] bg-[color:rgb(var(--color-error-rgb)/0.1)]'
                              : 'border-[color:rgb(var(--color-warning-rgb)/0.28)] bg-[color:rgb(var(--color-warning-rgb)/0.1)]'
                        )}
                      >
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {customerFeedback.title}
                        </p>
                        <p className="mt-1.5 text-xs leading-6 text-[var(--color-text-secondary)]">
                          {customerFeedback.description}
                        </p>
                      </Card>
                    ) : null}

                    {/* ── Rejection Reason (admin view) ──────────────────── */}
                    {view === 'admin' && order.rejectionReason ? (
                      <Card variant="flat" className="border-[color:rgb(var(--color-error-rgb)/0.28)] bg-[color:rgb(var(--color-error-rgb)/0.08)] p-3.5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {isArabic ? 'سبب الرفض' : 'Rejection reason'}
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {order.rejectionReason}
                        </p>
                      </Card>
                    ) : null}

                    {requestFields.length ? (
                      <Card variant="flat" className="p-3.5">
                        <div className="mb-2.5">
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {isArabic ? 'معلومات المستخدم' : 'User information'}
                          </p>
                        </div>

                        <div className={cn('grid gap-2.5', view === 'customer' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
                          {requestFields.map((field) => (
                            <DetailTile
                              key={`${order.id}-${field.key}`}
                              label={field.label}
                              value={field.value}
                              hint={field.placeholder}
                            />
                          ))}
                        </div>
                      </Card>
                    ) : null}

                    {order.notes ? (
                      <Card variant="flat" className="p-3.5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {isArabic ? 'ملاحظات' : 'Notes'}
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{order.notes}</p>
                      </Card>
                    ) : null}

                    {view === 'admin' && order.canSync && canUpdateStatus ? (
                      <Card variant="flat" className="p-3.5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                              {isArabic ? 'مزامنة المورد' : 'Supplier sync'}
                            </p>
                          </div>

                          <Button variant="secondary" className="h-9 rounded-xl px-3 text-xs" onClick={() => onSync(order)} disabled={isSyncing}>
                            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                            <span>{isArabic ? 'مزامنة الآن' : 'Sync now'}</span>
                          </Button>
                        </div>
                      </Card>
                    ) : null}

                    {view === 'admin' && canUpdateStatus ? (
                      <>
                        <ManualReviewActions
                          order={order}
                          isArabic={isArabic}
                          isLoading={isActionLoading}
                          onUpdateStatus={onUpdateStatus}
                        />
                        <AdminOrderActions
                          order={order}
                          isArabic={isArabic}
                          isLoading={isActionLoading}
                          onUpdateStatus={onUpdateStatus}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default OrderDetailsDrawer;
