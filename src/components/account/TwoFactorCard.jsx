import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Mail, ShieldAlert } from 'lucide-react';
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
  SENDING_CODE: 'sending-code',
  CONFIRMING: 'confirming',
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
      title: isEnglish ? 'Two-Factor Authentication' : 'المصادقة الثنائية',
      description: isEnglish
        ? 'Receive a one-time email code as an extra security check at sign in.'
        : 'استلم رمز تحقق لمرة واحدة عبر بريدك الإلكتروني كخطوة أمان إضافية عند تسجيل الدخول.',
      enabled: isEnglish ? 'Enabled' : 'مفعلة',
      disabled: isEnglish ? 'Disabled' : 'غير مفعلة',
      sendingCode: isEnglish ? 'Sending code' : 'جارٍ إرسال الكود',
      confirming: isEnglish ? 'Confirming' : 'جارٍ تأكيد التفعيل',
      codeSent: isEnglish ? 'Verification code sent' : 'تم إرسال كود التحقق',
      enableBtn: isEnglish ? 'Enable 2FA' : 'تفعيل المصادقة الثنائية',
      disableBtn: isEnglish ? 'Disable 2FA' : 'إلغاء التفعيل',
      activated: isEnglish ? 'Two-factor authentication by email is enabled.' : 'تم تفعيل المصادقة الثنائية عبر البريد الإلكتروني.',
      deactivated: isEnglish ? 'Two-factor authentication has been disabled.' : 'تم إلغاء تفعيل المصادقة الثنائية.',
      codeSentMessage: isEnglish ? 'We sent a 6-digit verification code to your email.' : 'أرسلنا كود تحقق مكونًا من 6 أرقام إلى بريدك الإلكتروني.',
      enableError: isEnglish ? 'Unable to send the 2FA verification code. Please try again.' : 'تعذر إرسال كود تفعيل المصادقة الثنائية. حاول مرة أخرى.',
      confirmError: isEnglish ? 'Invalid verification code. Check the latest email and try again.' : 'كود التحقق غير صحيح. تأكد من آخر رسالة في بريدك وحاول مرة أخرى.',
      setupExpired: isEnglish ? 'This verification code has expired. Request a new code and try again.' : 'انتهت صلاحية كود التحقق. اطلب كودًا جديدًا وحاول مرة أخرى.',
      setupCodePrompt: isEnglish
        ? 'Enter the 6-digit code sent to your email to confirm activation.'
        : 'أدخل الكود المكون من 6 أرقام المرسل لبريدك لتأكيد التفعيل.',
      setupCodeRequired: isEnglish ? 'Enter the complete 6-digit code.' : 'أدخل الكود الكامل المكون من 6 أرقام.',
      confirmEnable: isEnglish ? 'Confirm activation' : 'تأكيد التفعيل',
      resendCode: isEnglish ? 'Resend code' : 'إعادة إرسال الكود',
      saveEmailFirst: isEnglish ? 'Save your email changes first before enabling 2FA.' : 'احفظ تغييرات البريد الإلكتروني أولاً قبل تفعيل المصادقة الثنائية.',
      emailNotice: isEnglish
        ? 'Sign-in verification codes will be sent to'
        : 'سيتم إرسال رموز التحقق عند تسجيل الدخول إلى',
      disableTitle: isEnglish ? 'Disable two-factor authentication?' : 'إلغاء تفعيل المصادقة الثنائية؟',
      disableDesc: isEnglish
        ? 'For security, confirm your current password before disabling 2FA.'
        : 'لأمان حسابك، أدخل كلمة المرور الحالية قبل إلغاء التفعيل.',
      currentPassword: isEnglish ? 'Current password' : 'كلمة المرور الحالية',
      currentPasswordPlaceholder: isEnglish ? 'Enter your current password' : 'أدخل كلمة المرور الحالية',
      passwordRequired: isEnglish ? 'Current password is required.' : 'كلمة المرور الحالية مطلوبة.',
      cancel: isEnglish ? 'Cancel' : 'إلغاء',
      confirmDisable: isEnglish ? 'Disable now' : 'إلغاء التفعيل الآن',
      disableError: isEnglish ? 'Could not disable 2FA.' : 'تعذر إلغاء تفعيل المصادقة الثنائية.',
    }),
    [isEnglish]
  );

  const [status, setStatus] = useState(STATUS.DISABLED);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConfirmingEnable, setIsConfirmingEnable] = useState(false);
  const [enableCode, setEnableCode] = useState('');
  const [feedback, setFeedback] = useState({ type: 'info', message: '' });
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const maskedEmail = useMemo(() => maskEmailForDisplay(email), [email]);

  useEffect(() => {
    const enabled = Boolean(twoFactorEnabled);
    setIsEnabled(enabled);
    setStatus(enabled ? STATUS.ENABLED : STATUS.DISABLED);
    setIsConfirmingEnable(false);
    setEnableCode('');
  }, [twoFactorEnabled]);

  const badgeState = useMemo(() => {
    if (status === STATUS.SENDING_CODE) return { label: text.sendingCode, variant: 'info' };
    if (status === STATUS.CONFIRMING) return { label: text.confirming, variant: 'info' };
    if (isConfirmingEnable) return { label: text.codeSent, variant: 'warning' };
    if (isEnabled) return { label: text.enabled, variant: 'success' };
    return { label: text.disabled, variant: 'default' };
  }, [isConfirmingEnable, isEnabled, status, text]);

  const feedbackClassName = (
    feedback.type === 'success'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
      : feedback.type === 'error'
        ? 'border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
        : feedback.type === 'warning'
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200'
  );

  const generateTwoFactor = async () => {
    if (emailChangedPending) {
      setFeedback({ type: 'warning', message: text.saveEmailFirst });
      return;
    }

    setStatus(STATUS.SENDING_CODE);
    setFeedback({ type: 'info', message: '' });

    try {
      await apiClient.auth.generateTwoFactor();
      setIsConfirmingEnable(true);
      setEnableCode('');
      setStatus(STATUS.DISABLED);
      setFeedback({ type: 'success', message: text.codeSentMessage });
      addToast(text.codeSentMessage, 'success');
    } catch (error) {
      const message = error?.message || text.enableError;
      setStatus(STATUS.ERROR);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const confirmEnableTwoFactor = async () => {
    if (enableCode.length !== 6) {
      setFeedback({ type: 'error', message: text.setupCodeRequired });
      return;
    }

    setStatus(STATUS.CONFIRMING);
    setFeedback({ type: 'info', message: '' });

    try {
      await apiClient.auth.enableTwoFactor({ code: enableCode });
      setIsEnabled(true);
      setIsConfirmingEnable(false);
      setEnableCode('');
      setStatus(STATUS.ENABLED);
      updateUserSession({ twoFactorEnabled: true, isTwoFactorEnabled: true });
      setFeedback({ type: 'success', message: text.activated });
      addToast(text.activated, 'success');
    } catch (error) {
      const rawMessage = String(error?.message || '').toLowerCase();
      const message = rawMessage.includes('expired')
        ? text.setupExpired
        : rawMessage.includes('invalid')
          ? text.confirmError
          : error?.message || text.confirmError;
      setStatus(STATUS.ERROR);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const handleToggle = () => {
    if (isEnabled) {
      setDisablePassword('');
      setIsDisableDialogOpen(true);
      return;
    }

    generateTwoFactor();
  };

  const disableTwoFactor = async () => {
    if (!disablePassword.trim()) {
      setFeedback({ type: 'error', message: text.passwordRequired });
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
      const message = error?.message || text.disableError;
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <>
      <Card className="security-glow-card rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5 shadow-[var(--shadow-subtle)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
              <Mail className="h-[18px] w-[18px] text-[var(--color-primary)]" />
              {text.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text.description}</p>
          </div>
          <Badge variant={badgeState.variant}>{badgeState.label}</Badge>
        </div>

        <div className="mb-4 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-3 text-sm text-[var(--color-text-secondary)]">
          <span>{text.emailNotice}</span>{' '}
          <span className="font-semibold text-[var(--color-primary)]">{maskedEmail || email}</span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleToggle}
            disabled={status === STATUS.SENDING_CODE || status === STATUS.CONFIRMING || isDisabling || emailChangedPending}
            variant={isEnabled ? 'danger' : 'primary'}
          >
            {status === STATUS.SENDING_CODE ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEnabled ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {isEnabled ? text.disableBtn : text.enableBtn}
          </Button>
        </div>

        {isConfirmingEnable && !isEnabled ? (
          <div className="mb-4 space-y-3 rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-elevated-rgb)/0.76)] p-4">
            <p className="text-sm font-medium text-[var(--color-text)]">{text.setupCodePrompt}</p>
            <OtpInput value={enableCode} onChange={setEnableCode} disabled={status === STATUS.CONFIRMING} />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={confirmEnableTwoFactor}
                disabled={status === STATUS.CONFIRMING || enableCode.length !== 6}
              >
                {status === STATUS.CONFIRMING ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {text.confirmEnable}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={generateTwoFactor}
                disabled={status === STATUS.SENDING_CODE || status === STATUS.CONFIRMING}
              >
                <Mail className="h-4 w-4" />
                {text.resendCode}
              </Button>
            </div>
          </div>
        ) : null}

        {emailChangedPending ? (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            {text.saveEmailFirst}
          </div>
        ) : null}

        {feedback?.message ? (
          <div className={`rounded-xl border p-3 text-sm ${feedbackClassName}`}>
            {feedback.message}
          </div>
        ) : null}
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
