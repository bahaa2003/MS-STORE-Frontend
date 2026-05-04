import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Coins, Sparkles, Target } from 'lucide-react';
import Button, { cn } from '../ui/Button';
import Card from '../ui/Card';
import Input, { selectClassName } from '../ui/Input';
import UploadProof from './UploadProof';
import { formatNumber } from '../../utils/intl';
import { resolveImageUrl } from '../../utils/imageUrl';
import { useToast } from '../ui/Toast';

const TargetForm = ({ products = [], onSubmit }) => {
  const [selectedAppId, setSelectedAppId] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [senderId, setSenderId] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proof, setProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const activeApps = useMemo(
    () => (products || []).filter((app) => app?.isActive !== false),
    [products]
  );

  const selectedApp = useMemo(
    () => activeApps.find((app) => String(app.id) === String(selectedAppId)) || activeApps[0] || null,
    [activeApps, selectedAppId]
  );

  const allowedPaymentMethods = useMemo(
    () => (Array.isArray(selectedApp?.allowedPaymentMethods) ? selectedApp.allowedPaymentMethods : []),
    [selectedApp]
  );

  const coinAmountValue = Number(coinAmount || 0);
  const unitPrice = Number(selectedApp?.unitPrice || 0);
  const totalPrice = Math.max(0, coinAmountValue * unitPrice);

  useEffect(() => {
    if (!selectedApp && activeApps.length) {
      setSelectedAppId(activeApps[0].id);
      return;
    }
    if (selectedApp && !selectedAppId) {
      setSelectedAppId(selectedApp.id);
    }
  }, [activeApps, selectedApp, selectedAppId]);

  useEffect(() => {
    if (!allowedPaymentMethods.length) {
      setPaymentMethod('');
      return;
    }
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(allowedPaymentMethods[0]);
    }
  }, [allowedPaymentMethods, paymentMethod]);

  const resetForm = () => {
    setCoinAmount('');
    setSenderId('');
    setTransferNumber('');
    setProof(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedApp?.id || !Number.isInteger(coinAmountValue) || coinAmountValue <= 0 || !paymentMethod || !senderId.trim() || !transferNumber.trim() || !proof?.file) {
      addToast('Complete the target order fields and upload the transfer proof.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        appId: selectedApp.id,
        coinAmount: coinAmountValue,
        senderId: senderId.trim(),
        transferNumber: transferNumber.trim(),
        paymentMethod,
        screenshotProof: proof.file,
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[2rem] border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[#0f0f0f]/90 p-4 shadow-[0_34px_100px_-54px_rgb(var(--color-primary-rgb)/0.45)] sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              MS STORE Target
            </p>
            <h2 className="mt-3 text-xl font-black text-[var(--color-text)] sm:text-2xl">Target Purchase</h2>
          </div>
        </div>

        <section>
          <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Select target app</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeApps.map((app) => {
              const isSelected = String(app.id) === String(selectedApp?.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedAppId(app.id)}
                  className={cn(
                    'group overflow-hidden rounded-[1.35rem] border bg-[#111]/90 text-start shadow-[0_18px_60px_-42px_rgb(var(--color-primary-rgb)/0.55)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01]',
                    isSelected
                      ? 'border-[color:rgb(var(--color-primary-rgb)/0.72)] shadow-[0_22px_70px_-36px_rgb(var(--color-primary-rgb)/0.65)]'
                      : 'border-white/10 hover:border-[color:rgb(var(--color-primary-rgb)/0.32)]'
                  )}
                >
                  <div className="relative h-28 overflow-hidden">
                    {app.image ? (
                      <img src={resolveImageUrl(app.image)} alt={app.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/30 text-[var(--color-primary)]">
                        <Target className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-black">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-[var(--color-text)]">{app.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-primary)]">
                      {formatNumber(app.unitPrice, 'en-US', { maximumFractionDigits: 2 })} EGP / Coin
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Coin amount"
                type="number"
                min="1"
                step="1"
                value={coinAmount}
                onChange={(event) => setCoinAmount(event.target.value)}
                placeholder="1000"
              />
              <Input
                label="Sender ID"
                value={senderId}
                onChange={(event) => setSenderId(event.target.value)}
                placeholder="Account/player ID in the selected app"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Payment method</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className={selectClassName}
                >
                  {allowedPaymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </label>
              <Input
                label="Transfer number"
                value={transferNumber}
                onChange={(event) => setTransferNumber(event.target.value)}
                placeholder="Wallet number, InstaPay handle, or Binance reference"
              />
            </div>

            <UploadProof label="Screenshot proof" value={proof} onChange={setProof} />
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(180deg,#171717,#0d0d0d)] p-4 shadow-[0_26px_80px_-48px_rgb(var(--color-primary-rgb)/0.55)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.13)] text-[var(--color-primary)]">
              <Coins className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Price summary</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-secondary)]">Unit price</span>
                <strong className="text-[var(--color-text)]">{formatNumber(unitPrice, 'en-US', { maximumFractionDigits: 2 })} EGP</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-secondary)]">Coins</span>
                <strong className="text-[var(--color-text)]">{formatNumber(coinAmountValue, 'en-US')}</strong>
              </div>
              <div className="border-t border-white/10 pt-3">
                <span className="text-xs text-[var(--color-text-secondary)]">Total</span>
                <p className="mt-1 text-3xl font-black text-[var(--color-primary)]">
                  {formatNumber(totalPrice, 'en-US', { maximumFractionDigits: 2 })} EGP
                </p>
              </div>
            </div>
          </aside>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-[1.25rem]" disabled={isSubmitting || !activeApps.length}>
          <Target className="h-5 w-5" />
          {isSubmitting ? 'Submitting order...' : 'Submit target order'}
        </Button>
      </form>
    </Card>
  );
};

export default TargetForm;
