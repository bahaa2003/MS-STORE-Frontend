import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, QrCode, RefreshCcw, Shield, ShieldAlert } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import OtpInput from './OtpInput';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/client';
import useAuthStore from '../../store/useAuthStore';

const STATUS = {
  DISABLED: 'disabled',
  GENERATING: 'generating',
  READY: 'ready',
  VERIFYING: 'verifying',
  ENABLED: 'enabled',
  ERROR: 'error',
};

const maskEmailForDisplay = (value) => {
  const raw = String(value || '').trim();
  const [name, domain] = raw.split('@');
  if (!name || !domain) return raw;
  if (name.length <= 2) return `${name.slice(0, 1)}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const TwoFactorCard = ({ email, twoFactorEnabled = false, emailChangedPending = false }) => {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const isEnglish = language === 'en';

  const text = useMemo(
    () => ({
      title: isEnglish ? 'Two-Factor Authentication' : 'Two-Factor Authentication',
      description: isEnglish
        ? 'Use an authenticator app code as an extra security check at sign in.'
        : 'Use an authenticator app code as an extra security check at sign in.',
      enabled: isEnglish ? 'Enabled' : 'Enabled',
      disabled: isEnglish ? 'Disabled' : 'Disabled',
      generating: isEnglish ? 'Generating QR' : 'Generating QR',
      ready: isEnglish ? 'Ready to verify' : 'Ready to verify',
      verifying: isEnglish ? 'Verifying' : 'Verifying',
      enableBtn: isEnglish ? 'Enable 2FA' : 'Enable 2FA',
      disableBtn: isEnglish ? 'Disable 2FA' : 'Disable 2FA',
      generateBtn: isEnglish ? 'Generate QR code' : 'Generate QR code',
      regenerateBtn: isEnglish ? 'Regenerate QR' : 'Regenerate QR',
      verifyBtn: isEnglish ? 'Confirm activation' : 'Confirm activation',
      scanHint: isEnglish
        ? 'Scan this QR code in your authenticator app, then enter the 6-digit code.'
        : 'Scan this QR code in your authenticator app, then enter the 6-digit code.',
      codeHint: isEnglish ? 'Enter the 6-digit code' : 'Enter the 6-digit code',
      generated: isEnglish ? 'QR code generated.' : 'QR code generated.',
      activated: isEnglish ? 'Two-factor authentication is enabled.' : 'Two-factor authentication is enabled.',
      deactivated: isEnglish ? 'Two-factor authentication has been disabled.' : 'Two-factor authentication has been disabled.',
      invalidCode: isEnglish ? 'Please enter a complete 6-digit code.' : 'Please enter a complete 6-digit code.',
      saveEmailFirst: isEnglish ? 'Save your email changes first before enabling 2FA.' : 'Save your email changes first before enabling 2FA.',
      disableTitle: isEnglish ? 'Disable two-factor authentication?' : 'Disable two-factor authentication?',
      disableDesc: isEnglish
        ? 'For security, confirm your current password before disabling 2FA.'
        : 'For security, confirm your current password before disabling 2FA.',
      currentPassword: isEnglish ? 'Current password' : 'Current password',
      currentPasswordPlaceholder: isEnglish ? 'Enter your current password' : 'Enter your current password',
      cancel: isEnglish ? 'Cancel' : 'Cancel',
      confirmDisable: isEnglish ? 'Disable now' : 'Disable now',
    }),
    [isEnglish]
  );

  const [status, setStatus] = useState(STATUS.DISABLED);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [feedback, setFeedback] = useState({ type: 'info', message: '' });
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const maskedEmail = useMemo(() => maskEmailForDisplay(email), [email]);

  useEffect(() => {
    const enabled = Boolean(twoFactorEnabled);
    setIsEnabled(enabled);
    setStatus(enabled ? STATUS.ENABLED : STATUS.DISABLED);
  }, [twoFactorEnabled]);

  const badgeState = useMemo(() => {
    if (status === STATUS.GENERATING) return { label: text.generating, variant: 'info' };
    if (status === STATUS.READY) return { label: text.ready, variant: 'warning' };
    if (status === STATUS.VERIFYING) return { label: text.verifying, variant: 'info' };
    if (isEnabled) return { label: text.enabled, variant: 'success' };
    return { label: text.disabled, variant: 'default' };
  }, [isEnabled, status, text]);

  const generateTwoFactor = async () => {
    setStatus(STATUS.GENERATING);
    setFeedback({ type: 'info', message: '' });
    setOtp('');

    try {
      const response = await apiClient.auth.generateTwoFactor();
      setQrCodeUrl(response.qrCodeUrl || '');
      setStatus(STATUS.READY);
      setFeedback({ type: 'success', message: text.generated });
      addToast(text.generated, 'success');
    } catch (error) {
      const message = error?.message || 'Unable to generate 2FA setup.';
      setStatus(STATUS.ERROR);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const enableTwoFactor = async () => {
    if (otp.length !== 6) {
      setFeedback({ type: 'error', message: text.invalidCode });
      return;
    }

    setStatus(STATUS.VERIFYING);
    setFeedback({ type: 'info', message: '' });

    try {
      await apiClient.auth.enableTwoFactor({ token: otp });
      setIsEnabled(true);
      setIsFlowOpen(false);
      setQrCodeUrl('');
      setOtp('');
      setStatus(STATUS.ENABLED);
      updateUserSession({ twoFactorEnabled: true, isTwoFactorEnabled: true });
      setFeedback({ type: 'success', message: text.activated });
      addToast(text.activated, 'success');
    } catch (error) {
      const message = error?.message || 'Invalid 2FA code. Please try again.';
      setStatus(STATUS.READY);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const handleToggle = () => {
    if (emailChangedPending) {
      setFeedback({ type: 'warning', message: text.saveEmailFirst });
      return;
    }

    if (isEnabled) {
      setDisablePassword('');
      setIsDisableDialogOpen(true);
      return;
    }

    setIsFlowOpen((prev) => !prev);
    setFeedback({ type: 'info', message: '' });
    setStatus(STATUS.DISABLED);
  };

  const disableTwoFactor = async () => {
    if (!disablePassword.trim()) {
      setFeedback({ type: 'error', message: 'Current password is required.' });
      return;
    }

    setIsDisabling(true);
    try {
      await apiClient.auth.disableTwoFactor({ password: disablePassword });
      setIsEnabled(false);
      setStatus(STATUS.DISABLED);
      setIsDisableDialogOpen(false);
      setDisablePassword('');
      updateUserSession({ twoFactorEnabled: false, isTwoFactorEnabled: false });
      setFeedback({ type: 'success', message: text.deactivated });
      addToast(text.deactivated, 'success');
    } catch (error) {
      const message = error?.message || 'Could not disable 2FA.';
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsDisabling(false);
    }
  };

  const feedbackClassName = (
    feedback.type === 'success'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
      : feedback.type === 'error'
        ? 'border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
        : feedback.type === 'warning'
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200'
  );

  return (
    <>
      <Card className="security-glow-card rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5 shadow-[var(--shadow-subtle)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
              <Shield className="h-[18px] w-[18px] text-[var(--color-primary)]" />
              {text.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text.description}</p>
          </div>
          <Badge variant={badgeState.variant}>{badgeState.label}</Badge>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleToggle}
            disabled={status === STATUS.GENERATING || status === STATUS.VERIFYING}
            variant={isEnabled ? 'danger' : 'primary'}
          >
            {isEnabled ? <ShieldAlert className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
            {isEnabled ? text.disableBtn : text.enableBtn}
          </Button>
        </div>

        {emailChangedPending ? (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            {text.saveEmailFirst}
          </div>
        ) : null}

        {feedback?.message ? (
          <div className={`mb-3 rounded-xl border p-3 text-sm ${feedbackClassName}`}>
            {feedback.message}
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {isFlowOpen && !isEnabled ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="space-y-4 rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-elevated-rgb)/0.88)] p-4"
            >
              <div className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.88)] p-3 text-sm text-[var(--color-text-secondary)]">
                {text.scanHint} <span className="font-semibold text-[var(--color-primary)]">{maskedEmail || email}</span>
              </div>

              {qrCodeUrl ? (
                <div className="flex flex-col items-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-white p-3 text-center dark:bg-gray-950">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="h-40 w-40 rounded-lg" />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generateTwoFactor}
                  disabled={status === STATUS.GENERATING || status === STATUS.VERIFYING}
                >
                  {status === STATUS.GENERATING ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  {qrCodeUrl ? text.regenerateBtn : text.generateBtn}
                </Button>
              </div>

              {qrCodeUrl ? (
                <div className="space-y-3 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.84)] p-3">
                  <p className="text-sm text-[var(--color-text)]">{text.codeHint}</p>
                  <OtpInput value={otp} onChange={setOtp} disabled={status === STATUS.VERIFYING} />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={enableTwoFactor} disabled={status === STATUS.VERIFYING || otp.length !== 6}>
                      {status === STATUS.VERIFYING ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {text.verifyBtn}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateTwoFactor}
                      disabled={status === STATUS.GENERATING || status === STATUS.VERIFYING}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {text.regenerateBtn}
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>

      <ConfirmDialog
        open={isDisableDialogOpen}
        title={text.disableTitle}
        description={text.disableDesc}
        confirmLabel={text.confirmDisable}
        cancelLabel={text.cancel}
        isLoading={isDisabling}
        onConfirm={disableTwoFactor}
        onCancel={() => !isDisabling && setIsDisableDialogOpen(false)}
      >
        <Input
          type="password"
          value={disablePassword}
          onChange={(event) => setDisablePassword(event.target.value)}
          label={text.currentPassword}
          placeholder={text.currentPasswordPlaceholder}
        />
      </ConfirmDialog>
    </>
  );
};

export default TwoFactorCard;
