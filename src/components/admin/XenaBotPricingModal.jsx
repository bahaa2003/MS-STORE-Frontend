import React, { useEffect, useMemo, useState } from 'react';
import { Bot, CircleDollarSign, Loader2, PackagePlus } from 'lucide-react';
import apiClient from '../../services/client';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

const XENA_PROVIDER_CODE = 'xena-recharge';
const defaultForm = {
  supplierId: '',
  name: 'Xena Dynamic Recharge (Any Amount)',
  unitPrice: '',
  minAmount: '1',
  maxAmount: '1000000',
};

const isXenaSupplier = (supplier = {}) => String(
  supplier.supplierCode || supplier.code || supplier.providerCode || supplier.slug || ''
).trim().toLowerCase() === XENA_PROVIDER_CODE;

const normalizeConfig = (config = {}, supplierId = '') => ({
  supplierId,
  name: String(config.name || defaultForm.name),
  unitPrice: String(config.providerUnitPrice ?? config.unitPrice ?? ''),
  minAmount: String(config.minAmount ?? defaultForm.minAmount),
  maxAmount: String(config.maxAmount ?? defaultForm.maxAmount),
});

const validateForm = (form) => {
  if (!form.supplierId) return 'اختر المورد المرتبط بالمنتج.';
  if (!form.name.trim()) return 'أدخل اسم المنتج.';
  if (!/^(?:\d+|\d*\.\d+)$/.test(form.unitPrice) || Number(form.unitPrice) <= 0) {
    return 'أدخل سعرًا صحيحًا أكبر من صفر.';
  }
  if (!/^\d+$/.test(form.minAmount) || Number(form.minAmount) <= 0) {
    return 'أقل كمية يجب أن تكون عددًا صحيحًا أكبر من صفر.';
  }
  if (!/^\d+$/.test(form.maxAmount) || Number(form.maxAmount) <= 0) {
    return 'أكبر كمية يجب أن تكون عددًا صحيحًا أكبر من صفر.';
  }
  if (Number(form.maxAmount) < Number(form.minAmount)) {
    return 'أكبر كمية يجب أن تكون أكبر من أو تساوي أقل كمية.';
  }
  return '';
};

const XenaBotPricingModal = ({ isOpen, onClose, supplier, suppliers = [], onSaved }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const xenaSuppliers = useMemo(() => {
    const matches = suppliers.filter(isXenaSupplier);
    if (supplier?.id && !matches.some((item) => String(item.id) === String(supplier.id))) {
      return [supplier, ...matches];
    }
    return matches;
  }, [supplier, suppliers]);

  useEffect(() => {
    if (!isOpen || !supplier?.id) return;
    setError('');
    setForm({ ...defaultForm, supplierId: String(supplier.id) });
  }, [isOpen, supplier?.id]);

  const updateField = (key, value) => {
    setError('');
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const config = await apiClient.suppliers.updateXenaProductConfig(form.supplierId, {
        name: form.name.trim(),
        unitPrice: form.unitPrice,
        minAmount: Number(form.minAmount),
        maxAmount: Number(form.maxAmount),
        isActive: true,
      });
      setForm(normalizeConfig(config, form.supplierId));

      try {
        await apiClient.suppliers.syncProducts(form.supplierId);
        addToast('تم حفظ تسعير البوت وربط المنتج بالمورد', 'success');
      } catch (syncError) {
        addToast('تم حفظ التسعير، لكن تعذر إكمال مزامنة المنتج', 'warning');
        setError(syncError?.message || 'تم حفظ التسعير، لكن تعذر ربط المنتج الآن. حاول مرة أخرى بعد تسجيل دخول البوت.');
        await onSaved?.();
        return;
      }

      await onSaved?.();
      onClose();
    } catch (saveError) {
      setError(saveError?.message || 'تعذر حفظ تسعير البوت.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسعير بوت Xena" size="md" placement="center">
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-gray-950 dark:text-white">Xena Recharge</h4>
              <Badge variant="premium">بوت</Badge>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400" dir="ltr">xena-dynamic-recharge</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">المورد المرتبط</span>
              <select
                value={form.supplierId}
                onChange={(event) => updateField('supplierId', event.target.value)}
                className="flex h-11 w-full rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.92)] px-3.5 text-sm text-[var(--color-text)] outline-none focus:border-[color:rgb(var(--color-primary-rgb)/0.45)] focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.12)]"
                required
              >
                <option value="">اختر المورد</option>
                {xenaSuppliers.map((item) => (
                  <option key={item.id} value={item.id}>{item.supplierName || item.name || 'Xena Recharge'}</option>
                ))}
              </select>
            </label>

            <Input
              label="اسم المنتج"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="مثال: شحن Xena"
              required
            />

            <Input
              label="سعر الوحدة"
              value={form.unitPrice}
              onChange={(event) => updateField('unitPrice', event.target.value.replace(/[^\d.]/g, ''))}
              icon={<CircleDollarSign className="h-4 w-4" />}
              inputMode="decimal"
              dir="ltr"
              placeholder="0.000112996"
              required
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="أقل كمية"
                value={form.minAmount}
                onChange={(event) => updateField('minAmount', event.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                dir="ltr"
                required
              />
              <Input
                label="أكبر كمية"
                value={form.maxAmount}
                onChange={(event) => updateField('maxAmount', event.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                dir="ltr"
                required
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>إلغاء</Button>
              <Button type="submit" disabled={saving || !form.supplierId}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                {saving ? 'جاري الحفظ والربط...' : 'حفظ وربط المنتج'}
              </Button>
            </div>
        </>
      </form>
    </Modal>
  );
};

export default XenaBotPricingModal;
