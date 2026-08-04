import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Boxes,
  Building2,
  PackageSearch,
  RefreshCw,
  Scale,
  Search,
} from 'lucide-react';
import apiClient from '../../services/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useLanguage } from '../../context/LanguageContext';

const getArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  if (value.data && value.data !== value) {
    return getArray(value.data, keys);
  }

  return [];
};

const firstValue = (...values) => values.find((value) => (
  value !== undefined && value !== null && String(value).trim() !== ''
));

const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toEnglishDigits = (value) => String(value ?? '')
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const normalizeComparisonKey = (value) => String(value || '')
  .trim()
  .toLocaleLowerCase()
  .replace(/[\s_\-–—]+/g, ' ');

const getProductStatus = (product) => String(
  firstValue(product?.status, product?.productStatus, product?.rawPayload?.status, '')
).toLowerCase();

const isActiveProduct = (product) => (
  product?.isActive !== false
  && !['inactive', 'disabled', 'unavailable', 'deleted'].includes(getProductStatus(product))
);

const normalizeProduct = (product, supplier, index) => {
  const raw = product?.rawPayload || {};
  const supplierId = String(supplier?.id || supplier?._id || 'supplier');
  const externalId = firstValue(
    product?.externalProductId,
    product?.providerProductId,
    product?.productId,
    product?.sku,
    product?.id,
    raw?.id,
  );
  const name = firstValue(
    product?.translatedName,
    product?.rawName,
    product?.name,
    product?.externalProductName,
    product?.productName,
    product?.title,
    raw?.product_name_translated,
    raw?.product_name,
    raw?.name,
    externalId,
    'منتج بدون اسم',
  );
  const price = firstValue(
    product?.rawPrice,
    product?.priceCoins,
    product?.supplierPrice,
    product?.basePriceCoins,
    product?.cost,
    product?.price,
    raw?.product_price,
    raw?.price,
  );
  const minQty = firstValue(
    product?.minQty,
    product?.minimumOrderQty,
    product?.minimumQty,
    product?.min,
    raw?.min,
    raw?.min_qty,
    raw?.minimum,
  );
  const maxQty = firstValue(
    product?.maxQty,
    product?.maximumOrderQty,
    product?.maximumQty,
    product?.max,
    raw?.max,
    raw?.max_qty,
    raw?.maximum,
  );

  return {
    id: `${supplierId}-${externalId || index}`,
    externalId: toEnglishDigits(externalId || ''),
    name: toEnglishDigits(name),
    comparisonKey: normalizeComparisonKey(name),
    supplierId,
    supplierName: toEnglishDigits(supplier?.supplierName || supplier?.name || supplier?.supplierCode || supplierId),
    price,
    numericPrice: toNumber(price),
    minQty,
    maxQty,
  };
};

const formatValue = (value, locale, maximumFractionDigits = 8) => {
  if (value === undefined || value === null || String(value).trim() === '') return '—';
  const numericValue = toNumber(value);

  if (numericValue === null) return toEnglishDigits(value);

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(numericValue);
};

const formatExactPrice = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return '—';

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  }

  return toEnglishDigits(value)
    .replace(/٬/g, ',')
    .replace(/٫/g, '.');
};

const sortRows = (rows, sortMode) => [...rows].sort((first, second) => {
  if (sortMode === 'supplier') {
    return first.supplierName.localeCompare(second.supplierName, 'ar');
  }

  const firstPrice = first.numericPrice;
  const secondPrice = second.numericPrice;
  if (firstPrice === null && secondPrice === null) return first.name.localeCompare(second.name, 'ar');
  if (firstPrice === null) return 1;
  if (secondPrice === null) return -1;

  return sortMode === 'price-desc' ? secondPrice - firstPrice : firstPrice - secondPrice;
});

