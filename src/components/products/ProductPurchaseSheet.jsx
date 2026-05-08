import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  LoaderCircle,
  Package2,
  X,
  Zap,
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import Button, { cn } from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';
import useAuthStore from '../../store/useAuthStore';
import useGroupStore from '../../store/useGroupStore';
import useOrderStore from '../../store/useOrderStore';
import useSystemStore from '../../store/useSystemStore';
import useMediaStore from '../../store/useMediaStore';
import { useLanguage } from '../../context/LanguageContext';
import {
  calculateProductPrice,
  formatCurrencyAmount,
  getCurrencyMeta,
  resolveProductUnitPrice,
} from '../../utils/pricing';
import coinsImage from '../../assets/عملات.PNG';
import { normalizeMoneyAmount } from '../../utils/money';
import { getProductStatus } from '../../utils/productStatus';
import {
  clampProductQuantity,
  getProductQuantityMeta,
  resolveProductOrderFields,
  sanitizeOrderFieldValue,
} from '../../utils/productPurchase';
import { isApprovedAccountStatus } from '../../utils/accountStatus';
import { devLogger } from '../../utils/devLogger';

const getCopy = (language = 'ar') => {
  if (language === 'en') {
    return {
      closeLabel: 'Close',
      quickOrder: 'Quick Order',
      unitPrice: 'Unit Price',
      available: 'Available',
      unavailable: 'Unavailable',
      orderFields: 'Order Fields',
      orderFieldsHint: 'Fill in the required details before purchase.',
      quantityTitle: 'Quantity',
      countTitle: 'Count',
      min: 'Min',
      max: 'Max',
      step: 'Step',
      total: 'Total',
      totalHint: 'Updated automatically based on quantity.',
      auto24Hint: 'This product runs automatically 24/7.',
      userIdLabel: 'User ID',
      buy: 'Buy',
      cancel: 'Cancel',
      processing: 'Processing...',
      insufficientTitle: 'Insufficient balance',
      insufficientMessage: (amount) => `You need ${amount} more to complete this order.`,
      pendingTitle: 'Account unavailable',
      pendingMessage: 'Purchasing is not available for this account right now.',
      unavailableTitle: 'Product unavailable',
      unavailableMessage: 'This product is currently unavailable for purchase.',
      preparingTitle: 'Preparing sheet',
      preparingMessage: 'Loading pricing and currency details...',
      successTitle: 'Order placed',
      successMessage: 'Your order has been submitted successfully.',
      successDone: 'Completed successfully',
      successViewOrder: 'Order details',
      failedTitle: 'Unable to complete order',
      failedMessage: 'Something went wrong while placing this order.',
      invalidAmountMessage: 'Unable to place this order because the amount is invalid.',
      invalidQuantity: 'Selected quantity is not valid for this product.',
      fieldRequired: (label) => `${label} is required.`,
      placeholder: (label) => `Enter ${label}`,
    };
  }

  return {
    closeLabel: 'إغلاق',
    quickOrder: 'طلب سريع',
    unitPrice: 'سعر الوحدة',
    available: 'متوفر',
    unavailable: 'غير متوفر',
    orderFields: 'بيانات الطلب',
    orderFieldsHint: 'أدخل البيانات المطلوبة قبل تنفيذ عملية الشراء.',
    quantityTitle: 'الكمية',
    countTitle: 'العدد',
    min: 'الحد الأدنى',
    max: 'الحد الأقصى',
    step: 'الزيادة',
    total: 'الإجمالي',
    totalHint: 'يتحدث تلقائيًا حسب الكمية المختارة.',
    auto24Hint: 'هذا المنتج يعمل اوتوماتيكي 24ساعه',
    userIdLabel: 'ايدي مستخدم',
    buy: 'شراء',
    cancel: 'إلغاء',
    processing: 'جارٍ تنفيذ الطلب...',
    insufficientTitle: 'الرصيد غير كافٍ',
    insufficientMessage: (amount) => `تحتاج إلى ${amount} إضافية لإتمام الطلب.`,
    pendingTitle: 'الحساب غير متاح حاليًا',
    pendingMessage: 'لا يمكنك تنفيذ الطلبات بهذا الحساب حاليًا.',
    unavailableTitle: 'المنتج غير متاح',
    unavailableMessage: 'هذا المنتج غير متاح للشراء حاليًا.',
    preparingTitle: 'جارٍ تجهيز النافذة',
    preparingMessage: 'يتم تحميل تفاصيل السعر والعملة الآن...',
    successTitle: 'تم إرسال الطلب',
    successMessage: 'تم تنفيذ طلبك بنجاح وسيظهر في طلباتك مباشرة.',
    successDone: 'تمت العملية بنجاح',
    successViewOrder: 'تفاصيل الطلب',
    failedTitle: 'تعذر تنفيذ الطلب',
    failedMessage: 'حدث خطأ أثناء تنفيذ الطلب. حاول مرة أخرى.',
    invalidAmountMessage: 'لا يمكن تنفيذ الطلب لأن قيمة الشراء غير صالحة.',
    invalidQuantity: 'الكمية الحالية غير صالحة لهذا المنتج.',
    fieldRequired: (label) => `يرجى إدخال ${label}`,
    placeholder: (label) => `أدخل ${label}`,
  };
};

