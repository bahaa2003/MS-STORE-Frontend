import React, { useEffect, useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import apiClient from '../../services/client';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

const initialForm = { name: 'Dynamic Coin Recharge', unitPrice: '', minCoins: '1', maxCoins: '1000000' };

const CoinRechargePricingModal = ({ isOpen, onClose, supplier, onSaved }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const config = supplier?.coinRechargeConfig?.product || {};
    setForm({ name: String(config.name || initialForm.name), unitPrice: String(config.unitPrice || ''), minCoins: String(config.minCoins || initialForm.minCoins), maxCoins: String(config.maxCoins || initialForm.maxCoins) });
    setError('');
  }, [isOpen, supplier]);

  const set = (key, value) => { setError(''); setForm((current) => ({ ...current, [key]: value })); };
  const submit = async (event) => {
    event.preventDefault();
    const validCoinBound = (value) => typeof value === 'string'
      && /^\d+$/.test(value)
      && Number(value) > 0
      && Number.isSafeInteger(Number(value));
    if (!form.name.trim() || !/^\d+(?:\.\d+)?$/.test(form.unitPrice) || Number(form.unitPrice) <= 0 || !validCoinBound(form.minCoins) || !validCoinBound(form.maxCoins)) {
      setError('أدخل اسم المنتج والسعر وحدود عملات صحيحة.');
      return;
    }
    const minCoins = Number(form.minCoins);
    const maxCoins = Number(form.maxCoins);
    if (maxCoins < minCoins) {
      setError('أدخل اسم المنتج والسعر وحدود عملات صحيحة.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.suppliers.updateCoinRechargeProductConfig(supplier.id, { name: form.name.trim(), unitPrice: form.unitPrice, minCoins, maxCoins, isActive: true });
      addToast('تم حفظ منتج الشحن الديناميكي وأصبح جاهزًا للنشر من المنتجات.', 'success');
      await onSaved?.();
      onClose();
    } catch (err) { setError(err?.message || 'تعذر حفظ إعداد منتج الشحن.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إعداد شحن العملات" size="md" placement="center">
      <form onSubmit={submit} className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] p-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white"><Coins className="h-5 w-5" /></span>
          <div><div className="flex gap-2"><h4 className="font-black text-gray-950 dark:text-white">{supplier?.supplierName || supplier?.name}</h4><Badge variant="premium">Coins</Badge></div><p className="mt-0.5 text-xs text-gray-500" dir="ltr">coin-recharge-dynamic</p></div>
        </div>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        <Input label="اسم المنتج" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Input label="تكلفة الوحدة (USD)" inputMode="decimal" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} required />
        <div className="grid grid-cols-2 gap-3"><Input label="أقل عملات" inputMode="numeric" value={form.minCoins} onChange={(e) => set('minCoins', e.target.value)} required /><Input label="أكبر عملات" inputMode="numeric" value={form.maxCoins} onChange={(e) => set('maxCoins', e.target.value)} required /></div>
        <p className="text-xs text-gray-500">حفظ الإعداد ينشئ أو يحدث المنتج الصناعي محليًا فقط؛ لا يتم استدعاء مزود خارجي.</p>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}حفظ وتجهيز المنتج</Button></div>
      </form>
    </Modal>
  );
};

export default CoinRechargePricingModal;