const AdminSupplierPriceCompetition = () => {
  const { dir } = useLanguage();
  const locale = 'en-US';
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortMode, setSortMode] = useState('price-asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedSuppliersCount, setFailedSuppliersCount] = useState(0);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setFailedSuppliersCount(0);

    try {
      const supplierResponse = await apiClient.suppliers.list();
      const activeSuppliers = getArray(supplierResponse, ['suppliers', 'providers'])
        .filter((supplier) => supplier && supplier.isActive !== false);

      setSuppliers(activeSuppliers);

      const supplierResults = await Promise.allSettled(activeSuppliers.map(async (supplier) => {
        const response = await apiClient.products.listProviderProducts(supplier.id || supplier._id);
        return getArray(response, ['providerProducts', 'products', 'items', 'synced'])
          .filter(isActiveProduct)
          .map((product, index) => normalizeProduct(product, supplier, index));
      }));

      const loadedProducts = supplierResults.flatMap((result) => (
        result.status === 'fulfilled' ? result.value : []
      ));
      const failedCount = supplierResults.filter((result) => result.status === 'rejected').length;

      setProducts(loadedProducts);
      setFailedSuppliersCount(failedCount);
      if (failedCount === activeSuppliers.length && activeSuppliers.length > 0) {
        setError('تعذر جلب كتالوجات الموردين. حاول التحديث مرة أخرى.');
      }
    } catch (loadError) {
      setSuppliers([]);
      setProducts([]);
      setError(loadError?.message || 'تعذر تحميل بيانات الموردين الآن.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = String(search || '').trim().toLocaleLowerCase();
    const filtered = products.filter((product) => {
      const matchesSupplier = supplierFilter === 'all' || product.supplierId === supplierFilter;
      const matchesSearch = !normalizedSearch || [
        product.name,
        product.externalId,
        product.supplierName,
      ].some((value) => String(value || '').toLocaleLowerCase().includes(normalizedSearch));

      return matchesSupplier && matchesSearch;
    });

    return sortRows(filtered, sortMode);
  }, [products, search, supplierFilter, sortMode]);

  const bestPriceByProduct = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      if (!product.comparisonKey || product.numericPrice === null) return;
      const current = map.get(product.comparisonKey);
      if (!current) {
        map.set(product.comparisonKey, { price: product.numericPrice, suppliers: new Set([product.supplierId]) });
        return;
      }

      current.price = Math.min(current.price, product.numericPrice);
      current.suppliers.add(product.supplierId);
    });

    return map;
  }, [products]);

  const pricedProducts = visibleProducts.filter((product) => product.numericPrice !== null);
  const lowestVisiblePrice = pricedProducts.length
    ? Math.min(...pricedProducts.map((product) => product.numericPrice))
    : null;

  const isBestPrice = (product) => {
    const comparison = bestPriceByProduct.get(product.comparisonKey);
    return Boolean(
      comparison
      && comparison.suppliers.size > 1
      && product.numericPrice !== null
      && product.numericPrice === comparison.price
    );
  };

  const summaryCards = [
    { label: 'الموردون النشطون', value: suppliers.length, icon: Building2 },
    { label: 'إجمالي المنتجات', value: products.length, icon: Boxes },
    { label: 'نتائج البحث', value: visibleProducts.length, icon: Search },
    { label: 'أقل سعر ظاهر', value: lowestVisiblePrice, icon: Scale, isPrice: true },
  ];

  return (
    <div className="min-w-0 space-y-3 [font-variant-numeric:tabular-nums]" dir={dir}>
      <section className="admin-premium-hero overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="premium" className="w-fit">مقارنة مباشرة</Badge>
            <h1 className="mt-2 text-xl font-black tracking-tight text-gray-950 dark:text-white sm:text-2xl">
              منافسة أسعار الموردين
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-gray-600 dark:text-gray-300 sm:text-sm">
              ابحث في منتجات الموردين النشطين وقارن السعر والحد الأدنى والأقصى من شاشة واحدة.
            </p>
          </div>

          <Button type="button" size="sm" onClick={loadProducts} disabled={isLoading} className="w-fit shrink-0">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث المنتجات
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:max-w-3xl sm:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="min-w-0 rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold leading-4 text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="mt-0.5 break-all text-sm font-black leading-tight text-gray-950 dark:text-white">
                      {card.isPrice && card.value !== null
                        ? formatExactPrice(card.value)
                        : card.value === null ? '—' : formatValue(card.value, locale, 0)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-gray-200 bg-white/95 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/95">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_220px_190px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم المنتج أو رقمه أو اسم المورد..."
            variant="search"
            className="h-10 rounded-xl text-sm shadow-none focus:shadow-none"
          />

          <select
            value={supplierFilter}
            onChange={(event) => setSupplierFilter(event.target.value)}
            className="h-10 min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-900 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.18)] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            aria-label="تصفية حسب المورد"
          >
            <option value="all">كل الموردين النشطين</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id || supplier._id} value={supplier.id || supplier._id}>
                {supplier.supplierName || supplier.name || supplier.supplierCode || supplier.id}
              </option>
            ))}
          </select>

          <label className="relative block">
            <ArrowDownUp className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 bg-white pe-3 ps-9 text-xs font-semibold text-gray-900 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.18)] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              aria-label="ترتيب النتائج"
            >
              <option value="price-asc">السعر: الأقل أولاً</option>
              <option value="price-desc">السعر: الأعلى أولاً</option>
              <option value="supplier">حسب اسم المورد</option>
            </select>
          </label>
        </div>

        {failedSuppliersCount > 0 && !error && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            تم عرض النتائج المتاحة، وتعذر جلب منتجات {formatValue(failedSuppliersCount, locale, 0)} من الموردين.
          </p>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-gray-200 bg-white/90 text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          <p className="text-xs font-semibold">جاري جمع منتجات الموردين النشطين...</p>
        </div>
      ) : visibleProducts.length ? (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:hidden">
            {visibleProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-[0.85rem] border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(245,243,255,0.92))] px-2.5 py-2 dark:border-gray-700 dark:bg-[linear-gradient(135deg,rgba(31,41,55,0.98),rgba(51,65,85,0.94))]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-black leading-5 text-gray-950 dark:text-white">{product.name}</p>
                      {product.externalId && (
                        <p dir="ltr" className="mt-0.5 break-all text-end text-[9px] font-medium text-gray-500 dark:text-gray-400">ID: {product.externalId}</p>
                      )}
                    </div>
                    {isBestPrice(product) && <Badge variant="success" className="shrink-0 px-1.5 py-0.5 text-[8px]">أقل سعر</Badge>}
                  </div>
                  <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                    <Building2 className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
                    <span className="break-words">{product.supplierName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-700">
                  <div className="bg-white px-1.5 py-2 text-center dark:bg-gray-800">
                    <p className="text-[8px] font-bold text-gray-500 dark:text-gray-400">السعر</p>
                    <p dir="ltr" className="mt-0.5 break-all text-[10px] font-black leading-tight text-[var(--color-primary)]">{formatExactPrice(product.price)}</p>
                  </div>
                  <div className="bg-white px-1.5 py-2 text-center dark:bg-gray-800">
                    <p className="text-[8px] font-bold text-gray-500 dark:text-gray-400">أقل كمية</p>
                    <p dir="ltr" className="mt-0.5 break-all text-[11px] font-black text-gray-900 dark:text-white">{formatValue(product.minQty, locale)}</p>
                  </div>
                  <div className="bg-white px-1.5 py-2 text-center dark:bg-gray-800">
                    <p className="text-[8px] font-bold text-gray-500 dark:text-gray-400">أكبر كمية</p>
                    <p dir="ltr" className="mt-0.5 break-all text-[11px] font-black text-gray-900 dark:text-white">{formatValue(product.maxQty, locale)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white shadow-sm md:block dark:border-gray-700 dark:bg-gray-800">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 px-3 text-[10px]">المنتج</TableHead>
                  <TableHead className="h-10 px-3 text-[10px]">المورد</TableHead>
                  <TableHead className="h-10 px-3 text-[10px]">السعر</TableHead>
                  <TableHead className="h-10 px-3 text-[10px]">أقل كمية</TableHead>
                  <TableHead className="h-10 px-3 text-[10px]">أكبر كمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-3 py-2.5">
                      <div className="max-w-[360px]">
                        <div className="flex items-center gap-2">
                          <span className="break-words text-xs font-bold text-gray-950 dark:text-white">{product.name}</span>
                          {isBestPrice(product) && <Badge variant="success" className="shrink-0 px-1.5 py-0.5 text-[8px]">أقل سعر</Badge>}
                        </div>
                        {product.externalId && (
                          <p dir="ltr" className="mt-0.5 break-all text-end text-[9px] text-gray-500 dark:text-gray-400">ID: {product.externalId}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:rgb(var(--color-primary-rgb)/0.07)] px-2 py-1 text-[10px] font-bold text-gray-800 dark:text-gray-100">
                        <Building2 className="h-3 w-3 text-[var(--color-primary)]" />
                        {product.supplierName}
                      </span>
                    </TableCell>
                    <TableCell dir="ltr" className="whitespace-nowrap px-3 py-2.5 text-end text-xs font-black text-[var(--color-primary)]">{formatExactPrice(product.price)}</TableCell>
                    <TableCell dir="ltr" className="px-3 py-2.5 text-end text-xs font-bold text-gray-800 dark:text-gray-100">{formatValue(product.minQty, locale)}</TableCell>
                    <TableCell dir="ltr" className="px-3 py-2.5 text-end text-xs font-bold text-gray-800 dark:text-gray-100">{formatValue(product.maxQty, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-gray-300 bg-white/90 px-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
            <PackageSearch className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-sm font-black text-gray-900 dark:text-white">لا توجد منتجات مطابقة</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            غيّر كلمات البحث أو اختر كل الموردين ثم أعد المحاولة.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSupplierPriceCompetition;
