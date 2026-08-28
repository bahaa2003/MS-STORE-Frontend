import React, { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Send, ShieldCheck } from 'lucide-react';
import apiClient from '../../services/client';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { normalizeXenaOtpDigits, splitXenaOtpDigits } from '../../utils/xenaOtp';

const OTP_LENGTH = 4;
const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => '');

const connectionLabels = {
  connected: 'متصل',
  disconnected: 'غير متصل',
  expired: 'انتهت الجلسة',
  pending: 'بانتظار كود التحقق',
  reauthentication_required: 'يحتاج إعادة تسجيل الدخول',
  verification_required: 'بانتظار كود التحقق',
};

const getConnectionStatus = (value) => {
  const status = typeof value?.status === 'object' ? value.status?.status : value?.status;
  return String(
    status
    || value?.connectionStatus
    || value?.connection?.status
    || 'unknown'
  ).trim().toLowerCase();
};

const getSafeErrorMessage = (error, fallback) => {
  const messages = {
    XENA_CONTRACT_CHANGED: 'تم تغيير طريقة الاتصال بخدمة Xena وتحتاج إلى تحديث من جهة النظام. يرجى المحاولة لاحقًا أو التواصل مع الدعم.',
    XENA_CONNECTION_REQUIRED: 'يجب تسجيل الدخول إلى Xena أولًا.',
    XENA_INTEGRATION_UNAVAILABLE: 'تكامل Xena غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.',
    XENA_MALFORMED_RESPONSE: 'وصل رد غير متوقع من خدمة Xena. حاول مرة أخرى لاحقًا.',
    XENA_PROVIDER_AUTH_FAILED: 'تعذر تسجيل الدخول. راجع البريد وكلمة المرور.',
    XENA_RATE_LIMITED: 'الخدمة مشغولة مؤقتًا، حاول بعد قليل.',
    XENA_REAUTHENTICATION_REQUIRED: 'انتهت الجلسة وتحتاج إلى إعادة تسجيل الدخول.',
    XENA_VERIFICATION_UNAVAILABLE: 'تعذر التحقق مؤقتًا، حاول مرة أخرى.',
  };
  const rawMessage = String(error?.message || '');
  const embeddedCode = rawMessage.match(/XENA_[A-Z0-9_]+/i)?.[0] || '';
  const code = String(error?.code || embeddedCode).trim().toUpperCase();
  return messages[code] || error?.message || fallback;
};