const resolveFieldLabel = (field, language = 'ar') => {
  return field?.label || field?.key || '';
};

const resolveFieldType = (field) => {
  const type = String(field?.type || 'text').trim().toLowerCase();
  if (['text', 'number', 'email', 'select'].includes(type)) return type;
  return 'text';
};

const isFieldRequired = (field) => field?.required !== false;

const resolveSelectOptions = (field) => {
  const source = Array.isArray(field?.options) ? field.options : [];
  return source
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return { value: String(option), label: String(option) };
      }
      if (option && typeof option === 'object') {
        const rawValue = option.value ?? option.id ?? option.key ?? option.label;
        if (rawValue === undefined || rawValue === null) return null;
        return {
          value: String(rawValue),
          label: String(option.label ?? option.name ?? rawValue),
        };
      }
      return null;
    })
    .filter((option) => option?.value);
};

const resolveProductId = (item) => String(item?.id || item?._id || '').trim();

const isManualPurchaseProduct = (item) => {
  const executionType = String(item?.executionType || '').trim().toLowerCase();
  const hasProviderLink = Boolean(String(item?.supplierId || item?.providerId || '').trim());

  if (executionType === 'manual') return true;
  if (executionType === 'automatic') return false;
  if (item?.autoFulfillmentEnabled === false) return true;
  if (item?.autoFulfillmentEnabled === true) return false;

  return !hasProviderLink;
};

const isProductExplicitlyInactive = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (item?.isActive === false) return true;

  const status = String(item?.status || '').trim().toLowerCase();
  return Boolean(status) && status !== 'active';
};

const resolvePurchaseState = (item, language, copy) => {
  if (isProductExplicitlyInactive(item)) {
    return {
      isVisible: true,
      isPurchasable: false,
      isDisabled: true,
      badge: 'unavailable',
      badgeLabel: copy.unavailable,
      badgeColor: 'danger',
      helperText: copy.unavailableMessage,
      reason: copy.unavailableTitle,
      scheduleStatus: null,
      isOutOfStock: false,
      isLowStock: false,
      inSchedule: true,
      isSalesEnabled: false,
    };
  }

  const status = getProductStatus(item, language);

  if (!isManualPurchaseProduct(item)) {
    return status;
  }

  if (status.isPurchasable) {
    return {
      ...status,
      isPurchasable: true,
      isDisabled: false,
      badgeLabel: copy.available,
      badgeColor: 'success',
      helperText: '',
      reason: '',
    };
  }

  return {
    ...status,
    isPurchasable: false,
    isDisabled: true,
    badgeLabel: copy.unavailable,
    badgeColor: status.badgeColor || 'danger',
    helperText: status.helperText || copy.unavailableMessage,
    reason: status.reason || copy.unavailableMessage,
  };
};

const statusToneStyles = {
  info: 'border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-white',
  warning: 'border-[color:rgb(var(--color-warning-rgb)/0.34)] bg-[color:rgb(var(--color-warning-rgb)/0.15)] text-white',
  danger: 'border-[color:rgb(var(--color-error-rgb)/0.34)] bg-[color:rgb(var(--color-error-rgb)/0.15)] text-white',
  success: 'border-[color:rgb(var(--color-success-rgb)/0.34)] bg-[color:rgb(var(--color-success-rgb)/0.16)] text-white',
};

const statusToneIcon = {
  info: LoaderCircle,
  warning: AlertCircle,
  danger: AlertCircle,
  success: CheckCircle2,
};

