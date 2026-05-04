import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  Coins,
  ShoppingCart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import OrdersFiltersBar from '../components/orders/OrdersFiltersBar';
import CustomerOrderCard from '../components/orders/CustomerOrderCard';
import OrderDetailsDrawer from '../components/orders/OrderDetailsDrawer';
import EmptyOrdersState from '../components/orders/EmptyOrdersState';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useMediaStore from '../store/useMediaStore';
import useSystemStore from '../store/useSystemStore';
import {
  filterOrders,
  enrichOrders,
  getOrderAmountValue,
  getOrderCurrencyCode,
  summarizeOrders,
} from '../utils/orders';
import { formatNumber } from '../utils/intl';
import { formatCurrencyAmount } from '../utils/pricing';

const SummaryCard = ({ icon: Icon, label, value, note }) => (
  <Card variant="flat" className="p-2">
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.7rem] border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] text-[var(--color-primary)]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] leading-3 text-[var(--color-text-secondary)]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold leading-none text-[var(--color-text)]" title={String(value)}>{value}</p>
      </div>
    </div>
  </Card>
);

const Orders = () => {
  const { user } = useAuthStore();
  const { orders, loadOrders, getOrderById } = useOrderStore();
  const { products, loadProducts } = useMediaStore();
  const { currencies, loadCurrencies } = useSystemStore();
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('custom');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const locale = isArabic ? 'ar-EG' : 'en-US';

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      setIsLoading(true);

      await Promise.allSettled([
        Promise.resolve(loadOrders(user?.id)),
        Promise.resolve(loadProducts()),
        Promise.resolve(loadCurrencies()),
      ]);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [loadCurrencies, loadOrders, loadProducts, user?.id]);

  const enrichedOrders = useMemo(
    () => enrichOrders(orders, {
      users: user ? [user] : [],
      products,
      language: isArabic ? 'ar' : 'en',
    }),
    [orders, products, user, isArabic]
  );

  const filteredOrders = useMemo(
    () => {
      const baseFiltered = filterOrders(enrichedOrders, {
        searchTerm,
        statusFilter,
        typeFilter: 'all',
        dateFilter,
        sortOrder,
      });

      if (dateFilter !== 'custom') {
        return baseFiltered;
      }

      const startBoundary = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      const endBoundary = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

      return baseFiltered.filter((order) => {
        const orderDate = new Date(order?.createdAt || 0);
        if (Number.isNaN(orderDate.getTime())) return false;
        if (startBoundary && orderDate < startBoundary) return false;
        if (endBoundary && orderDate > endBoundary) return false;
        return true;
      });
    },
    [customEndDate, customStartDate, dateFilter, enrichedOrders, searchTerm, sortOrder, statusFilter]
  );

  const summary = useMemo(() => summarizeOrders(filteredOrders), [filteredOrders]);

  const totalRechargeAmount = useMemo(() => {
    const totalsByCurrency = filteredOrders.reduce((map, order) => {
      const currencyCode = getOrderCurrencyCode(order);
      const amount = getOrderAmountValue(order);
      map.set(currencyCode, (map.get(currencyCode) || 0) + amount);
      return map;
    }, new Map());

    const totals = Array.from(totalsByCurrency.entries())
      .filter(([, amount]) => amount > 0)
      .map(([currencyCode, amount]) => formatCurrencyAmount(amount, currencyCode, currencies, locale));

    return totals.length ? totals.join(' + ') : formatCurrencyAmount(0, user?.currency || 'USD', currencies, locale);
  }, [currencies, enrichedOrders, locale, user?.currency]);

  const selectedOrder = useMemo(
    () => enrichedOrders.find((order) => order.id === selectedOrderId) || null,
    [enrichedOrders, selectedOrderId]
  );

  useEffect(() => {
    const orderIdFromQuery = String(searchParams.get('orderId') || '').trim();
    if (!orderIdFromQuery) return;

    setSelectedOrderId(orderIdFromQuery);
    void getOrderById(orderIdFromQuery, user?.id).catch(() => {});
  }, [getOrderById, searchParams, user?.id]);

  const formatCount = (value) => formatNumber(value, locale);

  return (
    <div className="min-w-0 space-y-4 pb-3">
      <section className="premium-card relative overflow-hidden p-2.5 sm:p-3">
        <div className="pointer-events-none absolute -top-14 right-4 h-20 w-20 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.12)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.07)] blur-3xl" />

        <div className="relative min-w-0">
          <span className="section-kicker px-3 py-1 text-[0.62rem]">
            {isArabic ? 'Orders Overview' : 'Orders Overview'}
          </span>
          <h1 className="mt-2 text-2xl font-black leading-none tracking-[-0.03em] text-[var(--color-text)] sm:text-3xl">
            {isArabic ? 'طلباتي' : 'My Orders'}
          </h1>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          <SummaryCard
            icon={ShoppingCart}
            label={isArabic ? 'إجمالي الطلبات' : 'Total orders'}
            value={formatCount(summary.total)}
            note={isArabic ? 'طلباتك المسجلة فقط' : 'Only your own orders'}
          />
          <SummaryCard
            icon={Clock3}
            label={isArabic ? 'قيد التنفيذ' : 'In progress'}
            value={formatCount(summary.processing)}
            note={isArabic ? 'ما زالت تحت التنفيذ أو المراجعة' : 'Still in progress or under review'}
          />
          <SummaryCard
            icon={CheckCircle2}
            label={isArabic ? 'مكتملة' : 'Completed'}
            value={formatCount(summary.completed)}
            note={isArabic ? 'طلبات انتهى تنفيذها' : 'Orders that were fulfilled successfully'}
          />
          <SummaryCard
            icon={Coins}
            label={isArabic ? 'إجمالي مبلغ الشحن' : 'Total recharge'}
            value={totalRechargeAmount}
            note={isArabic ? 'إجمالي مبالغ طلباتك' : 'Total order amounts'}
          />
        </div>
      </section>

      <OrdersFiltersBar
        isArabic={isArabic}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        showTypeFilter={false}
        showDateFilter={false}
        resultCount={filteredOrders.length}
        searchPlaceholder={isArabic
          ? 'ابحث باسم المنتج أو رقم الطلب'
          : 'Search by product name or order number'}
        helperText={isArabic
          ? 'اختار مدة البحث من تاريخ إلى تاريخ، أو اتركها فارغة لعرض كل الطلبات.'
          : 'Choose a from-to date range, or leave it empty to show all orders.'}
        customRange={{
          startDate: customStartDate,
          endDate: customEndDate,
          onStartDateChange: setCustomStartDate,
          onEndDateChange: setCustomEndDate,
          helperText: isArabic
            ? 'فلترة الطلبات حسب تاريخ الإنشاء من بداية اليوم الأول لنهاية اليوم الأخير.'
            : 'Filters orders by creation date from the start date through the end date.',
        }}
        compact
      />

      {filteredOrders.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredOrders.map((order) => (
            <CustomerOrderCard
              key={order.id}
              order={order}
              isArabic={isArabic}
              currencies={currencies}
              onSelect={() => {
                setSelectedOrderId(order.id);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set('orderId', order.id);
                setSearchParams(nextParams, { replace: true });
                void getOrderById(order.id, user?.id).catch(() => {});
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyOrdersState
          title={isLoading
            ? (isArabic ? 'جارٍ تحميل الطلبات' : 'Loading orders')
            : (isArabic ? 'لا توجد طلبات حتى الآن' : 'No orders yet')}
          description={isLoading
            ? (isArabic ? 'نقوم بجلب طلباتك الحالية من النظام.' : 'We are fetching your current orders from the system.')
            : (isArabic
              ? 'عندما تنشئ طلبًا جديدًا سيظهر هنا مع حالته وتفاصيله كاملة.'
              : 'Once you place a new order, it will appear here with its status and details.')}
          actionLabel={isLoading ? '' : (isArabic ? 'تصفح المنتجات' : 'Browse products')}
          actionTo={isLoading ? '' : '/products'}
        />
      )}

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrderId(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('orderId');
          setSearchParams(nextParams, { replace: true });
        }}
        order={selectedOrder}
        isArabic={isArabic}
        currencies={currencies}
        view="customer"
      />
    </div>
  );
};

export default Orders;
