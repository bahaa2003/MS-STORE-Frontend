import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Check, ChevronDown, Edit, FolderTree, Image as ImageIcon, Info, Layers3, Package, Plus, Power, RefreshCw, Search, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import { uploadImage } from '../../services/realApi';
import useMediaStore from '../../store/useMediaStore';
import apiClient from '../../services/client';
import useAuthStore from '../../store/useAuthStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/account/ConfirmDialog';
import Input, { inputBaseClassName, selectClassName } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { formatNumber } from '../../utils/intl';
import { validateProductForm } from '../../utils/productStatus';

const getProviderProductSearchToken = (product) =>
    `${product?.name || ''} ${getProviderProductPriceValue(product) || ''}`.toLowerCase();

const getProviderProductPriceValue = (product) => (
    product?.rawPrice
    ?? product?.priceCoins
    ?? product?.basePriceCoins
    ?? product?.supplierPrice
    ?? ''
);

const getProviderProductMinQtyValue = (product) => (
    product?.minQty
    ?? product?.minimumOrderQty
    ?? product?.min
    ?? product?.minimumQty
    ?? ''
);

const getProviderProductMaxQtyValue = (product) => (
    product?.maxQty
    ?? product?.maximumOrderQty
    ?? product?.max
    ?? product?.maximumQty
    ?? ''
);

const getProviderProductIdentifiers = (product) => Array.from(new Set(
    [
        product?.id,
        product?.providerProductId,
        product?.externalProductId,
    ]
));
const hasMatchingProviderProduct = (product, ...selectedValues) => {
    const identifiers = getProviderProductIdentifiers(product);
    if (!identifiers.length) return false;

    return selectedValues
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .some((value) => identifiers.includes(value));
};

const normalizePriceInput = (value) => {
    const raw = String(value ?? '').trim().replace(/,/g, '.');
    if (!raw) return '';

    const sign = raw.startsWith('-') ? '-' : '';
    const unsigned = sign ? raw.slice(1) : raw;
    const [integerPartRaw = '0', ...fractionParts] = unsigned.split('.');
    const integerDigits = integerPartRaw.replace(/[^\d]/g, '') || '0';
    const fractionDigits = fractionParts.join('').replace(/[^\d]/g, '');
    return fractionDigits ? `${sign}${integerDigits}.${fractionDigits}` : `${sign}${integerDigits}`;
};

const formatExactDecimal = (value, language) => {
    const normalized = normalizePriceInput(value);
    if (!normalized) return '';

    const negative = normalized.startsWith('-');
    const unsigned = negative ? normalized.slice(1) : normalized;
    const [integerPart = '0', fractionPart = ''] = unsigned.split('.');
    const formattedInteger = formatNumber(Number(integerPart || 0), language === 'en' ? 'en-US' : 'ar-EG', {
        maximumFractionDigits: 0,
    });

    return `${negative ? '-' : ''}${formattedInteger}${fractionPart ? `.${fractionPart}` : ''}`;
};

const countFractionDigits = (value) => {
    const normalized = normalizePriceInput(value);
    if (!normalized.includes('.')) return 0;
    return normalized.split('.')[1]?.length || 0;
};

/**
 * String-based decimal addition — preserves arbitrary precision.
 * Avoids Number() which truncates 50dp prices to ~17 significant digits.
 */
const addPriceValues = (baseValue, deltaValue) => {
    const a = normalizePriceInput(baseValue) || '0';
    const b = normalizePriceInput(deltaValue) || '0';

    const aNeg = a.startsWith('-');
    const bNeg = b.startsWith('-');
    const aAbs = aNeg ? a.slice(1) : a;
    const bAbs = bNeg ? b.slice(1) : b;

    const [aInt = '0', aFrac = ''] = aAbs.split('.');
    const [bInt = '0', bFrac = ''] = bAbs.split('.');

    const maxFrac = Math.max(aFrac.length, bFrac.length);
    const aPadded = aInt + aFrac.padEnd(maxFrac, '0');
    const bPadded = bInt + bFrac.padEnd(maxFrac, '0');

    const maxLen = Math.max(aPadded.length, bPadded.length);
    const aDigits = aPadded.padStart(maxLen, '0');
    const bDigits = bPadded.padStart(maxLen, '0');

    const insertDecimal = (raw) => {
        if (maxFrac <= 0) return raw;
        const intP = raw.slice(0, raw.length - maxFrac) || '0';
        const fracP = raw.slice(raw.length - maxFrac);
        let combined = `${intP}.${fracP}`;
        combined = combined.replace(/0+$/, '').replace(/\.$/, '');
        return combined;
    };

    if (aNeg === bNeg) {
        let carry = 0;
        const digits = [];
        for (let i = maxLen - 1; i >= 0; i--) {
            const s = Number(aDigits[i]) + Number(bDigits[i]) + carry;
            digits.unshift(s % 10);
            carry = Math.floor(s / 10);
        }
        if (carry) digits.unshift(carry);
        const str = insertDecimal(digits.join(''));
        return (aNeg && str !== '0' ? '-' : '') + str;
    }

    // Different signs: subtract smaller from larger
    let larger, smaller, resultNeg;
    if (aDigits.length !== bDigits.length ? aDigits.length > bDigits.length : aDigits >= bDigits) {
        larger = aDigits; smaller = bDigits; resultNeg = aNeg;
    } else {
        larger = bDigits; smaller = aDigits; resultNeg = bNeg;
    }

    let borrow = 0;
    const digits = [];
    for (let i = maxLen - 1; i >= 0; i--) {
        let d = Number(larger[i]) - Number(smaller[i]) - borrow;
        if (d < 0) { d += 10; borrow = 1; } else { borrow = 0; }
        digits.unshift(d);
    }

    let raw = digits.join('').replace(/^0+/, '') || '0';
    if (maxFrac > 0) raw = raw.padStart(maxFrac + 1, '0');
    const str = insertDecimal(raw);
    return (resultNeg && str !== '0' ? '-' : '') + str;
};

const parsePositiveQuantity = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildProviderSyncSnapshot = (product, options = {}) => {
    const fallbackMinQty = parsePositiveQuantity(options.fallbackMinQty, 1);
    const fallbackMaxQty = parsePositiveQuantity(options.fallbackMaxQty, Math.max(999, fallbackMinQty));
    const syncedProviderBasePrice = normalizePriceInput(options.rawPrice ?? getProviderProductPriceValue(product));
    const manualPriceAdjustment = normalizePriceInput(options.manualPriceAdjustment ?? '');
    const minimumOrderQty = parsePositiveQuantity(options.minQty ?? getProviderProductMinQtyValue(product), fallbackMinQty);
    const maximumOrderQty = Math.max(
        parsePositiveQuantity(options.maxQty ?? getProviderProductMaxQtyValue(product), fallbackMaxQty),
        minimumOrderQty
    );
    const basePriceCoins = syncedProviderBasePrice
        ? (options.enableManualPrice ? addPriceValues(syncedProviderBasePrice, manualPriceAdjustment) : syncedProviderBasePrice)
        : '';

    return {
        syncedProviderBasePrice,
        basePriceCoins,
        minimumOrderQty,
        maximumOrderQty,
        minQty: minimumOrderQty,
        maxQty: maximumOrderQty,
    };
};

const mergeProviderSyncIntoForm = (prev, supplierId, providerProductId, snapshot) => {
    const currentSupplierId = String(prev.supplierId || prev.providerId || '').trim();
    const currentProviderProductId = String(prev.providerProductId || prev.externalProductId || '').trim();

    if (
        currentSupplierId !== String(supplierId || '').trim()
        || currentProviderProductId !== String(providerProductId || '').trim()
    ) {
        return prev;
    }

    return { ...prev, ...snapshot };
};

const usesProviderPricingMode = (value) => ['use_supplier_price', 'supplier_price_plus_margin'].includes(String(value || '').trim());

const formatProviderProductPrice = (value, language) => {
    const normalized = normalizePriceInput(value);
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
        return '';
    }

    const formatted = formatExactDecimal(normalized, language);
    return language === 'en' ? `$${formatted} USD` : `${formatted} دولار`;
};

const DYNAMIC_FIELD_TYPES = ['text', 'number', 'email', 'select'];

const normalizeDynamicFieldType = (value) => {
    const normalized = String(value || 'text').trim().toLowerCase();
    return DYNAMIC_FIELD_TYPES.includes(normalized) ? normalized : 'text';
};