const ProductPurchaseSheet = ({ product, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const { addToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const addOrder = useOrderStore((state) => state.addOrder);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const currencies = useSystemStore((state) => state.currencies);
  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);

  const locale = language === 'en' ? 'en-US' : 'ar-EG';
  const isRTL = dir === 'rtl';
  const copy = useMemo(() => getCopy(language), [language]);

  const [isPreparing, setIsPreparing] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [quantityError, setQuantityError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusCard, setStatusCard] = useState({ tone: 'info', title: '', message: '' });
  const [successfulOrderId, setSuccessfulOrderId] = useState(null);
  const [successMeta, setSuccessMeta] = useState({ amount: '', identifier: '', orderNumber: '' });

  const orderFields = useMemo(
    () => resolveProductOrderFields(product, language),
    [language, product]
  );

  const quantityMeta = useMemo(
    () => getProductQuantityMeta(product),
    [product]
  );

  const productTitle = useMemo(() => {
    if (language === 'en') return product?.name || product?.nameAr || '';
    return product?.nameAr || product?.name || '';
  }, [language, product]);

  const productSubtitle = useMemo(() => {
    if (language === 'en' && product?.nameAr && product?.nameAr !== productTitle) return product.nameAr;
    if (language !== 'en' && product?.name && product?.name !== productTitle) return product.name;
    if (product?.externalProductId) return product.externalProductId;
    if (product?.sku) return product.sku;
    return '';
  }, [language, product, productTitle]);

  const productDescription = useMemo(() => {
    if (language === 'en') return String(product?.description || product?.descriptionAr || '').trim();
    return String(product?.descriptionAr || product?.description || '').trim();
  }, [language, product?.description, product?.descriptionAr]);

  const isAutoSupplierProduct = useMemo(() => {
    const supplierId = String(product?.supplierId || product?.providerId || '').trim();
    const supplierProductId = String(product?.providerProductId || product?.externalProductId || '').trim();
    const isLinked = Boolean(supplierId && supplierProductId);
    const isAuto = product?.autoFulfillmentEnabled !== false;
    return isLinked && isAuto;
  }, [product?.autoFulfillmentEnabled, product?.externalProductId, product?.providerId, product?.providerProductId, product?.supplierId]);

  useEffect(() => {
    if (!product) return;

    const nextFields = {};
    orderFields.forEach((field) => {
      nextFields[field.key] = '';
    });

    setFieldValues(nextFields);
    setFieldErrors({});
    setQuantity(quantityMeta.minQty);
    setQuantityInput(String(quantityMeta.minQty));
    setQuantityError('');
    setIsSubmitting(false);
    setStatusCard({ tone: 'info', title: '', message: '' });
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
  }, [orderFields, product?.id, quantityMeta.minQty]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let active = true;
    if (!isOpen) return undefined;

    if (Array.isArray(currencies) && currencies.length > 0) {
      setIsPreparing(false);
      return () => {
        active = false;
      };
    }

    setIsPreparing(true);
    Promise.resolve(loadCurrencies())
      .finally(() => {
        if (active) setIsPreparing(false);
      });

    return () => {
      active = false;
    };
  }, [currencies, isOpen, loadCurrencies]);

  const userCurrencyCode = String(user?.currency || 'USD').toUpperCase();
  const pricingGroup = user?.groupId || user?.group || 'Normal';
  const pricingGroupPercentage = user?.groupPercentage ?? null;
  const pricingSnapshot = useMemo(() => {
    if (!product) {
      return { unitPriceBase: 0, unitPrice: 0 };
    }

    return {
      unitPriceBase: calculateProductPrice(product, pricingGroup, pricingGroupPercentage),
      unitPrice: resolveProductUnitPrice(product, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage),
    };
  }, [currencies, groupsLastLoadedAt, pricingGroup, pricingGroupPercentage, product, userCurrencyCode]);

  if (!isOpen || !product) return null;

  const productState = resolvePurchaseState(product, language, copy);
  const isApproved = isApprovedAccountStatus(user?.status);
  const userCurrency = getCurrencyMeta(userCurrencyCode, currencies);
  const unitPriceBase = pricingSnapshot.unitPriceBase;
  const unitPrice = pricingSnapshot.unitPrice;
  const totalPrice = normalizeMoneyAmount(unitPrice * quantity);
  const hasValidAmount = Number.isFinite(totalPrice) && totalPrice > 0;
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const creditLimit = normalizeMoneyAmount(Math.max(0, Number(user?.creditLimit || 0)));
  const spendableBalance = normalizeMoneyAmount(balance + creditLimit);
  const canAfford = spendableBalance >= totalPrice;

  const unitPriceNumber = Number(unitPrice);
  const formattedUnitPrice = Number.isFinite(unitPriceNumber)
    ? formatCurrencyAmount(unitPriceNumber, userCurrencyCode, currencies, locale, {
      maximumFractionDigits: 5,
      minimumFractionDigits: 0,
    })
    : formatCurrencyAmount(unitPrice, userCurrencyCode, currencies, locale);
  const formattedTotalPrice = formatCurrencyAmount(totalPrice, userCurrencyCode, currencies, locale, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
  const missingAmount = formatCurrencyAmount(Math.max(0, totalPrice - spendableBalance), userCurrencyCode, currencies, locale);

  const hasQuantityInput = String(quantityInput ?? '').trim().length > 0;
  const selectedQuantityIsValid = (
    hasQuantityInput
    && !quantityError
    && quantity === clampProductQuantity(quantity, product)
  );
  const canSubmit = (
    productState.isPurchasable
    && isApproved
    && canAfford
    && hasValidAmount
    && selectedQuantityIsValid
    && !isPreparing
    && !isSubmitting
    && statusCard.tone !== 'success'
  );

  const availabilityLabel = productState.isPurchasable
    ? (productState.badgeLabel || copy.available)
    : (productState.badgeLabel || copy.unavailable);

  const availabilityVariant = productState.isPurchasable ? 'success' : (productState.badgeColor || 'warning');
  const StatusIcon = statusToneIcon[statusCard.tone] || AlertCircle;

  const handleClose = () => {
    if (isSubmitting) return;
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
  };

  const handleSuccessDismiss = () => {
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
  };

  const handleOpenOrderDetails = () => {
    const orderId = String(successfulOrderId || '').trim();
    if (!orderId) {
      handleSuccessDismiss();
      return;
    }

    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
    navigate(`/orders?orderId=${encodeURIComponent(orderId)}`);
  };

  const handleCopyOrderNumber = async () => {
    const orderNumber = String(successMeta.orderNumber || successfulOrderId || '').trim();
    if (!orderNumber) return;

    try {
      await navigator.clipboard.writeText(orderNumber);
      addToast(language === 'en' ? 'Order number copied' : 'تم نسخ رقم الطلب', 'success');
    } catch (_error) {
      addToast(language === 'en' ? 'Unable to copy order number' : 'تعذر نسخ رقم الطلب', 'error');
    }
  };

  const handleFieldChange = (fieldKey, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldKey]: sanitizeOrderFieldValue(value),
    }));

    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const applyQuantity = (rawValue) => {
    const raw = String(rawValue ?? '');
    setQuantityInput(raw);

    const trimmed = raw.trim();
    if (!trimmed) {
      setQuantityError('');
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    const normalized = clampProductQuantity(numeric, product);
    if (normalized !== numeric) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    setQuantity(numeric);
    setQuantityError('');
  };

  const handleQuantityBlur = () => {
    const trimmed = String(quantityInput ?? '').trim();
    if (!trimmed) {
      setQuantityInput(String(quantity));
      setQuantityError('');
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      setQuantityInput(String(quantity));
      setQuantityError('');
      return;
    }

    const normalized = clampProductQuantity(numeric, product);
    setQuantity(normalized);
    setQuantityInput(String(normalized));
    setQuantityError(normalized !== numeric ? copy.invalidQuantity : '');
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    orderFields.forEach((field) => {
      const label = resolveFieldLabel(field, language);
      if (isFieldRequired(field) && !String(fieldValues[field.key] || '').trim()) {
        nextErrors[field.key] = copy.fieldRequired(label);
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!selectedQuantityIsValid) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    if (!productState.isPurchasable) {
      const message = productState.helperText || copy.unavailableMessage;
      setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
      addToast(message, 'warning');
      return;
    }

    if (!isApproved) {
      setStatusCard({ tone: 'warning', title: copy.pendingTitle, message: copy.pendingMessage });
      addToast(copy.pendingMessage, 'warning');
      return;
    }

    if (!canAfford) {
      const message = copy.insufficientMessage(missingAmount);
      setStatusCard({ tone: 'danger', title: copy.insufficientTitle, message });
      addToast(copy.insufficientTitle, 'error');
      return;
    }

    if (!hasValidAmount) {
      addToast(copy.invalidAmountMessage, 'error');
      return;
    }

    setIsSubmitting(true);
    setStatusCard({ tone: 'info', title: copy.preparingTitle, message: copy.preparingMessage });

    try {
      const freshCatalog = await loadProducts({ force: true }).catch(() => null);
      const selectedProductId = resolveProductId(product);
      const freshProduct = (freshCatalog?.products || []).find((item) => resolveProductId(item) === selectedProductId) || null;

      if (!freshProduct) {
        const message = language === 'en'
          ? 'This product is no longer available. The catalog has been refreshed.'
          : 'هذا المنتج لم يعد متاحًا. تم تحديث المنتجات من السيرفر.';
        setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
        addToast(message, 'warning');
        return;
      }

      const freshProductState = resolvePurchaseState(freshProduct, language, copy);
      if (!freshProductState.isPurchasable) {
        const message = freshProductState.helperText || copy.unavailableMessage;
        setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
        addToast(message, 'warning');
        return;
      }

      const freshUnitPriceBase = calculateProductPrice(freshProduct, pricingGroup, pricingGroupPercentage);
      const freshUnitPrice = resolveProductUnitPrice(freshProduct, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage);
      const freshTotalPrice = normalizeMoneyAmount(freshUnitPrice * quantity);

      if (freshTotalPrice !== totalPrice) {
        const message = language === 'en'
          ? 'The product price has changed. Review the updated price before buying.'
          : 'سعر المنتج اتغير. راجع السعر الجديد قبل تنفيذ الطلب.';
        setStatusCard({ tone: 'warning', title: language === 'en' ? 'Price updated' : 'تم تحديث السعر', message });
        addToast(message, 'warning');
        return;
      }

      const normalizedFields = Object.fromEntries(
        orderFields.map((field) => [
          field.key,
          sanitizeOrderFieldValue(fieldValues[field.key]).trim(),
        ])
      );

      const firstCustomInputValue = Object.values(normalizedFields)
        .map((value) => String(value || '').trim())
        .find(Boolean) || '';
      const userIdentifier = String(
        normalizedFields.playerId
        || normalizedFields.uid
        || normalizedFields.email
        || normalizedFields.phone
        || normalizedFields.username
        || firstCustomInputValue
        || ''
      ).trim();
      const dynamicFieldSnapshot = Array.isArray(freshProduct?.dynamicFields) && freshProduct.dynamicFields.length > 0
        ? freshProduct.dynamicFields.map((field) => ({ ...field }))
        : null;
      const fieldsSnapshot = Array.isArray(freshProduct?.orderFields) && freshProduct.orderFields.length > 0
        ? freshProduct.orderFields.map((field) => ({ ...field }))
        : (dynamicFieldSnapshot || orderFields.map((field) => ({
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
        })));
      const freshQuantityMeta = getProductQuantityMeta(freshProduct);

      const createResult = await addOrder({
        id: `ord-${Date.now()}`,
        userId: user.id,
        productId: freshProduct.id,
        productName: freshProduct.name,
        productNameAr: freshProduct.nameAr,
        quantity,
        unitPrice: freshUnitPrice,
        unitPriceBase: freshUnitPriceBase,
        priceCoins: freshTotalPrice,
        currencyCode: userCurrencyCode,
        exchangeRateAtExecution: userCurrency.rate,
        playerId: userIdentifier,
        customInputs: normalizedFields,
        orderFields: normalizedFields,
        orderFieldsValues: normalizedFields,
        customerInput: {
          values: normalizedFields,
          fieldsSnapshot,
          quantitySnapshot: freshQuantityMeta,
        },
        quantitySnapshot: freshQuantityMeta,
        status: 'pending',
        createdAt: new Date().toISOString(),
        idempotencyKey: `${user.id}-${product.id}-${userIdentifier}-${Date.now()}`,
      });

      const nextBalance = Number(createResult?.updatedBalance);
      if (Number.isFinite(nextBalance)) {
        updateUserSession({ coins: normalizeMoneyAmount(nextBalance) });
      } else {
        updateUserSession({ coins: normalizeMoneyAmount(balance - totalPrice) });
      }

      const createdOrder = createResult?.order || createResult || {};
      const createdOrderId = String(createdOrder?.id || createdOrder?.orderId || '').trim();
      const createdOrderNumber = String(
        createdOrder?.siteOrderNumber
        || createdOrder?.orderNumber
        || createdOrder?.id
        || createdOrderId
      ).trim();
      setSuccessfulOrderId(createdOrderId || `ord-${Date.now()}`);
      setSuccessMeta({
        amount: formattedTotalPrice,
        identifier: userIdentifier,
        orderNumber: createdOrderNumber,
      });
      setStatusCard({ tone: 'success', title: copy.successTitle, message: copy.successMessage });
      addToast(copy.successMessage, 'success');
    } catch (error) {
      if (String(error?.code || '').toUpperCase() === 'PROVIDER_PRICE_INCREASED') {
        const priceMsg = language === 'en'
          ? 'The price for this service has been updated by the provider. Please refresh and review the new price.'
          : 'عفواً، تم تحديث سعر هذه الخدمة من المصدر. برجاء تحديث الصفحة لرؤية السعر الجديد.';
        setStatusCard({ tone: 'warning', title: language === 'en' ? 'Price Updated' : 'تم تحديث السعر', message: priceMsg });
        addToast(priceMsg, 'warning');
      } else {
        const message = '\u062a\u0639\u0630\u0631 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0637\u0644\u0628 \u0627\u062a\u0635\u0644 \u0628\u0627\u0644\u0645\u0633\u0624\u0648\u0644';
        if (String(error?.code || '').toUpperCase() !== 'INVALID_ORDER_AMOUNT') {
          devLogger.warnUnlessBenign('Order submit error:', error);
        }
        setStatusCard({ tone: 'danger', title: copy.failedTitle, message });
        addToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            className="absolute inset-0 w-full bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-label={copy.closeLabel}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={productTitle}
              initial={{ opacity: 0, y: 40, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.99 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex max-h-[min(94vh,56rem)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[1.6rem] border border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-surface-rgb)/0.56))] text-[var(--color-text)] shadow-[var(--shadow-medium),var(--shadow-gold),0_0_24px_rgba(255,214,102,0.32)] ring-1 ring-[color:rgb(var(--color-primary-rgb)/0.56)] sm:rounded-[2rem]"
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.64)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] text-[var(--color-text-secondary)] transition hover:bg-[color:rgb(var(--color-surface-rgb)/0.72)] disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                aria-label={copy.closeLabel}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <header className="space-y-1.5 border-b border-[color:rgb(var(--color-border-rgb)/0.52)] px-2.5 pb-2 pt-2 sm:space-y-3 sm:px-4 sm:pb-3 sm:pt-3">
                <div className="flex flex-wrap items-start justify-start gap-1.5 [direction:ltr] sm:gap-2">
                  <div className="rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] px-2 py-1 shadow-[0_10px_24px_-18px_rgb(var(--color-primary-rgb)/0.24)] sm:rounded-2xl sm:px-3 sm:py-2">
                    <p className="text-[10px] font-semibold text-[color:rgb(var(--color-primary-rgb)/0.68)] sm:text-[11px]">{copy.unitPrice}</p>
                    <p className="mt-0.5 text-[13px] font-bold tracking-tight text-[color:rgb(var(--color-primary-rgb)/0.92)] sm:mt-1 sm:text-base">{formattedUnitPrice}</p>
                  </div>
                  <Badge variant={availabilityVariant} className="px-1.5 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[11px]">{availabilityLabel}</Badge>
                </div>

                <div className={cn('flex items-center gap-2 sm:gap-3', isRTL ? 'flex-row-reverse text-right' : 'text-left')}>
                  {product?.image ? (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.56)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] sm:h-16 sm:w-16 sm:rounded-2xl">
                      <img
                        src={resolveImageUrl(product.image)}
                        alt={productTitle}
                        loading="eager"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.56)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] sm:h-16 sm:w-16 sm:rounded-2xl">
                      <Package2 className="h-4 w-4 text-[color:rgb(var(--color-primary-rgb)/0.84)] sm:h-6 sm:w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <img
                      src={coinsImage}
                      alt="عملات"
                      loading="eager"
                      decoding="async"
                      className="mx-auto mb-1.5 h-20 w-auto scale-[1.45] object-contain sm:h-24"
                    />
                    <h2 className="line-clamp-2 text-base font-bold leading-5 tracking-[-0.02em] text-[var(--color-text)] sm:text-2xl sm:leading-8">
                      {productTitle}
                    </h2>
                    {productSubtitle ? (
                      <p className="mt-0.5 truncate text-[11px] text-[color:rgb(var(--color-text-rgb)/0.65)] sm:mt-1 sm:text-sm">
                        {productSubtitle}
                      </p>
                    ) : null}
                    {productDescription ? (
                      <p className="mt-2 line-clamp-3 max-w-[30rem] text-[11px] leading-5 text-[color:rgb(var(--color-text-rgb)/0.78)] sm:text-sm">
                        {productDescription}
                      </p>
                    ) : null}
                  </div>
                </div>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5 sm:space-y-3 sm:px-4 sm:py-3">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-2">
                    <Input
                      label={copy.quantityTitle}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantityInput}
                      onChange={(event) => applyQuantity(event.target.value)}
                      onBlur={handleQuantityBlur}
                      disabled={isSubmitting}
                      placeholder={language === 'en' ? 'Enter quantity' : 'اكتب الكمية'}
                      className="h-9 rounded-md border-white/15 bg-white/8 text-xs text-white placeholder:text-white/45 focus:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-lg sm:text-[13px]"
                    />

                    <p className="text-[11px] font-medium text-[color:rgb(var(--color-text-rgb)/0.65)]">
                      {copy.min} {quantityMeta.minQty} • {copy.max} {quantityMeta.maxQty}
                    </p>

                    {quantityError ? (
                      <p className="text-[11px] font-medium text-[#ffb4b4]">{quantityError}</p>
                    ) : null}
                  </div>

                  <Input
                    label={copy.total}
                    type="text"
                    value={formattedTotalPrice}
                    readOnly
                    disabled
                    className="h-9 rounded-md border-white/15 bg-white/8 text-xs text-white placeholder:text-white/45 focus:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-lg sm:text-[13px]"
                  />

                  {orderFields.length > 0 ? (
                    <section className="col-span-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.48)] bg-[color:rgb(var(--color-surface-rgb)/0.32)] p-2.5 sm:rounded-2xl sm:p-3">
                      <div className="space-y-2">
                        {orderFields.map((field) => {
                          const label = resolveFieldLabel(field, language);
                          const fieldType = resolveFieldType(field);
                          const options = resolveSelectOptions(field);
                          const fallbackAsInput = fieldType === 'select' && options.length === 0;

                          if (fieldType === 'select' && !fallbackAsInput) {
                            return (
                              <div key={field.key}>
                                <label className="mb-1.5 block text-xs font-medium text-white/80 sm:text-sm">
                                  {label}
                                  {isFieldRequired(field) ? ' *' : ''}
                                </label>
                                <select
                                  value={fieldValues[field.key] || ''}
                                  onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                  disabled={isSubmitting || statusCard.tone === 'success'}
                                  className="h-9 w-full rounded-md border border-white/15 bg-white/8 px-3 text-xs text-white outline-none transition-colors focus:border-[#d4af37]/45 focus:bg-white/12 sm:h-10 sm:rounded-lg sm:text-[13px]"
                                >
                                  <option value="" className="bg-[rgb(var(--color-card-rgb))] text-white/80">
                                    {field.placeholder || copy.placeholder(label)}
                                  </option>
                                  {options.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-[rgb(var(--color-card-rgb))] text-white">
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {fieldErrors[field.key] ? (
                                  <p className="mt-1 text-xs text-[#ffb4b4]">{fieldErrors[field.key]}</p>
                                ) : null}
                              </div>
                            );
                          }

                          return (
                            <Input
                              key={field.key}
                              label={`${label}${isFieldRequired(field) ? ' *' : ''}`}
                              type={fieldType === 'number' ? 'number' : fieldType === 'email' ? 'email' : 'text'}
                              inputMode={fieldType === 'number' ? 'decimal' : undefined}
                              value={fieldValues[field.key] || ''}
                              onChange={(event) => handleFieldChange(field.key, event.target.value)}
                              error={fieldErrors[field.key]}
                              placeholder={field.placeholder || copy.placeholder(label)}
                              autoComplete="off"
                              spellCheck={false}
                              disabled={isSubmitting || statusCard.tone === 'success'}
                              className="h-9 rounded-md border-white/15 bg-white/8 text-xs text-white placeholder:text-white/45 focus:border-[#d4af37]/45 focus:bg-white/12 sm:h-10 sm:rounded-lg sm:text-[13px]"
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                </div>

                {!canAfford && isApproved && productState.isPurchasable ? (
                  <div className="rounded-xl border border-[color:rgb(var(--color-error-rgb)/0.38)] bg-[color:rgb(var(--color-error-rgb)/0.14)] p-2.5 sm:rounded-2xl sm:p-3">
                    <p className="text-[11px] font-semibold text-white sm:text-xs">{copy.insufficientTitle}</p>
                    <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{copy.insufficientMessage(missingAmount)}</p>
                  </div>
                ) : null}

                {!isApproved ? (
                  <div className="rounded-xl border border-[color:rgb(var(--color-warning-rgb)/0.36)] bg-[color:rgb(var(--color-warning-rgb)/0.14)] p-2.5 sm:rounded-2xl sm:p-3">
                    <p className="text-[11px] font-semibold text-white sm:text-xs">{copy.pendingTitle}</p>
                    <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{copy.pendingMessage}</p>
                  </div>
                ) : null}

                {!productState.isPurchasable ? (
                  <div className="rounded-xl border border-[color:rgb(var(--color-warning-rgb)/0.36)] bg-[color:rgb(var(--color-warning-rgb)/0.14)] p-2.5 sm:rounded-2xl sm:p-3">
                    <p className="text-[11px] font-semibold text-white sm:text-xs">{copy.unavailableTitle}</p>
                    <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{productState.helperText || copy.unavailableMessage}</p>
                  </div>
                ) : null}

              </div>

              <footer className="border-t border-[color:rgb(var(--color-border-rgb)/0.52)] bg-[color:rgb(var(--color-surface-rgb)/0.88)] px-2.5 py-2.5 sm:px-4 sm:py-3">
                {statusCard.message && !successfulOrderId ? (
                  <div className={`mb-2 flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] sm:mb-2.5 sm:gap-2.5 sm:rounded-xl sm:py-2 sm:text-xs ${statusToneStyles[statusCard.tone] || statusToneStyles.info}`}>
                    <StatusIcon className={cn('mt-0.5 h-4 w-4 shrink-0', statusCard.tone === 'info' && isSubmitting && 'animate-spin')} />
                    <div>
                      {statusCard.title ? <p className="font-semibold">{statusCard.title}</p> : null}
                      <p className="mt-0.5 text-[11px] leading-4 text-white/90 sm:text-xs sm:leading-5">{statusCard.message}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="h-9 rounded-md border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-card-rgb)/0.72)] text-[var(--color-text)] hover:border-[color:rgb(var(--color-primary-rgb)/0.42)] hover:bg-[color:rgb(var(--color-surface-rgb)/0.94)] sm:h-10 sm:rounded-lg"
                  >
                    {copy.cancel}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="h-9 rounded-md border-[color:rgb(var(--color-primary-rgb)/0.62)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.9),rgb(var(--color-primary-rgb)/0.72))] text-[var(--color-button-text)] shadow-[0_20px_46px_-26px_rgb(var(--color-primary-rgb)/0.6)] hover:brightness-[1.04] sm:h-10 sm:rounded-lg"
                  >
                    {isSubmitting ? copy.processing : copy.buy}
                  </Button>
                </div>

                {isAutoSupplierProduct ? (
                  <p className="mt-2 text-center text-[11px] font-medium text-[color:rgb(var(--color-text-rgb)/0.65)] sm:text-xs">
                    {copy.auto24Hint}
                  </p>
                ) : null}

                <div className="mt-2 flex justify-center">
                  <Badge variant="premium" className="gap-1 px-2 py-1 text-[9px] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    <Zap className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                    {copy.quickOrder}
                  </Badge>
                </div>
              </footer>
            </motion.section>
          </div>

          <AnimatePresence>
            {successfulOrderId ? (
              <div className="absolute inset-0 z-[90] flex items-center justify-center p-4">
                <motion.button
                  type="button"
                  className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleSuccessDismiss}
                  aria-label={copy.closeLabel}
                />

                <motion.section
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0, scale: 0.94, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 14 }}
                  className="relative z-10 w-full max-w-sm rounded-[1.6rem] border border-emerald-400/24 bg-[linear-gradient(180deg,rgba(9,20,18,0.98),rgba(7,14,13,0.98))] p-5 text-white shadow-[0_28px_80px_-36px_rgba(16,185,129,0.55)]"
                >
                  <button
                    type="button"
                    onClick={handleSuccessDismiss}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/80 transition hover:bg-white/12"
                    aria-label={copy.closeLabel}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/14 text-emerald-400 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.72)]">
                      <CheckCircle2 className="h-11 w-11" />
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-white">{copy.successDone}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{copy.successMessage}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-start">
                        <p className="text-[10px] font-semibold text-white/45">
                          {language === 'en' ? 'Amount' : 'المبلغ'}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-emerald-300">{successMeta.amount || formattedTotalPrice}</p>
                      </div>

                      <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-start">
                        <p className="text-[10px] font-semibold text-white/45">
                          {language === 'en' ? 'User ID' : 'معرف المستخدم'}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-semibold text-white/85" dir="ltr">
                          {successMeta.identifier || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-start">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-white/45">
                            {language === 'en' ? 'Order No.' : 'رقم الطلب'}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] font-semibold text-white/85" dir="ltr">
                            {successMeta.orderNumber || successfulOrderId || '-'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyOrderNumber}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                          aria-label={language === 'en' ? 'Copy order number' : 'نسخ رقم الطلب'}
                          title={language === 'en' ? 'Copy order number' : 'نسخ رقم الطلب'}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSuccessDismiss}
                      className="h-11 rounded-[0.95rem] border-white/14 bg-white/6 text-white hover:bg-white/10"
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleOpenOrderDetails}
                      className="h-11 rounded-[0.95rem] bg-[linear-gradient(135deg,#10b981,#22c55e)] text-white shadow-[0_20px_32px_-24px_rgba(34,197,94,0.8)] hover:brightness-[1.04]"
                    >
                      {copy.successViewOrder}
                    </Button>
                  </div>
                </motion.section>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default ProductPurchaseSheet;