const XenaBotLoginModal = ({ isOpen, onClose, onConnected, supplier }) => {
  const { addToast } = useToast();
  const otpRefs = useRef([]);
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(emptyOtp);
  const [connection, setConnection] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');

  const clearSensitiveFields = () => {
    setPassword('');
    setOtp(emptyOtp());
  };

  const closeModal = () => {
    clearSensitiveFields();
    setEmail('');
    setShowPassword(false);
    setError('');
    setStep('credentials');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      clearSensitiveFields();
      return undefined;
    }

    setStep('credentials');
    setEmail('');
    setShowPassword(false);
    setError('');
    setConnection({
      status: supplier?.xenaConnectionStatus
        || supplier?.connectionStatus
        || supplier?.xenaConnection?.status
        || 'disconnected',
    });

    return () => {
      setPassword('');
      setOtp(emptyOtp());
    };
  }, [isOpen, supplier?.id]);

  const handleChallenge = async (event) => {
    event.preventDefault();
    const username = email.trim();

    if (!username || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setChallengeLoading(true);
    setError('');
    try {
      const result = await apiClient.suppliers.challengeXena(supplier.id, {
        displayName: supplier.supplierName || supplier.name || 'Xena Recharge',
        username,
        password,
      });
      setConnection(result || null);
      setPassword('');
      setOtp(emptyOtp());
      if (getConnectionStatus(result) === 'connected') {
        setConnection({ ...(result || {}), status: 'connected' });
        setStep('success');
        onConnected?.();
        addToast('تم تسجيل دخول بوت Xena بنجاح', 'success');
      } else {
        setStep('otp');
        addToast('تم إرسال كود التحقق إلى حساب Xena', 'success');
        window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
      }
    } catch (challengeError) {
      setError(getSafeErrorMessage(challengeError, 'تعذر إرسال كود التحقق. حاول مرة أخرى.'));
    } finally {
      setPassword('');
      setChallengeLoading(false);
    }
  };

  const distributeOtp = (digits, startIndex = 0) => {
    const digitList = splitXenaOtpDigits(digits, OTP_LENGTH - startIndex);
    if (!digitList.length) return;
    const next = [...otp];
    digitList.forEach((digit, offset) => {
      next[startIndex + offset] = digit;
    });
    setOtp(next);
    const nextFocusIndex = Math.min(startIndex + digitList.length, OTP_LENGTH - 1);
    window.setTimeout(() => otpRefs.current[nextFocusIndex]?.focus(), 0);
  };

  const handleOtpChange = (index, value) => {
    const digits = normalizeXenaOtpDigits(value);
    setError('');
    if (!digits) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    distributeOtp(digits, index);
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const digits = normalizeXenaOtpDigits(event.clipboardData.getData('text')).slice(0, OTP_LENGTH);
    if (!digits) return;
    event.preventDefault();
    distributeOtp(digits, 0);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const code = otp.join('');
    if (!/^\d{4}$/.test(code)) {
      setError('أدخل كود التحقق المكوّن من 4 أرقام.');
      return;
    }

    setVerifyLoading(true);
    setError('');
    try {
      const result = await apiClient.suppliers.verifyXena(supplier.id, { code });
      setConnection({ ...(result || {}), status: 'connected' });
      setOtp(emptyOtp());
      setStep('success');
      onConnected?.();
      addToast('تم تسجيل دخول بوت Xena بنجاح', 'success');
    } catch (verifyError) {
      setError(getSafeErrorMessage(verifyError, 'الكود غير صحيح أو انتهت صلاحيته.'));
      setOtp(emptyOtp());
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } finally {
      setVerifyLoading(false);
    }
  };

  const status = getConnectionStatus(connection);
  const statusLabel = connectionLabels[status] || 'الحالة غير معروفة';

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="تسجيل دخول بوت Xena" size="md" placement="center">
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-3 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-gray-950 dark:text-white">Xena Recharge</h4>
              <Badge variant="premium">بوت</Badge>
            </div>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400" dir="ltr">xena-recharge</p>
          </div>
          <Badge variant={status === 'connected' ? 'success' : 'secondary'}>
            {statusLabel}
          </Badge>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {step === 'credentials' ? (
          <form onSubmit={handleChallenge} className="space-y-3.5">
            <div>
              <h5 className="text-sm font-black text-gray-950 dark:text-white">بيانات تسجيل الدخول</h5>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">سيتم إرسال البيانات بأمان إلى Backend الموقع لإرسال كود التحقق.</p>
            </div>
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="off"
              dir="ltr"
              required
            />
            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<LockKeyhole className="h-4 w-4" />}
              suffix={(
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-md p-1 text-gray-500 transition hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.22)]"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
              autoComplete="new-password"
              dir="ltr"
              required
            />
            <Button type="submit" className="w-full" disabled={challengeLoading || !supplier?.id}>
              {challengeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {challengeLoading ? 'جاري إرسال الكود...' : 'إرسال كود'}
            </Button>
          </form>
        ) : null}

        {step === 'otp' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h5 className="mt-3 text-sm font-black text-gray-950 dark:text-white">أدخل كود التحقق</h5>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">أدخل الكود المكوّن من 4 أرقام الذي وصلك.</p>
            </div>
            <div className="flex justify-center gap-2.5" dir="ltr" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpRefs.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  lang="en"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onBeforeInput={(event) => {
                    if (event.data && !normalizeXenaOtpDigits(event.data)) event.preventDefault();
                  }}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onFocus={(event) => event.target.select()}
                  aria-label={`رقم ${index + 1} من كود التحقق`}
                  className="h-14 w-12 rounded-xl border border-gray-300 bg-white text-center text-xl font-black text-gray-950 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.18)] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={verifyLoading || otp.some((digit) => !digit)}>
              {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {verifyLoading ? 'جاري التحقق...' : 'تأكيد الكود'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('credentials'); setOtp(emptyOtp()); setError(''); }} disabled={verifyLoading}>
              تعديل بيانات الدخول أو إرسال كود جديد
            </Button>
          </form>
        ) : null}

        {step === 'success' ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <div>
              <h5 className="font-black text-gray-950 dark:text-white">تم تسجيل دخول البوت</h5>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">أصبح اتصال Xena جاهزًا للاستخدام.</p>
            </div>
            <Button type="button" className="w-full" onClick={closeModal}>تم</Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default XenaBotLoginModal;