const createDynamicFieldRow = (seed = {}) => {
    const rowId = String(seed.id || `dynamic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    return {
        id: rowId,
        name: String(seed.name || seed.key || '').trim(),
        label: String(seed.label || seed.labelAr || '').trim(),
        type: normalizeDynamicFieldType(seed.type),
        required: seed.required !== false,
    };
};

const extractDynamicFieldRows = (product = {}) => {
    const dynamicFields = Array.isArray(product?.dynamicFields) ? product.dynamicFields : [];
    if (dynamicFields.length > 0) {
        return dynamicFields.map((field, index) => createDynamicFieldRow({
            id: field?.name || field?.key || `dynamic-${index + 1}`,
            name: field?.name || field?.key || '',
            label: field?.label || field?.labelAr || field?.name || '',
            type: field?.type,
            required: field?.required,
        }));
    }

    const legacyFields = Array.isArray(product?.orderFields) ? product.orderFields : [];
    return legacyFields
        .filter((field) => field?.enabled !== false)
        .map((field, index) => createDynamicFieldRow({
            id: field?.id || field?.name || field?.key || `dynamic-${index + 1}`,
            name: field?.name || field?.key || field?.id || '',
            label: field?.labelAr || field?.label || field?.name || field?.key || '',
            type: field?.type || 'text',
            required: field?.required,
        }))
        .filter((field) => field.name && field.label);
};

const buildDynamicFieldsPayload = (fieldRows = []) => (
    Array.isArray(fieldRows) ? fieldRows : []
).map((row) => {
    const safeName = String(row?.name || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
    const label = String(row?.label || '').trim();
    return {
        name: safeName,
        label,
        type: normalizeDynamicFieldType(row?.type),
        required: row?.required !== false,
    };
}).filter((field) => field.name && field.label);

const buildOrderFieldsPayloadFromDynamic = (dynamicFields = []) => (
    Array.isArray(dynamicFields) ? dynamicFields : []
).map((field) => ({
    key: field.name,
    name: field.name,
    id: field.name,
    label: field.label,
    labelAr: field.label,
    placeholder: '',
    placeholderAr: '',
    enabled: true,
    required: field.required !== false,
    type: normalizeDynamicFieldType(field.type),
}));

const AdminProducts = () => {
    const {
        products,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        toggleProductStatus,
        deleteProduct,
        loadProducts,
    } = useMediaStore();
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const { t, language } = useLanguage();
    const isEnglish = language === 'en';

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [productModalStep, setProductModalStep] = useState(1);
    const [togglingProductId, setTogglingProductId] = useState(null);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');
    const [productConnectionFilter, setProductConnectionFilter] = useState('all');
    const [isPrimaryCategoriesOpen, setIsPrimaryCategoriesOpen] = useState(false);
    const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        sortOrder: 0,
        image: '',
        parentCategory: '',
    });
    const [providers, setProviders] = useState([]);
    const [providerProducts, setProviderProducts] = useState([]);
    const [providerProductQuery, setProviderProductQuery] = useState('');
    const [isSyncingPrice, setIsSyncingPrice] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        nameAr: '',
        description: '',
        category: '',
        connectionType: 'auto',
        providerId: '',
        providerProductId: '',
        supplierId: '',
        externalProductId: '',
        externalProductName: '',
        autoFulfillmentEnabled: true,
        externalPricingMode: 'use_local_price',
        supplierMarginType: 'fixed',
        supplierMarginValue: 0,
        supplierFieldMappingsText: 'playerId:uid\nquantity:qty',
        syncPriceWithProvider: false,
        enableManualPrice: false,
        manualPriceAdjustment: '',
        syncedProviderBasePrice: '',
        costPrice: '',
        originalPriceCoins: '',
        basePriceCoins: '',
        minQty: 1,
        maxQty: 999,
        displayOrder: 0,
        image: '',
        status: 'active',
        // =====================================================
        // إعدادات المنتج - Product Settings
        // =====================================================
        productStatus: 'available',
        isVisibleInStore: true,
        showWhenUnavailable: false,
        pauseSales: false,
        pauseReason: '',
        internalNotes: '',
        enableSchedule: false,
        scheduledStartAt: '',
        scheduledEndAt: '',
        scheduleVisibilityMode: 'hide',
        // =====================================================
        // حدود الطلب - Order Limits
        // =====================================================
        minimumOrderQty: 1,
        maximumOrderQty: 999,
        stepQty: 1,
        trackInventory: false,
        stockQuantity: 999,
        lowStockThreshold: 50,
        hideWhenOutOfStock: false,
        showOutOfStockLabel: true,
        dynamicFields: [],
    });

    const sortedAdminProducts = useMemo(() => (
        Array.isArray(products) ? [...products] : []
    ).sort((left, right) => {
        const orderDelta = Number(left?.displayOrder || 0) - Number(right?.displayOrder || 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left?.name || '').localeCompare(String(right?.name || ''), isEnglish ? 'en' : 'ar');
    }), [products, isEnglish]);

    const sortedAdminCategories = useMemo(() => (
        Array.isArray(categories) ? [...categories] : []
    ).sort((left, right) => {
        const leftOrder = Number(left?.sortOrder ?? left?.displayOrder);
        const rightOrder = Number(right?.sortOrder ?? right?.displayOrder);
        const leftHas = Number.isFinite(leftOrder);
        const rightHas = Number.isFinite(rightOrder);

        if (leftHas && rightHas) {
            const delta = leftOrder - rightOrder;
            if (delta !== 0) return delta;
        } else if (leftHas && !rightHas) {
            return -1;
        } else if (!leftHas && rightHas) {
            return 1;
        }

        return String(left?.name || '').localeCompare(String(right?.name || ''), isEnglish ? 'en' : 'ar');
    }), [categories, isEnglish]);

    const primaryCategories = useMemo(
        () => sortedAdminCategories.filter((category) => !String(category?.parentCategory || '').trim()),
        [sortedAdminCategories]
    );

    const subcategories = useMemo(
        () => sortedAdminCategories.filter((category) => String(category?.parentCategory || '').trim()),
        [sortedAdminCategories]
    );

    const categoryById = useMemo(
        () => new Map(sortedAdminCategories.map((category) => [String(category.id), category])),
        [sortedAdminCategories]
    );

    const productCountByCategory = useMemo(() => {
        const counts = new Map();
        sortedAdminProducts.forEach((product) => {
            const categoryId = String(product?.category?._id || product?.category?.id || product?.category || '').trim();
            if (categoryId) counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
        });
        return counts;
    }, [sortedAdminProducts]);

    const subcategoryCountByParent = useMemo(() => {
        const counts = new Map();
        subcategories.forEach((category) => {
            const parentId = String(category?.parentCategory || '').trim();
            if (parentId) counts.set(parentId, (counts.get(parentId) || 0) + 1);
        });
        return counts;
    }, [subcategories]);

    useEffect(() => {
        loadProducts({ force: true });
    }, [loadProducts]);

    useEffect(() => {
        if (isProductModalOpen && !productForm.category && categories.length > 0) {
            setProductForm((prev) => ({ ...prev, category: categories[0].id }));
        }
    }, [isProductModalOpen, categories, productForm.category]);

    useEffect(() => {
        let isMounted = true;

        apiClient.suppliers
            .list()
            .then((data) => {
                if (!isMounted) return;

                setProviders(Array.isArray(data) ? data.map((supplier) => ({
                    id: supplier.id,
                    name: supplier.supplierName || supplier.name || supplier.id,
                    isActive: supplier.isActive !== false,
                })) : []);
            })
            .catch(() => {
                if (!isMounted) return;
                setProviders([]);
                addToast('فشل تحميل المزودين', 'error');
            });

        return () => {
            isMounted = false;
        };
    }, [isProductModalOpen, addToast]);

    useEffect(() => {
        const selectedSupplier = productForm.supplierId || productForm.providerId;
        if (!isProductModalOpen || !selectedSupplier) {
            setProviderProducts([]);
            return;
        }
        apiClient.products
            .listProviderProducts(selectedSupplier)
            .then((items) => {
                const nextItems = Array.isArray(items) ? items : [];
                setProviderProducts(nextItems);
                // If the currently selected product ID is not in the new list, reset it
                setProductForm((prev) => {
                    const currentPPId = prev.providerProductId || prev.externalProductId;
                    if (currentPPId && !nextItems.some((p) => hasMatchingProviderProduct(p, prev.providerProductId, prev.externalProductId))) {
                        return { ...prev, externalProductId: '', providerProductId: '', externalProductName: '' };
                    }
                    return prev;
                });
            })
            .catch(() => {
                setProviderProducts([]);
                addToast('فشل تحميل منتجات المزود', 'error');
            });
        // Fix 4: Only re-fetch when the provider ID changes or the modal opens/closes.
        // providerProductId/externalProductId are removed to prevent race conditions
        // when they are cleared by the provider onChange handler.
    }, [isProductModalOpen, productForm.providerId, productForm.supplierId, addToast]);

    useEffect(() => {
        setProviderProductQuery('');
    }, [isProductModalOpen, productForm.providerId, productForm.supplierId]);

    const selectedSupplierId = productForm.supplierId || productForm.providerId;
    const selectedProviderProductId = productForm.providerProductId || productForm.externalProductId;
    const canSyncWithProvider = Boolean(productForm.syncPriceWithProvider && selectedSupplierId && selectedProviderProductId);
    const selectedProviderProduct = useMemo(
        () => providerProducts.find((product) => hasMatchingProviderProduct(
            product,
            productForm.providerProductId,
            productForm.externalProductId
        )) || null,
        [productForm.externalProductId, productForm.providerProductId, providerProducts]
    );
    const filteredProviderProducts = useMemo(() => {
        const normalizedQuery = String(providerProductQuery || '').trim().toLowerCase();
        if (!normalizedQuery) {
            return providerProducts;
        }

        return providerProducts.filter((product) => getProviderProductSearchToken(product).includes(normalizedQuery));
    }, [providerProducts, providerProductQuery]);
    const activeProviders = useMemo(
        () => providers.filter((provider) => provider.isActive !== false),
        [providers]
    );
    const providerNamesById = useMemo(
        () => new Map(providers.map((provider) => [String(provider.id || '').trim(), provider.name])),
        [providers]
    );

    const getProviderDisplayName = (product) => {
        const providerId = String(product?.providerId || product?.supplierId || '').trim();
        if (!providerId) return '-';

        return (
            String(product?.providerName || product?.supplierName || '').trim()
            || providerNamesById.get(providerId)
            || providerId
        );
    };

    const filteredAdminProducts = useMemo(() => {
        const normalizedQuery = String(productSearchQuery || '').trim().toLowerCase();
        const selectedCategory = categoryById.get(String(productCategoryFilter));
        const allowedCategoryIds = new Set(
            productCategoryFilter === 'all'
                ? []
                : selectedCategory && !String(selectedCategory.parentCategory || '').trim()
                    ? [
                        String(productCategoryFilter),
                        ...subcategories
                            .filter((category) => String(category.parentCategory) === String(productCategoryFilter))
                            .map((category) => String(category.id)),
                    ]
                    : [String(productCategoryFilter)]
        );

        return sortedAdminProducts.filter((product) => {
            const categoryId = String(product?.category?._id || product?.category?.id || product?.category || '').trim();
            const connectionType = String(product?.connectionType || '').trim()
                || (product?.autoFulfillmentEnabled === false ? 'manual' : 'auto');
            const matchesSearch = !normalizedQuery || [
                product?.name,
                product?.nameAr,
                product?.description,
                product?.externalProductName,
                getProviderDisplayName(product),
            ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
            const matchesCategory = productCategoryFilter === 'all' || allowedCategoryIds.has(categoryId);
            const matchesConnection = productConnectionFilter === 'all' || connectionType === productConnectionFilter;
            return matchesSearch && matchesCategory && matchesConnection;
        });
    }, [categoryById, productCategoryFilter, productConnectionFilter, productSearchQuery, providerNamesById, sortedAdminProducts, subcategories]);

    const hasActiveProductFilters = Boolean(
        String(productSearchQuery || '').trim()
        || productCategoryFilter !== 'all'
        || productConnectionFilter !== 'all'
    );

    const expectedProfitValue = useMemo(() => {
        if (productForm.connectionType !== 'manual') return null;
        const sellingPrice = Number(normalizePriceInput(productForm.basePriceCoins) || 0);
        const costPrice = Number(normalizePriceInput(productForm.costPrice) || 0);
        if (!Number.isFinite(sellingPrice) || !Number.isFinite(costPrice)) return null;
        return sellingPrice - costPrice;
    }, [productForm.basePriceCoins, productForm.connectionType, productForm.costPrice]);

    const syncProviderPrice = async (manualOverride, supplierIdOverride, providerProductIdOverride) => {
        const supplierId = supplierIdOverride || productForm.supplierId || productForm.providerId;
        const providerProductId = providerProductIdOverride || productForm.providerProductId || productForm.externalProductId;
        if (!supplierId || !providerProductId) return;
        const fallbackProviderProduct = selectedProviderProduct
            || providerProducts.find((product) => hasMatchingProviderProduct(product, providerProductId));

        // Fix 3: Extract only primitive values — never spread the live catalogue
        // object to prevent accidental mutation of the providerProducts array.
        const fallbackSnapshot = fallbackProviderProduct ? {
            rawPrice: getProviderProductPriceValue(fallbackProviderProduct),
            minQty: getProviderProductMinQtyValue(fallbackProviderProduct),
            maxQty: getProviderProductMaxQtyValue(fallbackProviderProduct),
        } : null;

        if (fallbackSnapshot) {
            setProductForm((prev) => mergeProviderSyncIntoForm(
                prev,
                supplierId,
                providerProductId,
                buildProviderSyncSnapshot(fallbackSnapshot, {
                    enableManualPrice: prev.enableManualPrice,
                    manualPriceAdjustment: manualOverride ?? prev.manualPriceAdjustment,
                    fallbackMinQty: prev.minimumOrderQty,
                    fallbackMaxQty: prev.maximumOrderQty,
                })
            ));
        }
        try {
            setIsSyncingPrice(true);
            const synced = await apiClient.products.getSyncedPrice(supplierId, providerProductId);
            // Fix 3: Merge synced data into a new isolated object with only
            // the primitive fields we need — never spreading the catalogue reference.
            const syncSource = {
                rawPrice: synced?.rawPrice ?? fallbackSnapshot?.rawPrice,
                minQty: synced?.minQty ?? fallbackSnapshot?.minQty,
                maxQty: synced?.maxQty ?? fallbackSnapshot?.maxQty,
            };
            setProductForm((prev) => mergeProviderSyncIntoForm(
                prev,
                supplierId,
                providerProductId,
                buildProviderSyncSnapshot(syncSource, {
                    enableManualPrice: prev.enableManualPrice,
                    manualPriceAdjustment: manualOverride ?? prev.manualPriceAdjustment,
                    fallbackMinQty: prev.minimumOrderQty,
                    fallbackMaxQty: prev.maximumOrderQty,
                })
            ));
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                isEnglish
                    ? 'Could not sync supplier price. Check the selected supplier product, then retry.'
                    : 'تعذرت مزامنة سعر المورد: تأكد من المنتج المختار من المزود ثم أعد المحاولة.'
            ), 'error');
        } finally {
            setIsSyncingPrice(false);
        }
    };

    useEffect(() => {
        if (!isProductModalOpen || !productForm.syncPriceWithProvider || !selectedSupplierId || !selectedProviderProductId) {
            return;
        }

        void syncProviderPrice(undefined, selectedSupplierId, selectedProviderProductId);
    }, [isProductModalOpen, productForm.syncPriceWithProvider, selectedSupplierId, selectedProviderProductId, selectedProviderProduct]);

    const handleProviderProductSelect = (value) => {
        const selected = providerProducts.find((product) => hasMatchingProviderProduct(product, value));
        // Fix 2: Extract only primitives from the catalogue item to prevent
        // any accidental mutation of the source providerProducts array.
        const selectedSnapshot = selected ? {
            rawPrice: getProviderProductPriceValue(selected),
            minQty: getProviderProductMinQtyValue(selected),
            maxQty: getProviderProductMaxQtyValue(selected),
        } : null;
        setProductForm((prev) => ({
            ...prev,
            externalProductId: String(selected?.externalProductId || value).trim(),
            providerProductId: value,
            externalProductName: selected?.name || '',
            ...(prev.syncPriceWithProvider && selectedSnapshot
                ? buildProviderSyncSnapshot(selectedSnapshot, {
                    enableManualPrice: prev.enableManualPrice,
                    manualPriceAdjustment: prev.manualPriceAdjustment,
                    fallbackMinQty: prev.minimumOrderQty,
                    fallbackMaxQty: prev.maximumOrderQty,
                })
                : {}),
        }));
    };

    const parseSupplierMappings = (text) => String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [internalField, externalField] = line.split(':').map((v) => String(v || '').trim());
            return { internalField, externalField };
        })
        .filter((m) => m.internalField && m.externalField);

    const getReadableErrorMessage = (error, fallback) => {
        const rawMessage = String(error?.response?.data?.message || error?.message || '').trim();
        const status = error?.response?.status;
        const normalized = rawMessage.toLowerCase();

        if (status === 401 || normalized.includes('unauthorized') || normalized.includes('token')) {
            return isEnglish
                ? 'Your session expired. Sign in again, then retry the action.'
                : 'انتهت الجلسة: سجّل الدخول مرة أخرى ثم أعد المحاولة.';
        }

        if (status === 403 || normalized.includes('forbidden') || normalized.includes('permission')) {
            return isEnglish
                ? 'You do not have permission to complete this action.'
                : 'ليست لديك صلاحية لتنفيذ هذا الإجراء. راجع صلاحيات الحساب.';
        }

        if (status === 404 || normalized.includes('not found')) {
            return isEnglish
                ? 'The item was not found. Refresh the page and try again.'
                : 'العنصر غير موجود أو تم حذفه. حدّث الصفحة ثم حاول مرة أخرى.';
        }

        if (status >= 500 || normalized.includes('network') || normalized.includes('timeout')) {
            return isEnglish
                ? 'Connection or server issue. Check the backend connection and try again.'
                : 'مشكلة اتصال أو خادم: تأكد من اتصال الباك إند ثم حاول مرة أخرى.';
        }

        return rawMessage || fallback;
    };

    const handleImageUpload = async (e, setForm, uploadCategory = 'products') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            addToast(isEnglish ? 'Image is too large: upload an image under 20MB.' : 'الصورة كبيرة جدًا: ارفع صورة أقل من 20 ميجابايت.', 'error');
            return;
        }
        try {
            const path = await uploadImage(uploadCategory, file);
            setForm((prev) => ({ ...prev, image: path }));
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                isEnglish
                    ? 'Image upload failed. Check the image format and try again.'
                    : 'تعذر رفع الصورة: تأكد من صيغة الصورة وحاول مرة أخرى.'
            ), 'error');
        }
    };

    const openProductModal = (product = null) => {
        setProductModalStep(1);
        if (product) {
            const linkedProviderId = String(product.providerId || product.supplierId || '').trim();
            const linkedProviderProductId = String(product.providerProductId || product.externalProductId || '').trim();
            const hasLinkedProvider = Boolean(linkedProviderId && linkedProviderProductId);
            const shouldSyncWithProvider = hasLinkedProvider && (
                Boolean(product.syncPriceWithProvider)
                || usesProviderPricingMode(product.externalPricingMode)
            );
            setEditingProduct(product);
            setProductForm({
                name: product.name || '',
                nameAr: product.nameAr || '',
                description: product.description || '',
                category: product.category || categories[0]?.id || '',
                connectionType: product.autoFulfillmentEnabled === false ? 'manual' : 'auto',
                providerId: linkedProviderId,
                providerProductId: linkedProviderProductId,
                supplierId: linkedProviderId,
                externalProductId: String(product.externalProductId || product.providerProductId || linkedProviderProductId).trim(),
                externalProductName: product.externalProductName || '',
                autoFulfillmentEnabled: product.autoFulfillmentEnabled !== false,
                supplierMarginType: product.supplierMarginType || 'fixed',
                supplierMarginValue: product.supplierMarginValue ?? 0,
                supplierFieldMappingsText: Array.isArray(product.supplierFieldMappings) ? product.supplierFieldMappings.map((m) => `${m.internalField}:${m.externalField}`).join('\n') : 'playerId:uid\nquantity:qty',
                syncPriceWithProvider: shouldSyncWithProvider,
                externalPricingMode: product.externalPricingMode || (shouldSyncWithProvider ? 'use_supplier_price' : 'use_local_price'),
                enableManualPrice: Number(product.manualPriceAdjustment || 0) !== 0,
                manualPriceAdjustment: normalizePriceInput(product.manualPriceAdjustment ?? ''),
                syncedProviderBasePrice: normalizePriceInput(product.syncedProviderBasePrice ?? product.basePriceCoins ?? ''),
                costPrice: normalizePriceInput(product.costPrice ?? product.originalPriceCoins ?? product.originalPrice ?? ''),
                originalPriceCoins: normalizePriceInput(product.originalPriceCoins ?? product.originalPrice ?? product.costPrice ?? ''),
                basePriceCoins: normalizePriceInput(product.basePriceCoins ?? ''),
                minQty: product.minQty ?? 1,
                maxQty: product.maxQty ?? 999,
                displayOrder: product.displayOrder ?? 0,
                image: product.image || '',
                status: product.status || 'active',
                   productStatus: 'available',
                   isVisibleInStore: true,
                   showWhenUnavailable: false,
                   pauseSales: false,
                   pauseReason: '',
                internalNotes: product.internalNotes || '',
                enableSchedule: false,
                scheduledStartAt: '',
                scheduledEndAt: '',
                scheduleVisibilityMode: 'hide',
                minimumOrderQty: product.minimumOrderQty ?? 1,
                maximumOrderQty: product.maximumOrderQty ?? 999,
                stepQty: product.stepQty ?? 1,
                trackInventory: false,
                stockQuantity: 999,
                lowStockThreshold: 50,
                hideWhenOutOfStock: false,
                showOutOfStockLabel: true,
                dynamicFields: extractDynamicFieldRows(product),
            });
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                nameAr: '',
                description: '',
                category: categories[0]?.id || '',
                connectionType: 'auto',
                providerId: '',
                providerProductId: '',
                supplierId: '',
                externalProductId: '',
                externalProductName: '',
                autoFulfillmentEnabled: true,
                externalPricingMode: 'use_local_price',
                supplierMarginType: 'fixed',
                supplierMarginValue: 0,
                supplierFieldMappingsText: 'playerId:uid\nquantity:qty',
                syncPriceWithProvider: false,
                enableManualPrice: false,
                manualPriceAdjustment: '',
                syncedProviderBasePrice: '',
                costPrice: '',
                originalPriceCoins: '',
                basePriceCoins: '',
                minQty: 1,
                maxQty: 999,
                displayOrder: 0,
                image: '',
                status: 'active',
                productStatus: 'available',
                isVisibleInStore: true,
                showWhenUnavailable: false,
                pauseSales: false,
                pauseReason: '',
                internalNotes: '',
                enableSchedule: false,
                scheduledStartAt: '',
                scheduledEndAt: '',
                scheduleVisibilityMode: 'hide',
                minimumOrderQty: 1,
                maximumOrderQty: 999,
                stepQty: 1,
                trackInventory: false,
                stockQuantity: 999,
                lowStockThreshold: 50,
                hideWhenOutOfStock: false,
                showOutOfStockLabel: true,
                dynamicFields: [],
            });
        }
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();

        if (isSavingProduct) return;

        // validation شامل
        const validationErrors = validateProductForm(productForm, { requireImage: !editingProduct });
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => addToast(error, 'error'));
            return;
        }

        const isAutomaticConnection = productForm.connectionType !== 'manual';
        const selectedSupplierId = isAutomaticConnection ? String(productForm.supplierId || productForm.providerId || '').trim() : '';
        const selectedProviderProductId = isAutomaticConnection ? String(productForm.providerProductId || productForm.externalProductId || '').trim() : '';
        const selectedExternalProductId = isAutomaticConnection ? String(productForm.externalProductId || productForm.providerProductId || '').trim() : '';
        const hasProviderLink = Boolean(selectedSupplierId && selectedProviderProductId);
        const shouldSyncWithProvider = Boolean(isAutomaticConnection && productForm.syncPriceWithProvider && hasProviderLink);
        const resolvedExternalPricingMode = shouldSyncWithProvider
            ? (usesProviderPricingMode(productForm.externalPricingMode) ? productForm.externalPricingMode : 'use_supplier_price')
            : (usesProviderPricingMode(productForm.externalPricingMode) ? 'use_local_price' : productForm.externalPricingMode);
        const fallbackName = String(productForm.name || productForm.nameAr || '').trim();
        const fallbackCategory = String(productForm.category || categories[0]?.id || '').trim();
        const productImage = String(productForm.image || editingProduct?.image || '').trim();

        if (isAutomaticConnection && !selectedSupplierId) {
            addToast(isEnglish
                ? 'Supplier is required: choose the provider that will fulfill this automatic product.'
                : 'المورد مطلوب: اختر المزود الذي سينفذ هذا المنتج الآلي.',
            'error');
            return;
        }

        if (isAutomaticConnection && !selectedProviderProductId) {
            addToast(isEnglish
                ? 'Supplier product is required: choose the matching product from the selected provider.'
                : 'منتج المورد مطلوب: اختر المنتج المطابق من قائمة المزود المختار.',
            'error');
            return;
        }

        let minQty = Number(productForm.minimumOrderQty === '' || productForm.minimumOrderQty == null ? 1 : productForm.minimumOrderQty);
        let maxQty = Number(productForm.maximumOrderQty === '' || productForm.maximumOrderQty == null ? 999 : productForm.maximumOrderQty);
        const stepQty = Number(productForm.stepQty === '' || productForm.stepQty == null ? 1 : productForm.stepQty);

        let basePriceCoinsValue = normalizePriceInput(productForm.basePriceCoins);
        let basePriceCoins = Number(basePriceCoinsValue || 0);
        let syncedProviderBasePrice = null;
        const manualPriceAdjustmentRaw = normalizePriceInput(productForm.manualPriceAdjustment);
        const manualPriceAdjustment = productForm.enableManualPrice ? Number(manualPriceAdjustmentRaw || 0) : 0;

        if (shouldSyncWithProvider) {
            try {
                const synced = await apiClient.products.getSyncedPrice(selectedSupplierId, selectedProviderProductId);
                const syncedSnapshot = buildProviderSyncSnapshot(
                    { ...(selectedProviderProduct || {}), ...(synced || {}) },
                    {
                        enableManualPrice: productForm.enableManualPrice,
                        manualPriceAdjustment: manualPriceAdjustmentRaw,
                        fallbackMinQty: minQty,
                        fallbackMaxQty: maxQty,
                    }
                );
                syncedProviderBasePrice = Number(normalizePriceInput(syncedSnapshot.syncedProviderBasePrice || '') || 0);
                basePriceCoinsValue = syncedSnapshot.basePriceCoins;
                basePriceCoins = Number(normalizePriceInput(basePriceCoinsValue) || 0);
                minQty = syncedSnapshot.minimumOrderQty;
                maxQty = syncedSnapshot.maximumOrderQty;
                setProductForm((prev) => ({ ...prev, ...syncedSnapshot }));
            } catch (error) {
                addToast(getReadableErrorMessage(
                    error,
                    isEnglish
                        ? 'Could not refresh supplier price before saving. Check the provider product link.'
                        : 'تعذرت مزامنة السعر قبل الحفظ: تأكد من اختيار المورد والمنتج الصحيحين.'
                ), 'error');
                return;
            }
        }

        if (Number.isNaN(basePriceCoins) || basePriceCoins <= 0) {
            addToast(isEnglish
                ? 'Final price is required: enter a number greater than zero.'
                : 'السعر النهائي غير صحيح: أدخل رقمًا أكبر من صفر.',
            'error');
            return;
        }

        const dynamicFieldsPayload = buildDynamicFieldsPayload(productForm.dynamicFields || []);
        const orderFieldsPayload = buildOrderFieldsPayloadFromDynamic(dynamicFieldsPayload);
        const supplierFieldMappings = parseSupplierMappings(productForm.supplierFieldMappingsText);
        const originalPriceValue = isAutomaticConnection
            ? ''
            : normalizePriceInput(productForm.originalPriceCoins || productForm.costPrice);

        const payload = {
            // معلومات أساسية
            name: fallbackName,
            nameAr: String(productForm.nameAr || productForm.name || '').trim(),
            description: productForm.description,
            descriptionAr: productForm.description,
            category: fallbackCategory,
            image: productImage,
            status: productForm.status,
            displayOrder: Number(productForm.displayOrder || 0),
            connectionType: isAutomaticConnection ? 'auto' : 'manual',
            executionType: isAutomaticConnection ? 'automatic' : 'manual',
            
            // التسعير والمورد
            providerId: selectedSupplierId,
            providerProductId: selectedProviderProductId,
            supplierId: selectedSupplierId,
            externalProductId: selectedExternalProductId,
            externalProductName: String(productForm.externalProductName || '').trim(),
            autoFulfillmentEnabled: isAutomaticConnection,
            supplierFieldMappings,
            providerMapping: supplierFieldMappings,
            externalPricingMode: String(resolvedExternalPricingMode || 'use_local_price'),
            supplierMarginType: String(productForm.supplierMarginType || 'fixed'),
            supplierMarginValue: Number(productForm.supplierMarginValue || 0),
            fallbackSupplierId: '',
            supplierNotes: '',
            orderFields: orderFieldsPayload,
            dynamicFields: dynamicFieldsPayload,
            syncPriceWithProvider: shouldSyncWithProvider,
            enableManualPrice: productForm.enableManualPrice,
            manualPriceAdjustment,
            syncedProviderBasePrice,
            originalPriceCoins: originalPriceValue,
            originalPrice: originalPriceValue,
            costPrice: originalPriceValue,
            basePriceCoins: basePriceCoinsValue || String(basePriceCoins),
            
            // الكميات والحدود
            minimumOrderQty: minQty,
            maximumOrderQty: maxQty,
            stepQty,
            minQty: minQty,
            maxQty: maxQty,
            providerQuantity: maxQty,
            
            // إعدادات المنتج
            productStatus: productForm.productStatus,
            isVisibleInStore: productForm.isVisibleInStore,
            showWhenUnavailable: productForm.showWhenUnavailable,
            pauseSales: productForm.pauseSales,
            pauseReason: productForm.pauseReason,
            internalNotes: productForm.internalNotes,
            
            enableSchedule: false,
            scheduledStartAt: null,
            scheduledEndAt: null,
            scheduleVisibilityMode: 'hide',
            trackInventory: false,
            stockQuantity: 999,
            lowStockThreshold: 0,
            hideWhenOutOfStock: false,
            showOutOfStockLabel: true,
        };

        setIsSavingProduct(true);

        try {
            let savedProduct;
            if (editingProduct) {
                savedProduct = await updateProduct(editingProduct.id, payload);
            } else {
                savedProduct = await addProduct(payload);
            }

            await loadProducts({ force: true });
            setIsProductModalOpen(false);
            setEditingProduct(null);
            addToast(
                editingProduct
                    ? (t('productUpdated') || 'تم تحديث المنتج')
                    : (t('productAdded') || 'تمت إضافة المنتج'),
                'success'
            );
            return savedProduct;
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                editingProduct
                    ? (isEnglish ? 'Could not update the product. Review the fields and try again.' : 'تعذر تحديث المنتج: راجع البيانات المطلوبة ثم حاول مرة أخرى.')
                    : (isEnglish ? 'Could not add the product. Review the fields and try again.' : 'تعذر إضافة المنتج: راجع البيانات المطلوبة ثم حاول مرة أخرى.')
            ), 'error');
        } finally {
            setIsSavingProduct(false);
        }
    };

    const handleToggleProductStatus = async (product) => {
        const isCurrentlyActive = product.status === 'active';
        const actionLabel = isCurrentlyActive
            ? (isEnglish ? 'deactivate' : 'إيقاف')
            : (isEnglish ? 'activate' : 'تفعيل');

        try {
            setTogglingProductId(product.id);
            const updatedProduct = await toggleProductStatus(product.id);
            addToast(
                updatedProduct?.status === 'active'
                    ? (isEnglish ? 'Product activated successfully' : 'تم تفعيل المنتج بنجاح')
                    : (isEnglish ? 'Product deactivated successfully' : 'تم إيقاف المنتج بنجاح'),
                'success'
            );
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                isEnglish
                    ? `Could not ${actionLabel} product. Refresh the list and try again.`
                    : `تعذر ${actionLabel} المنتج: حدّث القائمة ثم حاول مرة أخرى.`
            ), 'error');
        } finally {
            setTogglingProductId((currentId) => (currentId === product.id ? null : currentId));
        }
    };

    const openCategoryModal = (category = null, options = {}) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({
                name: String(category?.name || ''),
                sortOrder: Number(category?.sortOrder ?? category?.displayOrder ?? 0),
                image: String(category?.image || ''),
                parentCategory: String(category?.parentCategory || ''),
            });
        } else {
            setEditingCategory(null);
            setCategoryForm({
                name: '',
                sortOrder: 0,
                image: '',
                parentCategory: options.asSubcategory ? String(primaryCategories[0]?.id || '') : '',
            });
        }
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (event) => {
        event.preventDefault();

        const name = String(categoryForm.name || '').trim();
        const sortOrder = Number(categoryForm.sortOrder ?? 0);
        const safeSortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;

        if (!name) {
            addToast(isEnglish ? 'Category name is required: write the name shown in the catalog list.' : 'اسم القسم مطلوب: اكتب الاسم الذي سيظهر في قائمة الكتالوجات.', 'error');
            return;
        }

        setIsSavingCategory(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name,
                    nameAr: '',
                    sortOrder: safeSortOrder,
                    image: categoryForm.image || '',
                    parentCategory: categoryForm.parentCategory || null,
                });
                addToast(isEnglish ? 'Category updated' : 'تم تحديث القسم', 'success');
            } else {
                await addCategory({
                    name,
                    nameAr: '',
                    sortOrder: safeSortOrder,
                    image: categoryForm.image || '',
                    parentCategory: categoryForm.parentCategory || null,
                });
                addToast(isEnglish ? 'Category added' : 'تمت إضافة القسم', 'success');
            }

            setIsCategoryModalOpen(false);
            setEditingCategory(null);
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                isEnglish
                    ? 'Could not save category. Check the name/image and try again.'
                    : 'تعذر حفظ القسم: راجع الاسم أو الصورة ثم حاول مرة أخرى.'
            ), 'error');
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!category) return;
        setCategoryToDelete(category);
    };

    const confirmDeleteCategory = async () => {
        const category = categoryToDelete;
        if (!category) return;
        try {
            await deleteCategory(category.id);
            setCategoryToDelete(null);
            addToast(isEnglish ? 'Category deleted' : 'تم حذف القسم', 'success');
        } catch (error) {
            addToast(getReadableErrorMessage(
                error,
                isEnglish
                    ? 'Could not delete category. It may contain products or has already been removed.'
                    : 'تعذر حذف القسم: قد يكون مرتبطًا بمنتجات أو تم حذفه بالفعل.'
            ), 'error');
        }
    };

    return (
        <div className="min-w-0 space-y-4 pb-4 sm:space-y-5">
            <section className="admin-premium-hero overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft))] text-[var(--color-button-text)] shadow-[0_16px_30px_-22px_rgb(var(--color-primary-rgb)/0.85)]">
                            <Boxes className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-lg font-black text-[var(--color-text)] sm:text-2xl">{t('productsManager')}</h1>
                            <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
                                {isEnglish ? 'A clear structure for your complete catalog.' : 'تنظيم واضح وسهل لكل محتوى المتجر.'}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                        {[
                            [primaryCategories.length, isEnglish ? 'Main' : 'رئيسي'],
                            [subcategories.length, isEnglish ? 'Sub' : 'فرعي'],
                            [sortedAdminProducts.length, isEnglish ? 'Products' : 'منتج'],
                        ].map(([value, label]) => (
                            <div key={label} className="min-w-[4.25rem] rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.14)] bg-[color:rgb(var(--color-primary-rgb)/0.045)] px-2 py-1.5">
                                <p className="text-sm font-black text-[var(--color-primary)]">{value}</p>
                                <p className="text-[8px] font-semibold text-[var(--color-text-secondary)]">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden rounded-[1.35rem] border border-amber-400/25 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.96),rgba(245,158,11,0.055))] shadow-[0_20px_46px_-38px_rgba(245,158,11,0.7)]">
                <div className="flex items-center justify-between gap-2 border-b border-amber-400/15 p-3 sm:p-4">
                    <button type="button" onClick={() => setIsPrimaryCategoriesOpen((current) => !current)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start" aria-expanded={isPrimaryCategoriesOpen}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                            <FolderTree className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-300">01</span>
                                <h2 className="truncate text-sm font-black text-[var(--color-text)] sm:text-base">{isEnglish ? 'Main Categories' : 'الأقسام الرئيسية'}</h2>
                            </div>
                            <p className="mt-0.5 text-[9px] text-[var(--color-text-secondary)] sm:text-[10px]">{isEnglish ? 'The top-level sections visible in your store.' : 'الأقسام الأساسية التي تظهر داخل المتجر.'}</p>
                        </div>
                        <span className="ms-auto flex items-center gap-1.5 rounded-lg bg-amber-500/8 px-2 py-1 text-[9px] font-black text-amber-700 dark:text-amber-300">
                            {primaryCategories.length}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isPrimaryCategoriesOpen ? 'rotate-180' : ''}`} />
                        </span>
                    </button>
                    <Button size="sm" onClick={() => openCategoryModal()} className="h-9 shrink-0 rounded-xl px-3 text-[10px] sm:text-xs">
                        <Plus className="h-3.5 w-3.5" /> {isEnglish ? 'Add' : 'إضافة'}
                    </Button>
                </div>

                {isPrimaryCategoriesOpen ? (
                <div className="grid animate-[fade-in_180ms_ease-out] gap-2.5 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                    {primaryCategories.map((category) => {
                        const categoryId = String(category.id);
                        return (
                            <article key={category.id} className="group flex items-center gap-2.5 rounded-2xl border border-amber-400/18 bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-2.5 transition hover:border-amber-400/35">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-amber-400/18 bg-amber-500/8">
                                    {category.image ? (
                                        <img src={resolveImageUrl(category.image)} alt={category.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-amber-600/70 dark:text-amber-300/70"><Package className="h-5 w-5" /></div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="truncate text-xs font-extrabold text-[var(--color-text)]">{category.name || '-'}</h3>
                                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:text-amber-300">#{Number(category?.sortOrder ?? category?.displayOrder ?? 0)}</span>
                                    </div>
                                    <p className="mt-1 text-[9px] text-[var(--color-text-secondary)]">
                                        {subcategoryCountByParent.get(categoryId) || 0} {isEnglish ? 'subcategories' : 'فرعي'} · {productCountByCategory.get(categoryId) || 0} {isEnglish ? 'products' : 'منتج'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1">
                                    <button type="button" onClick={() => openCategoryModal(category)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/9 text-amber-700 transition hover:bg-amber-500/18 dark:text-amber-300" aria-label={isEnglish ? 'Edit category' : 'تعديل القسم'}><Edit className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => handleDeleteCategory(category)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/8 text-rose-600 transition hover:bg-rose-500/16 dark:text-rose-300" aria-label={isEnglish ? 'Delete category' : 'حذف القسم'}><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </article>
                        );
                    })}
                    {!primaryCategories.length ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-amber-400/25 py-7 text-center text-xs text-[var(--color-text-secondary)]">{isEnglish ? 'No main categories yet.' : 'لا توجد أقسام رئيسية حتى الآن.'}</div>
                    ) : null}
                </div>
                ) : null}
            </section>

            <section className="relative overflow-hidden rounded-[1.35rem] border border-cyan-400/22 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.96),rgba(6,182,212,0.05))] shadow-[0_20px_46px_-38px_rgba(6,182,212,0.65)]">
                <div className="flex items-center justify-between gap-2 border-b border-cyan-400/14 p-3 sm:p-4">
                    <button type="button" onClick={() => setIsSubcategoriesOpen((current) => !current)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start" aria-expanded={isSubcategoriesOpen}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"><Layers3 className="h-4.5 w-4.5" /></span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-cyan-700 dark:text-cyan-300">02</span>
                                <h2 className="truncate text-sm font-black text-[var(--color-text)] sm:text-base">{isEnglish ? 'Subcategories' : 'الأقسام الفرعية'}</h2>
                            </div>
                            <p className="mt-0.5 text-[9px] text-[var(--color-text-secondary)] sm:text-[10px]">{isEnglish ? 'Organize products inside each main category.' : 'تنظيم المنتجات داخل كل قسم رئيسي.'}</p>
                        </div>
                        <span className="ms-auto flex items-center gap-1.5 rounded-lg bg-cyan-500/8 px-2 py-1 text-[9px] font-black text-cyan-700 dark:text-cyan-300">
                            {subcategories.length}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isSubcategoriesOpen ? 'rotate-180' : ''}`} />
                        </span>
                    </button>
                    <Button size="sm" variant="outline" disabled={!primaryCategories.length} onClick={() => openCategoryModal(null, { asSubcategory: true })} className="h-9 shrink-0 rounded-xl border-cyan-400/30 px-3 text-[10px] text-cyan-700 hover:bg-cyan-500/8 dark:text-cyan-300 sm:text-xs">
                        <Plus className="h-3.5 w-3.5" /> {isEnglish ? 'Add' : 'إضافة'}
                    </Button>
                </div>

                {isSubcategoriesOpen ? (
                <div className="grid animate-[fade-in_180ms_ease-out] gap-2.5 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                    {subcategories.map((category) => {
                        const parent = categoryById.get(String(category.parentCategory));
                        return (
                            <article key={category.id} className="flex items-center gap-2.5 rounded-2xl border border-cyan-400/16 bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-2.5 transition hover:border-cyan-400/32">
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-cyan-400/16 bg-cyan-500/7">
                                    {category.image ? <img src={resolveImageUrl(category.image)} alt={category.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-cyan-700/65 dark:text-cyan-300/70"><Layers3 className="h-4.5 w-4.5" /></div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="truncate text-xs font-extrabold text-[var(--color-text)]">{category.name || '-'}</h3>
                                        <span className="rounded-md bg-cyan-500/9 px-1.5 py-0.5 text-[8px] font-bold text-cyan-700 dark:text-cyan-300">#{Number(category?.sortOrder ?? category?.displayOrder ?? 0)}</span>
                                    </div>
                                    <p className="mt-1 truncate text-[9px] text-[var(--color-text-secondary)]">{parent?.name || (isEnglish ? 'Unknown parent' : 'بدون قسم رئيسي')} · {productCountByCategory.get(String(category.id)) || 0} {isEnglish ? 'products' : 'منتج'}</p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1">
                                    <button type="button" onClick={() => openCategoryModal(category)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/8 text-cyan-700 transition hover:bg-cyan-500/16 dark:text-cyan-300" aria-label={isEnglish ? 'Edit subcategory' : 'تعديل القسم الفرعي'}><Edit className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => handleDeleteCategory(category)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/8 text-rose-600 transition hover:bg-rose-500/16 dark:text-rose-300" aria-label={isEnglish ? 'Delete subcategory' : 'حذف القسم الفرعي'}><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </article>
                        );
                    })}
                    {!subcategories.length ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-cyan-400/22 py-7 text-center text-xs text-[var(--color-text-secondary)]">{isEnglish ? 'No subcategories yet.' : 'لا توجد أقسام فرعية حتى الآن.'}</div>
                    ) : null}
                </div>
                ) : null}
            </section>

            <section className="relative overflow-hidden rounded-[1.35rem] border border-violet-400/22 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.96),rgba(139,92,246,0.05))] shadow-[0_20px_46px_-38px_rgba(139,92,246,0.62)]">
                <div className="flex items-center justify-between gap-2 border-b border-violet-400/14 p-3 sm:p-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><Package className="h-4.5 w-4.5" /></span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-violet-700 dark:text-violet-300">03</span>
                                <h2 className="truncate text-sm font-black text-[var(--color-text)] sm:text-base">{isEnglish ? 'Products' : 'المنتجات'}</h2>
                            </div>
                            <p className="mt-0.5 text-[9px] text-[var(--color-text-secondary)] sm:text-[10px]">{isEnglish ? 'Prices, providers, availability and display order.' : 'الأسعار والمزود والحالة وترتيب الظهور.'}</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => openProductModal()} className="h-9 shrink-0 rounded-xl px-3 text-[10px] sm:text-xs"><Plus className="h-3.5 w-3.5" /> {isEnglish ? 'Add' : 'إضافة'}</Button>
                </div>

                <div className="border-b border-violet-400/12 bg-violet-500/[0.025] p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_minmax(140px,0.8fr)_auto] lg:items-end">
                        <div className="col-span-2 lg:col-span-1">
                            <label className="mb-1 block text-[9px] font-bold text-[var(--color-text-secondary)]">{isEnglish ? 'Search products' : 'البحث في المنتجات'}</label>
                            <Input
                                value={productSearchQuery}
                                onChange={(event) => setProductSearchQuery(event.target.value)}
                                placeholder={isEnglish ? 'Product name or provider...' : 'اسم المنتج أو المزود...'}
                                icon={<Search className="h-3.5 w-3.5" />}
                                className="h-9 rounded-xl text-[11px] sm:h-9"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[9px] font-bold text-[var(--color-text-secondary)]">{isEnglish ? 'Category' : 'القسم'}</label>
                            <select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} className={`${selectClassName} h-9 rounded-xl py-0 text-[10px] sm:h-9`}>
                                <option value="all">{isEnglish ? 'All categories' : 'كل الأقسام'}</option>
                                {primaryCategories.map((category) => (
                                    <React.Fragment key={category.id}>
                                        <option value={category.id}>▰ {category.name}</option>
                                        {subcategories
                                            .filter((subcategory) => String(subcategory.parentCategory) === String(category.id))
                                            .map((subcategory) => (
                                                <option key={subcategory.id} value={subcategory.id}>　↳ {subcategory.name}</option>
                                            ))}
                                    </React.Fragment>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-[9px] font-bold text-[var(--color-text-secondary)]">{isEnglish ? 'Connection' : 'نوع الربط'}</label>
                            <select value={productConnectionFilter} onChange={(event) => setProductConnectionFilter(event.target.value)} className={`${selectClassName} h-9 rounded-xl py-0 text-[10px] sm:h-9`}>
                                <option value="all">{isEnglish ? 'All types' : 'كل الأنواع'}</option>
                                <option value="auto">{isEnglish ? 'Automatic' : 'ربط آلي'}</option>
                                <option value="manual">{isEnglish ? 'Manual' : 'ربط يدوي'}</option>
                            </select>
                        </div>

                        <div className="col-span-2 flex h-9 items-center justify-between gap-2 rounded-xl border border-violet-400/14 bg-[color:rgb(var(--color-elevated-rgb)/0.62)] px-2.5 lg:col-span-1 lg:min-w-[9rem]">
                            <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300">{filteredAdminProducts.length} {isEnglish ? 'results' : 'نتيجة'}</span>
                            {hasActiveProductFilters ? (
                                <button type="button" onClick={() => { setProductSearchQuery(''); setProductCategoryFilter('all'); setProductConnectionFilter('all'); }} className="rounded-lg bg-violet-500/9 px-2 py-1 text-[8px] font-bold text-violet-700 transition hover:bg-violet-500/16 dark:text-violet-300">
                                    {isEnglish ? 'Clear' : 'مسح'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:hidden">
                    {filteredAdminProducts.map((product) => {
                        const isUnavailable = product.productStatus !== 'available';
                        const categoryId = String(product?.category?._id || product?.category?.id || product?.category || '').trim();
                        const productCategory = categoryById.get(categoryId);
                        const productParentCategory = productCategory?.parentCategory
                            ? categoryById.get(String(productCategory.parentCategory))
                            : null;
                        const connectionType = String(product?.connectionType || '').trim() || (product?.autoFulfillmentEnabled === false ? 'manual' : 'auto');
                        return (
                            <article key={product.id} className="overflow-hidden rounded-2xl border border-violet-400/16 bg-[color:rgb(var(--color-elevated-rgb)/0.74)] p-2.5">
                                <div className="flex items-start gap-2.5">
                                    <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-violet-400/16 bg-violet-500/7 ${isUnavailable ? 'opacity-65' : ''}`}>
                                        {product.image ? <img src={resolveImageUrl(product.image)} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" style={isUnavailable ? { filter: 'grayscale(100%)' } : {}} /> : <div className="flex h-full w-full items-center justify-center text-violet-500/65"><Package className="h-5 w-5" /></div>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`line-clamp-2 text-xs font-black leading-5 ${isUnavailable ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{product.name || '-'}</h3>
                                            <span className={`shrink-0 rounded-lg px-1.5 py-1 text-[8px] font-bold ${product.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/10 text-[var(--color-muted)]'}`}>{product.status === 'active' ? (isEnglish ? 'Active' : 'نشط') : (isEnglish ? 'Paused' : 'متوقف')}</span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            <span className="rounded-md bg-violet-500/8 px-1.5 py-0.5 text-[8px] font-semibold text-violet-700 dark:text-violet-300">{productParentCategory ? `${productParentCategory.name} ← ${productCategory?.name}` : (productCategory?.name || categoryId || '-')}</span>
                                            <span className="rounded-md bg-[color:rgb(var(--color-border-rgb)/0.24)] px-1.5 py-0.5 text-[8px] text-[var(--color-text-secondary)]">{getProviderDisplayName(product)}</span>
                                            <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-semibold ${connectionType === 'auto' ? 'bg-cyan-500/8 text-cyan-700 dark:text-cyan-300' : 'bg-amber-500/8 text-amber-700 dark:text-amber-300'}`}>{connectionType === 'auto' ? (isEnglish ? 'Automatic' : 'آلي') : (isEnglish ? 'Manual' : 'يدوي')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                                    <div className="rounded-xl bg-violet-500/6 px-2 py-1.5"><p className="text-[8px] text-[var(--color-muted)]">{t('basePrice')}</p><p className="mt-0.5 truncate text-[10px] font-black text-violet-700 dark:text-violet-300">{formatExactDecimal(product.basePriceCoins, language) || product.basePriceCoins || '-'}</p></div>
                                    <div className="rounded-xl bg-[color:rgb(var(--color-border-rgb)/0.18)] px-2 py-1.5"><p className="text-[8px] text-[var(--color-muted)]">{isEnglish ? 'Display order' : 'ترتيب الظهور'}</p><p className="mt-0.5 text-[10px] font-black text-[var(--color-text)]">#{Number(product?.displayOrder || 0)}</p></div>
                                </div>

                                {isUnavailable ? <p className="mt-2 rounded-lg bg-rose-500/8 px-2 py-1 text-center text-[8px] font-bold text-rose-600 dark:text-rose-300">{isEnglish ? 'Currently unavailable' : 'غير متوفر حاليًا'}</p> : null}

                                <div className="mt-2.5 flex items-center gap-1.5 border-t border-violet-400/10 pt-2">
                                    <button type="button" onClick={() => openProductModal(product)} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500/10 text-[9px] font-black text-violet-700 transition hover:bg-violet-500/18 dark:text-violet-300"><Edit className="h-3.5 w-3.5" />{isEnglish ? 'Edit product' : 'تعديل المنتج'}</button>
                                    <button type="button" onClick={() => handleToggleProductStatus(product)} disabled={togglingProductId === product.id} className={`flex h-8 w-9 items-center justify-center rounded-lg transition disabled:opacity-50 ${product.status === 'active' ? 'bg-amber-500/9 text-amber-700 hover:bg-amber-500/17 dark:text-amber-300' : 'bg-emerald-500/9 text-emerald-700 hover:bg-emerald-500/17 dark:text-emerald-300'}`} title={product.status === 'active' ? (isEnglish ? 'Pause product' : 'إيقاف المنتج') : (isEnglish ? 'Activate product' : 'تفعيل المنتج')} aria-label={product.status === 'active' ? (isEnglish ? 'Pause product' : 'إيقاف المنتج') : (isEnglish ? 'Activate product' : 'تفعيل المنتج')}>{togglingProductId === product.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}</button>
                                    <button type="button" onClick={() => deleteProduct(product.id)} className="flex h-8 w-9 items-center justify-center rounded-lg bg-rose-500/8 text-rose-600 transition hover:bg-rose-500/16 dark:text-rose-300" aria-label={isEnglish ? 'Delete product' : 'حذف المنتج'}><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </article>
                        );
                    })}
                    {!filteredAdminProducts.length ? <div className="col-span-full rounded-2xl border border-dashed border-violet-400/22 py-8 text-center text-xs text-[var(--color-text-secondary)]">{hasActiveProductFilters ? (isEnglish ? 'No products match these filters.' : 'لا توجد منتجات مطابقة للفلاتر.') : (isEnglish ? 'No products yet.' : 'لا توجد منتجات حتى الآن.')}</div> : null}
                </div>

                <div className="hidden p-4 lg:block">
                    <Table className="min-w-[880px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('products')}</TableHead>
                                <TableHead className="text-center">{isEnglish ? 'Provider' : 'المزود'}</TableHead>
                                <TableHead className="text-center">{t('category') || 'القسم'}</TableHead>
                                <TableHead className="text-center">{isEnglish ? 'Order' : 'الترتيب'}</TableHead>
                                <TableHead className="text-center">{t('basePrice')}</TableHead>
                                <TableHead className="text-center">{t('common.status', { defaultValue: 'الحالة' })}</TableHead>
                                <TableHead className="text-end">{t('actions') || 'الإجراءات'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAdminProducts.map((product) => {
                                const isUnavailable = product.productStatus !== 'available';
                                const categoryId = String(product?.category?._id || product?.category?.id || product?.category || '').trim();
                                const productCategory = categoryById.get(categoryId);
                                const productParentCategory = productCategory?.parentCategory
                                    ? categoryById.get(String(productCategory.parentCategory))
                                    : null;
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell><div className="flex items-center gap-3"><div className={`relative h-10 w-10 overflow-hidden rounded-xl bg-violet-500/7 ${isUnavailable ? 'opacity-60' : ''}`}>{product.image ? <img src={resolveImageUrl(product.image)} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" style={isUnavailable ? { filter: 'grayscale(100%)' } : {}} /> : <div className="flex h-full w-full items-center justify-center text-violet-500/60"><Package className="h-4 w-4" /></div>}</div><div className="min-w-0"><div className={`max-w-[16rem] truncate font-bold ${isUnavailable ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{product.name}</div>{isUnavailable ? <div className="text-[10px] font-semibold text-rose-500">{isEnglish ? 'Unavailable' : 'غير متوفر'}</div> : null}</div></div></TableCell>
                                        <TableCell className="text-center"><Badge variant="outline">{getProviderDisplayName(product)}</Badge></TableCell>
                                        <TableCell className="text-center"><Badge variant="outline">{productParentCategory ? `${productParentCategory.name} ← ${productCategory?.name}` : (productCategory?.name || categoryId || '-')}</Badge></TableCell>
                                        <TableCell className="text-center"><Badge variant="outline">{Number(product?.displayOrder || 0)}</Badge></TableCell>
                                        <TableCell className="text-center font-bold text-violet-700 dark:text-violet-300">{formatExactDecimal(product.basePriceCoins, language) || product.basePriceCoins || '-'}</TableCell>
                                        <TableCell className="text-center"><Badge variant={product.status === 'active' ? 'success' : 'secondary'}>{product.status}</Badge></TableCell>
                                        <TableCell className="text-end"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="text-violet-700 dark:text-violet-300" onClick={() => openProductModal(product)}><Edit className="h-4 w-4" /><span className="text-xs">{isEnglish ? 'Edit' : 'تعديل'}</span></Button><Button size="sm" variant="ghost" className={product.status === 'active' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'} onClick={() => handleToggleProductStatus(product)} disabled={togglingProductId === product.id} title={product.status === 'active' ? (isEnglish ? 'Pause product' : 'إيقاف المنتج') : (isEnglish ? 'Activate product' : 'تفعيل المنتج')}>{togglingProductId === product.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}</Button><Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-300" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                                    </TableRow>
                                );
                            })}
                            {!filteredAdminProducts.length ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-[var(--color-text-secondary)]">{hasActiveProductFilters ? (isEnglish ? 'No products match these filters.' : 'لا توجد منتجات مطابقة للفلاتر.') : (isEnglish ? 'No products yet.' : 'لا توجد منتجات حتى الآن.')}</TableCell></TableRow> : null}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => !isSavingCategory && setIsCategoryModalOpen(false)}
                title={editingCategory
                    ? (isEnglish ? 'Edit Category' : 'تعديل القسم')
                    : categoryForm.parentCategory
                        ? (isEnglish ? 'Add Subcategory' : 'إضافة قسم فرعي')
                        : (isEnglish ? 'Add Main Category' : 'إضافة قسم رئيسي')}
            >
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                        <Input
                            label={isEnglish ? 'English Name' : 'الاسم بالإنجليزية'}
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder={isEnglish ? 'Example: Games' : 'مثال: Games'}
                        />
                    </div>

                    <Input
                        label={isEnglish ? 'Display Order (number)' : 'ترتيب العرض (رقم)'}
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                        placeholder={isEnglish ? 'Example: 1' : 'مثال: 1'}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{isEnglish ? 'Parent Category (optional)' : 'القسم الرئيسي (اختياري)'}</label>
                        <select
                            className={`${selectClassName} h-11 dark:[color-scheme:dark]`}
                            value={categoryForm.parentCategory}
                            onChange={(e) => setCategoryForm((prev) => ({ ...prev, parentCategory: e.target.value }))}
                        >
                            <option value="">{isEnglish ? '— None (Top Level) —' : '— بدون (قسم رئيسي) —'}</option>
                            {primaryCategories
                                .filter((c) => c.id !== editingCategory?.id)
                                .map((c) => (
                                    <option key={c.id} value={c.id} className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
                                        {c.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{isEnglish ? 'Category Image (upload)' : 'صورة القسم (رفع)'}</label>
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800/50">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setCategoryForm, 'categories')} className="hidden" id="category-image-upload" />
                            <label htmlFor="category-image-upload" className="flex cursor-pointer flex-col items-center gap-2">
                                {categoryForm.image
                                    ? <img src={resolveImageUrl(categoryForm.image)} alt="preview" decoding="async" referrerPolicy="no-referrer" className="h-32 rounded object-contain" />
                                    : <><ImageIcon className="h-8 w-8 text-gray-400" /><span className="text-sm text-gray-500">{isEnglish ? 'Click to upload' : 'اضغط لرفع الصورة'}</span></>
                                }
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCategoryModalOpen(false)} disabled={isSavingCategory}>
                            {isEnglish ? 'Cancel' : 'إلغاء'}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSavingCategory}>
                            {editingCategory ? (isEnglish ? 'Save' : 'حفظ') : (isEnglish ? 'Add' : 'إضافة')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isProductModalOpen} onClose={() => !isSavingProduct && setIsProductModalOpen(false)} title={editingProduct ? t('editProduct') : t('addProduct')} size="xl">
                <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.65)] bg-[color:rgb(var(--color-elevated-rgb)/0.58)] p-2.5 sm:p-3">
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {[
                                { id: 1, title: isEnglish ? 'Basics' : 'الأساسيات', description: isEnglish ? 'Name and image' : 'الاسم والصورة', activeClass: 'border-amber-400/35 bg-amber-500/10 text-amber-700 dark:text-amber-300', iconClass: 'bg-amber-500 text-white' },
                                { id: 2, title: isEnglish ? 'Pricing' : 'الربط والسعر', description: isEnglish ? 'Provider and limits' : 'المزود والكميات', activeClass: 'border-cyan-400/30 bg-cyan-500/9 text-cyan-700 dark:text-cyan-300', iconClass: 'bg-cyan-500 text-white' },
                                { id: 3, title: isEnglish ? 'Fields' : 'الحقول والحفظ', description: isEnglish ? 'Order details' : 'بيانات الطلب', activeClass: 'border-violet-400/30 bg-violet-500/9 text-violet-700 dark:text-violet-300', iconClass: 'bg-violet-500 text-white' },
                            ].map((step) => {
                                const isActive = productModalStep === step.id;
                                const isComplete = productModalStep > step.id;
                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => setProductModalStep(step.id)}
                                        className={`flex min-w-0 items-center gap-1.5 rounded-xl border p-1.5 text-start transition sm:gap-2 sm:p-2 ${isActive ? step.activeClass : 'border-transparent bg-[color:rgb(var(--color-card-rgb)/0.48)] text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-border-rgb)/0.65)]'}`}
                                    >
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black shadow-sm sm:h-8 sm:w-8 ${isActive || isComplete ? step.iconClass : 'bg-[color:rgb(var(--color-border-rgb)/0.42)] text-[var(--color-muted)]'}`}>
                                            {isComplete ? <Check className="h-3.5 w-3.5" /> : step.id}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-[9px] font-black sm:text-[11px]">{step.title}</span>
                                            <span className="hidden truncate text-[8px] opacity-70 sm:block">{step.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color:rgb(var(--color-border-rgb)/0.32)]">
                            <span className="block h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#06b6d4,#8b5cf6)] transition-all duration-300" style={{ width: `${(productModalStep / 3) * 100}%` }} />
                        </div>
                    </div>

                    {/* ========== 1. المعلومات الأساسية ========== */}
                    {productModalStep === 1 ? (
                    <div className="animate-[fade-in_180ms_ease-out]">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-black text-[var(--color-text)] sm:text-lg">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-xs font-black text-white">1</span>
                            {isEnglish ? 'Basic information' : 'المعلومات الأساسية'}
                        </h3>
                        <div className="space-y-3 rounded-2xl border border-amber-400/22 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.95),rgba(245,158,11,0.045))] p-3 sm:p-4">
                            <Input label="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                            <Input label="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">القسم</label>
                                <select
                                    className={`${selectClassName} h-11 dark:[color-scheme:dark]`}
                                    value={productForm.category}
                                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                >
                                    {primaryCategories.map((category) => (
                                        <React.Fragment key={category.id}>
                                            <option value={category.id} className="bg-white font-semibold text-gray-900 dark:bg-gray-950 dark:text-white">▰ {category.name}</option>
                                            {subcategories
                                                .filter((subcategory) => String(subcategory.parentCategory) === String(category.id))
                                                .map((subcategory) => (
                                                    <option key={subcategory.id} value={subcategory.id} className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">　↳ {subcategory.name}</option>
                                                ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label={isEnglish ? 'Display Order (number)' : 'ترتيب العرض (رقم)'}
                                type="number"
                                value={productForm.displayOrder}
                                onChange={(e) => setProductForm({ ...productForm, displayOrder: e.target.value })}
                                placeholder={isEnglish ? 'Example: 10' : 'مثال: 10'}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">صورة المنتج (رفع)</label>
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800/50">
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductForm)} className="hidden" id="product-image-upload" />
                                    <label htmlFor="product-image-upload" className="flex cursor-pointer flex-col items-center gap-2">
                                        {productForm.image ? <img src={resolveImageUrl(productForm.image)} alt="معاينة" decoding="async" referrerPolicy="no-referrer" className="h-32 rounded object-contain" /> : <><ImageIcon className="h-8 w-8 text-gray-400" /><span className="text-sm text-gray-500">اضغط لرفع الصورة</span></>}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    ) : null}

                    {/* ========== 2. الكمية والتسعير ========== */}
                    {productModalStep === 2 ? (
                    <div className="animate-[fade-in_180ms_ease-out]">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-black text-[var(--color-text)] sm:text-lg">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500 text-xs font-black text-white">2</span>
                            {isEnglish ? 'Connection and pricing' : 'الربط والتسعير'}
                        </h3>
                        <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.95),rgba(6,182,212,0.04))] p-3 sm:p-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع الربط</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'manual', label: isEnglish ? 'Manual' : 'يدوي' },
                                        { value: 'auto', label: isEnglish ? 'Automatic' : 'آلي' },
                                    ].map((option) => {
                                        const isSelected = productForm.connectionType === option.value;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setProductForm((prev) => ({
                                                    ...prev,
                                                    connectionType: option.value,
                                                    autoFulfillmentEnabled: option.value === 'auto',
                                                    syncPriceWithProvider: option.value === 'auto' ? prev.syncPriceWithProvider : false,
                                                    externalPricingMode: option.value === 'auto' ? prev.externalPricingMode : 'use_local_price',
                                                    costPrice: option.value === 'manual' ? prev.costPrice : '',
                                                }))}
                                                className={`h-11 rounded-[0.95rem] border px-3 text-sm font-semibold transition-all ${
                                                    isSelected
                                                        ? 'border-[color:rgb(var(--color-primary-rgb)/0.42)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)] shadow-[0_14px_28px_-24px_rgb(var(--color-primary-rgb)/0.48)]'
                                                        : 'border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.9)] text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.06)]'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {productForm.connectionType === 'auto' ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اختر المورد</label>
                                    <select
                                        className={`${selectClassName} h-11 dark:[color-scheme:dark]`}
                                        value={productForm.supplierId || productForm.providerId}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Fix 1: Full price reset — clear ALL price-related fields
                                            // when provider changes to prevent stale prices from
                                            // Provider B bleeding into Provider A's context.
                                            setProductForm((prev) => ({
                                                ...prev,
                                                supplierId: value,
                                                providerId: value,
                                                externalProductId: '',
                                                providerProductId: '',
                                                externalProductName: '',
                                                syncedProviderBasePrice: '',
                                                originalPriceCoins: '',
                                                basePriceCoins: '',
                                                enableManualPrice: false,
                                                manualPriceAdjustment: '',
                                                syncPriceWithProvider: value ? prev.syncPriceWithProvider : false,
                                            }));
                                        }}
                                    >
                                        <option value="" className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">اختر المزود</option>
                                        {activeProviders.map((provider) => (
                                            <option key={provider.id} value={provider.id} className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">{provider.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اختر المنتج من المورد</label>
                                    <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[color:rgb(var(--color-card-rgb)/0.92)] p-3 shadow-[var(--shadow-subtle)]">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-elevated-rgb)/0.74)] p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                                                        {selectedProviderProduct?.name || (isEnglish ? 'No provider product selected yet' : 'لم يتم اختيار منتج من المورد بعد')}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                                                        {getProviderProductPriceValue(selectedProviderProduct)
                                                            ? formatProviderProductPrice(getProviderProductPriceValue(selectedProviderProduct), language)
                                                            : (isEnglish ? 'Choose a supplier first, then select a product' : 'اختر المورد أولاً ثم اختر المنتج المناسب')}
                                                    </p>
                                                    {selectedProviderProduct ? (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {getProviderProductMinQtyValue(selectedProviderProduct) ? (
                                                                <Badge variant="secondary">
                                                                    {isEnglish ? 'Min:' : 'الحد الأدنى:'} {getProviderProductMinQtyValue(selectedProviderProduct)}
                                                                </Badge>
                                                            ) : null}
                                                            {getProviderProductMaxQtyValue(selectedProviderProduct) ? (
                                                                <Badge variant="secondary">
                                                                    {isEnglish ? 'Max:' : 'الحد الأقصى:'} {getProviderProductMaxQtyValue(selectedProviderProduct)}
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {selectedSupplierId ? (
                                                <>
                                                    <div className="relative">
                                                        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                                                        <input
                                                            type="text"
                                                            value={providerProductQuery}
                                                            onChange={(e) => setProviderProductQuery(e.target.value)}
                                                            placeholder={isEnglish ? 'Search supplier products by name' : 'ابحث داخل منتجات المورد بالاسم'}
                                                            className={`${inputBaseClassName} h-11 pr-10`}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 px-1 text-xs text-[var(--color-muted)]">
                                                        <span>
                                                            {isEnglish ? `${filteredProviderProducts.length} products found` : `${filteredProviderProducts.length} منتج متاح`}
                                                        </span>
                                                        {selectedProviderProduct ? (
                                                            <span className="truncate text-[var(--color-primary)]">
                                                                {isEnglish ? `Selected: ${selectedProviderProduct.name}` : `المحدد: ${selectedProviderProduct.name}`}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                                        {filteredProviderProducts.length ? filteredProviderProducts.map((providerProduct) => {
                                                            const isSelected = hasMatchingProviderProduct(
                                                                providerProduct,
                                                                productForm.providerProductId,
                                                                productForm.externalProductId
                                                            );
                                                            const providerPrice = formatProviderProductPrice(getProviderProductPriceValue(providerProduct), language);

                                                            return (
                                                                <button
                                                                    key={providerProduct.id}
                                                                    type="button"
                                                                    onClick={() => handleProviderProductSelect(providerProduct.id)}
                                                                    className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-start transition-all ${
                                                                        isSelected
                                                                            ? 'border-[color:rgb(var(--color-primary-rgb)/0.4)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] shadow-[0_14px_28px_-24px_rgb(var(--color-primary-rgb)/0.55)]'
                                                                            : 'border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.88)] hover:border-[color:rgb(var(--color-primary-rgb)/0.28)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.06)]'
                                                                    }`}
                                                                >
                                                                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                                                        isSelected
                                                                            ? 'border-[color:rgb(var(--color-primary-rgb)/0.34)] bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]'
                                                                            : 'border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[color:rgb(var(--color-elevated-rgb)/0.88)] text-[var(--color-text-secondary)]'
                                                                    }`}>
                                                                        <Package className="h-4 w-4" />
                                                                    </span>

                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{providerProduct.name || providerProduct.id}</p>
                                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                                            {providerPrice ? (
                                                                                <Badge variant="info" className="px-2 py-0.5">
                                                                                    {providerPrice}
                                                                                </Badge>
                                                                            ) : null}
                                                                            {getProviderProductMinQtyValue(providerProduct) ? (
                                                                                <Badge variant="secondary" className="px-2 py-0.5">
                                                                                    {isEnglish ? 'Min' : 'من'} {getProviderProductMinQtyValue(providerProduct)}
                                                                                </Badge>
                                                                            ) : null}
                                                                            {getProviderProductMaxQtyValue(providerProduct) ? (
                                                                                <Badge variant="secondary" className="px-2 py-0.5">
                                                                                    {isEnglish ? 'Max' : 'إلى'} {getProviderProductMaxQtyValue(providerProduct)}
                                                                                </Badge>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>

                                                                    {isSelected ? (
                                                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.16)] text-[var(--color-primary)]">
                                                                            <Check className="h-4 w-4" />
                                                                        </span>
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        }) : (
                                                            <div className="rounded-[var(--radius-md)] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[color:rgb(var(--color-elevated-rgb)/0.68)] px-4 py-5 text-center text-sm text-[var(--color-text-secondary)]">
                                                                {isEnglish ? 'No matching supplier products were found.' : 'لا توجد منتجات مطابقة لهذا البحث.'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="rounded-[var(--radius-md)] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.92)] bg-[color:rgb(var(--color-elevated-rgb)/0.68)] px-4 py-5 text-center text-sm text-[var(--color-text-secondary)]">
                                                    {isEnglish ? 'Select a supplier first to load its products here.' : 'اختر المورد أولاً حتى تظهر منتجاته هنا بشكل منظم.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : null}

                            {productForm.connectionType === 'auto' ? (
                            <>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(productForm.autoFulfillmentEnabled)}
                                        onChange={(e) => setProductForm({ ...productForm, autoFulfillmentEnabled: e.target.checked })}
                                    />
                                    autoFulfillmentEnabled
                                </label>

                            </>
                            ) : null}

                            {productForm.connectionType === 'auto' ? (
                            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(productForm.syncPriceWithProvider)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setProductForm((prev) => {
                                                    const nextForm = {
                                                        ...prev,
                                                        syncPriceWithProvider: checked,
                                                        externalPricingMode: checked
                                                            ? 'use_supplier_price'
                                                            : (usesProviderPricingMode(prev.externalPricingMode) ? 'use_local_price' : prev.externalPricingMode),
                                                    };
                                                    if (!checked || !selectedProviderProduct) {
                                                        return nextForm;
                                                    }
                                                    return {
                                                        ...nextForm,
                                                        ...buildProviderSyncSnapshot(selectedProviderProduct, {
                                                            enableManualPrice: prev.enableManualPrice,
                                                            manualPriceAdjustment: prev.manualPriceAdjustment,
                                                            fallbackMinQty: prev.minimumOrderQty,
                                                            fallbackMaxQty: prev.maximumOrderQty,
                                                        }),
                                                    };
                                                });
                                            }}
                                        />
                                        مزامنة السعر والحدود من المورد
                                    </label>

                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(productForm.enableManualPrice)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setProductForm((prev) => {
                                                    const nextManualPriceAdjustment = checked ? prev.manualPriceAdjustment : '';
                                                    const nextForm = {
                                                        ...prev,
                                                        enableManualPrice: checked,
                                                        manualPriceAdjustment: nextManualPriceAdjustment,
                                                    };
                                                    if (!prev.syncPriceWithProvider) {
                                                        return nextForm;
                                                    }
                                                    const syncSource = selectedProviderProduct || {
                                                        rawPrice: prev.syncedProviderBasePrice,
                                                        minQty: prev.minimumOrderQty,
                                                        maxQty: prev.maximumOrderQty,
                                                    };
                                                    return {
                                                        ...nextForm,
                                                        ...buildProviderSyncSnapshot(syncSource, {
                                                            enableManualPrice: checked,
                                                            manualPriceAdjustment: nextManualPriceAdjustment,
                                                            fallbackMinQty: prev.minimumOrderQty,
                                                            fallbackMaxQty: prev.maximumOrderQty,
                                                        }),
                                                    };
                                                });
                                            }}
                                            disabled={!productForm.syncPriceWithProvider}
                                        />
                                        إضافة سعر يدوي
                                    </label>
                                </div>

                                <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                                    {isSyncingPrice ? (
                                        <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[var(--color-primary)]" />
                                    ) : (
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                                    )}
                                    <span>
                                        {isEnglish
                                            ? 'Price, minimum, and maximum quantities are refreshed automatically from the linked supplier when you pick a product and again before saving.'
                                            : 'السعر والحد الأدنى والحد الأقصى يتم تحديثهم تلقائيًا من المورد المرتبط عند اختيار المنتج، ثم تتم مراجعتهم مرة أخرى قبل الحفظ.'}
                                    </span>
                                </div>

                                {productForm.syncPriceWithProvider && productForm.enableManualPrice ? (
                                    <div className="mt-3">
                                        <Input
                                            label="Manual Price Add (+/-)"
                                            type="text"
                                            inputMode="decimal"
                                            value={productForm.manualPriceAdjustment}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setProductForm((prev) => {
                                                    const nextForm = { ...prev, manualPriceAdjustment: value };
                                                    if (!prev.syncPriceWithProvider) {
                                                        return nextForm;
                                                    }
                                                    const syncSource = selectedProviderProduct || {
                                                        rawPrice: prev.syncedProviderBasePrice,
                                                        minQty: prev.minimumOrderQty,
                                                        maxQty: prev.maximumOrderQty,
                                                    };
                                                    return {
                                                        ...nextForm,
                                                        ...buildProviderSyncSnapshot(syncSource, {
                                                            enableManualPrice: prev.enableManualPrice,
                                                            manualPriceAdjustment: value,
                                                            fallbackMinQty: prev.minimumOrderQty,
                                                            fallbackMaxQty: prev.maximumOrderQty,
                                                        }),
                                                    };
                                                });
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                            ) : null}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Input
                                    label="الحد الأدنى للطلب (Qty)"
                                    type="number"
                                    value={productForm.minimumOrderQty}
                                    onChange={(e) => setProductForm({ ...productForm, minimumOrderQty: e.target.value })}
                                    readOnly={Boolean(canSyncWithProvider)}
                                    disabled={Boolean(canSyncWithProvider)}
                                    required
                                />
                                <Input
                                    label="الحد الأقصى للطلب (Qty)"
                                    type="number"
                                    value={productForm.maximumOrderQty}
                                    onChange={(e) => setProductForm({ ...productForm, maximumOrderQty: e.target.value })}
                                    readOnly={Boolean(canSyncWithProvider)}
                                    disabled={Boolean(canSyncWithProvider)}
                                    required
                                />
                                <div className="w-full space-y-3">
                                    {productForm.connectionType === 'manual' ? (
                                        <Input
                                            label={isEnglish ? 'Original Price' : 'السعر الأصلي'}
                                            type="text"
                                            inputMode="decimal"
                                            value={productForm.originalPriceCoins}
                                            onChange={(e) => setProductForm({ ...productForm, originalPriceCoins: e.target.value })}
                                            suffix={(
                                                <span className="text-xs font-semibold text-[var(--color-muted)]">
                                                    {isEnglish ? 'USD' : 'دولار'}
                                                </span>
                                            )}
                                        />
                                    ) : null}
                                    <Input
                                        label={isEnglish ? 'Final Price' : 'السعر النهائي'}
                                        type="text"
                                        inputMode="decimal"
                                        value={productForm.basePriceCoins}
                                        onChange={(e) => setProductForm({ ...productForm, basePriceCoins: e.target.value })}
                                        readOnly={Boolean(canSyncWithProvider)}
                                        disabled={Boolean(canSyncWithProvider)}
                                        required
                                        suffix={(
                                            <span className="text-xs font-semibold text-[var(--color-muted)]">
                                                {isEnglish ? 'USD' : 'دولار'}
                                            </span>
                                        )}
                                    />
                                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                                        {canSyncWithProvider
                                            ? (isEnglish ? 'This final price is synced automatically from the pricing settings above.' : 'هذا السعر النهائي يتم تحديثه تلقائيًا من إعدادات التسعير الموجودة بالأعلى.')
                                            : productForm.syncPriceWithProvider
                                                ? (isEnglish ? 'Sync is enabled, but supplier/product is not selected yet. You can still enter a local final price.' : 'المزامنة مفعلة، لكن لم يتم اختيار المورد/منتج المورد بعد. يمكنك إدخال السعر النهائي يدويًا.')
                                                : (isEnglish ? 'Enter the final price here when the product is not linked to a supplier.' : 'أدخل السعر النهائي هنا عندما لا يكون المنتج مربوطًا بمورد.')}
                                    </p>
                                </div>
                            </div>

                            {selectedProviderProduct ? (
                                <div className="flex flex-wrap gap-2">
                                    {getProviderProductPriceValue(selectedProviderProduct) ? (
                                        <Badge variant="info">
                                            {isEnglish ? 'Supplier Price:' : 'سعر المورد:'} {formatProviderProductPrice(getProviderProductPriceValue(selectedProviderProduct), language)}
                                        </Badge>
                                    ) : null}
                                    {getProviderProductMinQtyValue(selectedProviderProduct) ? (
                                        <Badge variant="secondary">
                                            {isEnglish ? 'Min:' : 'الحد الأدنى:'} {getProviderProductMinQtyValue(selectedProviderProduct)}
                                        </Badge>
                                    ) : null}
                                    {getProviderProductMaxQtyValue(selectedProviderProduct) ? (
                                        <Badge variant="secondary">
                                            {isEnglish ? 'Max:' : 'الحد الأقصى:'} {getProviderProductMaxQtyValue(selectedProviderProduct)}
                                        </Badge>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    ) : null}

                    {/* ========== 3. الحقول الديناميكية ========== */}
                    {productModalStep === 3 ? (
                    <>
                    <div className="animate-[fade-in_180ms_ease-out]">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-black text-[var(--color-text)] sm:text-lg">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500 text-xs font-black text-white">3</span>
                            {isEnglish ? 'Order fields and save' : 'الحقول والحفظ'}
                        </h3>
                        <div className="space-y-4 rounded-2xl border border-violet-400/20 bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.95),rgba(139,92,246,0.04))] p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">إدارة حقول الطلب</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">هذه الحقول تظهر للعميل في نموذج شراء المنتج.</p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setProductForm((prev) => ({
                                        ...prev,
                                        dynamicFields: [
                                            ...(prev.dynamicFields || []),
                                            { name: '', label: '', type: 'text', required: true },
                                        ],
                                    }))}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    إضافة حقل
                                </Button>
                            </div>

                            {(productForm.dynamicFields || []).length > 0 ? (
                                <div className="space-y-2">
                                    {(productForm.dynamicFields || []).map((item, index) => (
                                        <div
                                            key={`${item?.name || 'dynamic'}-${index}`}
                                            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40 sm:grid-cols-2 md:grid-cols-12 md:items-end"
                                        >
                                            {/* العنوان (Label) */}
                                            <div className="sm:col-span-1 md:col-span-3">
                                                <Input
                                                    label="العنوان"
                                                    placeholder="مثال: رقم اللاعب"
                                                    value={item.label || ''}
                                                    onChange={(e) => setProductForm((prev) => ({
                                                        ...prev,
                                                        dynamicFields: (prev.dynamicFields || []).map((row, rowIndex) => (
                                                            rowIndex === index ? { ...row, label: e.target.value } : row
                                                        )),
                                                    }))}
                                                />
                                            </div>

                                            {/* الاسم البرمجي (Name / Key) */}
                                            <div className="sm:col-span-1 md:col-span-3">
                                                <Input
                                                    label="الاسم البرمجي"
                                                    placeholder="مثال: player_id"
                                                    value={item.name || ''}
                                                    onChange={(e) => {
                                                        const sanitized = e.target.value.replace(/\s/g, '_');
                                                        setProductForm((prev) => ({
                                                            ...prev,
                                                            dynamicFields: (prev.dynamicFields || []).map((row, rowIndex) => (
                                                                rowIndex === index ? { ...row, name: sanitized } : row
                                                            )),
                                                        }));
                                                    }}
                                                />
                                            </div>

                                            {/* النوع (Type) */}
                                            <div className="sm:col-span-1 md:col-span-3">
                                                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">
                                                    النوع
                                                </label>
                                                <select
                                                    value={item.type || 'text'}
                                                    onChange={(e) => setProductForm((prev) => ({
                                                        ...prev,
                                                        dynamicFields: (prev.dynamicFields || []).map((row, rowIndex) => (
                                                            rowIndex === index ? { ...row, type: e.target.value } : row
                                                        )),
                                                    }))}
                                                    className={selectClassName}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="email">Email</option>
                                                </select>
                                            </div>

                                            {/* مطلوب (Required) */}
                                            <label className="inline-flex cursor-pointer items-center gap-2 self-end pb-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 sm:col-span-1 md:col-span-2">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(item.required)}
                                                    onChange={(e) => setProductForm((prev) => ({
                                                        ...prev,
                                                        dynamicFields: (prev.dynamicFields || []).map((row, rowIndex) => (
                                                            rowIndex === index ? { ...row, required: e.target.checked } : row
                                                        )),
                                                    }))}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                                                />
                                                مطلوب
                                            </label>

                                            {/* حذف (Delete) */}
                                            <div className="flex items-end pb-0.5 md:col-span-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full"
                                                    onClick={() => setProductForm((prev) => ({
                                                        ...prev,
                                                        dynamicFields: (prev.dynamicFields || []).filter((_, rowIndex) => rowIndex !== index),
                                                    }))}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">لا توجد حقول ديناميكية بعد. اضغط "إضافة حقل".</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.07),rgb(var(--color-elevated-rgb)/0.72))] p-3 sm:p-4">
                        {(() => {
                            const selectedCategory = categoryById.get(String(productForm.category));
                            const selectedParent = selectedCategory?.parentCategory
                                ? categoryById.get(String(selectedCategory.parentCategory))
                                : null;
                            const categoryPath = selectedParent
                                ? `${selectedParent.name} ← ${selectedCategory?.name}`
                                : (selectedCategory?.name || '-');
                            return (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/12 text-violet-700 dark:text-violet-300"><Check className="h-4 w-4" /></span>
                                        <div>
                                            <h4 className="text-xs font-black text-[var(--color-text)]">{isEnglish ? 'Review before saving' : 'مراجعة قبل الحفظ'}</h4>
                                            <p className="text-[9px] text-[var(--color-text-secondary)]">{isEnglish ? 'All information will be saved together.' : 'سيتم حفظ كل المعلومات معًا.'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl bg-[color:rgb(var(--color-card-rgb)/0.66)] p-2"><p className="text-[8px] text-[var(--color-muted)]">{isEnglish ? 'Product' : 'المنتج'}</p><p className="mt-1 truncate text-[10px] font-black text-[var(--color-text)]">{productForm.name || '-'}</p></div>
                                        <div className="rounded-xl bg-[color:rgb(var(--color-card-rgb)/0.66)] p-2"><p className="text-[8px] text-[var(--color-muted)]">{isEnglish ? 'Category' : 'القسم'}</p><p className="mt-1 truncate text-[10px] font-black text-[var(--color-text)]">{categoryPath}</p></div>
                                        <div className="rounded-xl bg-[color:rgb(var(--color-card-rgb)/0.66)] p-2"><p className="text-[8px] text-[var(--color-muted)]">{isEnglish ? 'Connection' : 'نوع الربط'}</p><p className="mt-1 text-[10px] font-black text-cyan-700 dark:text-cyan-300">{productForm.connectionType === 'manual' ? (isEnglish ? 'Manual' : 'يدوي') : (isEnglish ? 'Automatic' : 'آلي')}</p></div>
                                        <div className="rounded-xl bg-[color:rgb(var(--color-card-rgb)/0.66)] p-2"><p className="text-[8px] text-[var(--color-muted)]">{isEnglish ? 'Final price' : 'السعر النهائي'}</p><p className="mt-1 truncate text-[10px] font-black text-violet-700 dark:text-violet-300">{formatExactDecimal(productForm.basePriceCoins, language) || productForm.basePriceCoins || '-'}</p></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    </>
                    ) : null}

                    <div className="flex flex-col-reverse gap-2 border-t border-[color:rgb(var(--color-border-rgb)/0.55)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button type="button" variant="ghost" onClick={() => setIsProductModalOpen(false)} disabled={isSavingProduct} className="h-10 sm:min-w-[6rem]">{isEnglish ? 'Cancel' : 'إلغاء'}</Button>
                        <div className="flex gap-2">
                            {productModalStep > 1 ? (
                                <Button type="button" variant="secondary" onClick={() => setProductModalStep((current) => Math.max(1, current - 1))} disabled={isSavingProduct} className="h-10 flex-1 sm:min-w-[7rem]">
                                    {isEnglish ? 'Previous' : 'السابق'}
                                </Button>
                            ) : null}
                            {productModalStep < 3 ? (
                                <Button type="button" variant="outline" onClick={() => setProductModalStep((current) => Math.min(3, current + 1))} disabled={isSavingProduct} className="h-10 flex-1 px-3 text-xs sm:min-w-[7rem]">
                                    {isEnglish ? 'Next' : 'التالي'}
                                </Button>
                            ) : null}
                            <Button type="submit" disabled={isSavingProduct} className="h-10 flex-1 px-3 text-xs sm:min-w-[8rem]">
                                {isSavingProduct ? (isEnglish ? 'Saving...' : 'جارٍ الحفظ...') : (isEnglish ? 'Save product' : 'حفظ المنتج')}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={Boolean(categoryToDelete)}
                title={isEnglish ? 'Delete category?' : 'حذف القسم'}
                description={categoryToDelete ? (
                    isEnglish
                        ? `Delete ${String(categoryToDelete?.name || categoryToDelete?.nameAr || 'this category').trim()}?`
                        : `حذف ${String(categoryToDelete?.nameAr || categoryToDelete?.name || 'هذا القسم').trim()}؟`
                ) : ''}
                confirmLabel={isEnglish ? 'Delete' : 'حذف'}
                cancelLabel={isEnglish ? 'Cancel' : 'إلغاء'}
                onConfirm={confirmDeleteCategory}
                onCancel={() => setCategoryToDelete(null)}
                isLoading={isSavingCategory}
            />

        </div>
    );
};

export default AdminProducts;
