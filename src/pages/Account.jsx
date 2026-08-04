import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveImageUrl } from '../utils/imageUrl';
import { motion } from 'framer-motion';
import { Camera, Eye, EyeOff, KeyRound, Mail, Phone, Save, ShieldCheck, User, UserCircle2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { inputBaseClassName } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import SaveChangesBar from '../components/account/SaveChangesBar';
import useAuthStore from '../store/useAuthStore';
import useAdminStore from '../store/useAdminStore';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9 ()-]{7,20}$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;

const getProfileFromUser = (user) => {
  const fullName = String(user?.name || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim().toLowerCase();
  const phone = String(user?.phone || '').trim();
  const avatar = String(user?.avatar || '').trim();

  return { fullName, username, email, phone, avatar };
};

const Account = () => {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const passwordSectionRef = useRef(null);

  const { user, updateUserSession } = useAuthStore();
  const { updateUserProfile, updateUserAvatar } = useAdminStore();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const isEnglish = language === 'en';
  const text = useMemo(
    () =>
      isEnglish
        ? {
            pageTitle: 'My Account',
            pageSubtitle: 'View and manage your personal details and security preferences',
            activeAccount: 'Active account',
            changePhoto: 'Change image',
            removePhoto: 'Remove image',
            imageHint: 'Supported: JPG, JPEG, PNG, WEBP (max 2MB)',
            personalInfo: 'Personal Info',
            fullName: 'Full name',
            username: 'Username (optional)',
            contactInfo: 'Contact Info',
            emailAddress: 'Email address',
            emailLocked: 'Cannot be changed',
            phoneNumber: 'Phone number',
            emailVerified: 'Email verified',
            emailNotVerified: 'Email not verified',
            email2faHint: 'Email is used for two-factor verification.',
            passwordCard: 'Change Password',
            currentPassword: 'Current password',
            newPassword: 'New password',
            confirmPassword: 'Confirm new password',
            passwordHint: 'Use at least 8 characters including uppercase, lowercase, and a number.',
            passwordDescription: 'Update your password in a separate secure window.',
            passwordSave: 'Update password',
            passwordSuccess: 'Password updated successfully.',
            saveLabel: 'Save changes',
            cancelLabel: 'Cancel',
            dirtyHint: 'You have unsaved changes.',
            cleanHint: 'Everything is saved.',
            saveSuccess: 'Account changes saved successfully.',
            saveError: 'Could not save account changes.',
            unsavedAlert: 'You have pending edits. Save or cancel before leaving this page.',
            loading: 'Loading account data...',
            validationRequired: 'This field is required.',
            validationNameMin: 'Name must be at least 3 characters.',
            validationNameMax: 'Name must be no more than 60 characters.',
            validationUsername: 'Username must be 3-30 chars, letters/numbers/._- only.',
            validationEmail: 'Enter a valid email format.',
            validationPhone: 'Enter a valid phone number.',
            validationCurrentPassword: 'Current password is required to change password.',
            validationPasswordLength: 'New password must be at least 8 characters.',
            validationPasswordPattern: 'Password must include uppercase, lowercase, and a number.',
            validationPasswordMatch: 'Confirmation password does not match.',
            invalidImageType: 'Invalid image type. Use JPG, JPEG, PNG, or WEBP.',
            invalidImageSize: 'Image size must be 2MB or less.',
            securityTitle: 'Security',
            profileTitle: 'Profile'
          }
        : {
            pageTitle: 'حسابي',
            pageSubtitle: 'عرض وتعديل بياناتك الشخصية وإعدادات الأمان',
            activeAccount: 'حساب نشط',
            changePhoto: 'تغيير الصورة',
            removePhoto: 'إزالة الصورة',
            imageHint: 'الصيغ المدعومة: JPG, JPEG, PNG, WEBP (بحد أقصى 2MB)',
            personalInfo: 'البيانات الشخصية',
            fullName: 'الاسم الكامل',
            username: 'اسم العرض (اختياري)',
            contactInfo: 'بيانات التواصل',
            emailAddress: 'البريد الإلكتروني',
            emailLocked: 'لا يمكن تغييره',
            phoneNumber: 'رقم الهاتف',
            emailVerified: 'البريد موثّق',
            emailNotVerified: 'البريد غير موثّق',
            email2faHint: 'يُستخدم البريد الإلكتروني للتحقق في المصادقة الثنائية.',
            passwordCard: 'تغيير كلمة المرور',
            currentPassword: 'كلمة المرور الحالية',
            newPassword: 'كلمة المرور الجديدة',
            confirmPassword: 'تأكيد كلمة المرور الجديدة',
            passwordHint: 'استخدم 8 أحرف على الأقل تتضمن حرفًا كبيرًا وصغيرًا ورقمًا.',
            passwordDescription: 'حدّث كلمة مرور حسابك من خلال نافذة آمنة ومستقلة.',
            passwordSave: 'تحديث كلمة المرور',
            passwordSuccess: 'تم تحديث كلمة المرور بنجاح.',
            saveLabel: 'حفظ التعديلات',
            cancelLabel: 'إلغاء',
            dirtyHint: 'لديك تغييرات غير محفوظة.',
            cleanHint: 'كل التعديلات محفوظة.',
            saveSuccess: 'تم حفظ تعديلات الحساب بنجاح.',
            saveError: 'تعذّر حفظ تعديلات الحساب.',
            unsavedAlert: 'لديك تعديلات معلّقة. احفظها أو ألغها قبل مغادرة الصفحة.',
            loading: 'جاري تحميل بيانات الحساب...',
            validationRequired: 'هذا الحقل مطلوب.',
            validationNameMin: 'الاسم يجب أن يكون 3 أحرف على الأقل.',
            validationNameMax: 'الاسم يجب ألا يتجاوز 60 حرفًا.',
            validationUsername: 'اسم العرض يجب أن يكون 3-30 حرفًا ويقبل الأحرف والأرقام و . _ - فقط.',
            validationEmail: 'أدخل بريدًا إلكترونيًا بصيغة صحيحة.',
            validationPhone: 'أدخل رقم هاتف بصيغة صحيحة.',
            validationCurrentPassword: 'كلمة المرور الحالية مطلوبة لتغيير كلمة المرور.',
            validationPasswordLength: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.',
            validationPasswordPattern: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم.',
            validationPasswordMatch: 'تأكيد كلمة المرور غير مطابق.',
            invalidImageType: 'نوع الصورة غير صالح. استخدم JPG أو JPEG أو PNG أو WEBP.',
            invalidImageSize: 'حجم الصورة يجب ألا يتجاوز 2MB.',
            securityTitle: 'الأمان',
            profileTitle: 'الملف الشخصي'
          },
    [isEnglish]
  );

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState({ type: 'idle', message: '' });
  const [errors, setErrors] = useState({});

  const [savedProfile, setSavedProfile] = useState(() => getProfileFromUser(user));
  const [form, setForm] = useState(() => ({
    ...getProfileFromUser(user),
    avatarPreview: String(user?.avatar || '').trim(),
    avatarFile: null,
    avatarAction: 'keep'
  }));
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    const initialProfile = getProfileFromUser(user);
    setSavedProfile(initialProfile);
    setForm({
      ...initialProfile,
      avatarPreview: initialProfile.avatar,
      avatarFile: null,
      avatarAction: 'keep'
    });
    setPasswordForm({ current: '', next: '', confirm: '' });
    setErrors({});
    setSaveState({ type: 'idle', message: '' });

    const timer = setTimeout(() => setIsInitialLoading(false), 350);
    return () => clearTimeout(timer);
  }, [user?.id, user?.name, user?.email, user?.avatar, user?.phone, user?.username]);

  useEffect(() => {
    if (!location.hash) return;
    if (location.hash === '#password') setIsPasswordModalOpen(true);
  }, [location.hash]);

  const generatedAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName || 'User')}&background=1f2937&color=ffffff`;
  const displayedAvatar =
    form.avatarAction === 'remove'
      ? generatedAvatar
      : form.avatarPreview || resolveImageUrl(savedProfile.avatar) || generatedAvatar;

  const hasAvatarChanges = form.avatarAction !== 'keep';
  const hasProfileChanges =
    form.fullName.trim() !== savedProfile.fullName ||
    form.username.trim() !== savedProfile.username ||
    form.email.trim().toLowerCase() !== savedProfile.email ||
    form.phone.trim() !== savedProfile.phone ||
    hasAvatarChanges;
  const isDirty = hasProfileChanges;

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
      setErrors((prev) => ({ ...prev, avatar: text.invalidImageType }));
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, avatar: text.invalidImageSize }));
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarPreview: nextPreview, avatarFile: file, avatarAction: 'update' }));
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatarPreview: '', avatarFile: null, avatarAction: 'remove' }));
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  const handleCancel = () => {
    setForm({
      ...savedProfile,
      avatarPreview: savedProfile.avatar,
      avatarFile: null,
      avatarAction: 'keep'
    });
    setErrors({});
    setSaveState({ type: 'idle', message: '' });
  };

  const validateForm = () => {
    const validationErrors = {};
    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!fullName) validationErrors.fullName = text.validationRequired;
    else if (fullName.length < 3) validationErrors.fullName = text.validationNameMin;
    else if (fullName.length > 60) validationErrors.fullName = text.validationNameMax;

    if (username && !usernameRegex.test(username)) {
      validationErrors.username = text.validationUsername;
    }

    if (!email) validationErrors.email = text.validationRequired;
    else if (!emailRegex.test(email)) validationErrors.email = text.validationEmail;

    if (phone && !phoneRegex.test(phone)) validationErrors.phone = text.validationPhone;

    return validationErrors;
  };

  const validatePassword = () => {
    const validationErrors = {};
    if (!passwordForm.current) validationErrors.currentPassword = text.validationCurrentPassword;
    if (!passwordForm.next) validationErrors.nextPassword = text.validationRequired;
    else if (passwordForm.next.length < 8) validationErrors.nextPassword = text.validationPasswordLength;
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.next)) {
      validationErrors.nextPassword = text.validationPasswordPattern;
    }
    if (passwordForm.confirm !== passwordForm.next) validationErrors.confirmPassword = text.validationPasswordMatch;
    return validationErrors;
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSaveState({ type: 'error', message: text.saveError });
      addToast(text.saveError, 'error');
      return;
    }

    setIsSaving(true);
    setSaveState({ type: 'saving', message: '' });

    const trimmedProfile = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim()
    };

    try {
      const profilePayload = {
        name: trimmedProfile.fullName,
        email: trimmedProfile.email,
        username: trimmedProfile.username,
        phone: trimmedProfile.phone
      };

      if (hasAvatarChanges) {
        // Send File object for upload, or null for removal
        const avatarPayload = form.avatarAction === 'remove' ? null : form.avatarFile;
        await updateUserAvatar(user.id, avatarPayload, user);
      }

      await updateUserProfile(user.id, profilePayload, user);

      const nextAvatarValue = hasAvatarChanges
        ? form.avatarAction === 'remove'
          ? ''
          : form.avatarPreview
        : savedProfile.avatar;

      updateUserSession({
        name: profilePayload.name,
        email: profilePayload.email,
        username: profilePayload.username,
        phone: profilePayload.phone,
        avatar: nextAvatarValue
      });

      const nextSaved = {
        fullName: trimmedProfile.fullName,
        username: trimmedProfile.username,
        email: trimmedProfile.email,
        phone: trimmedProfile.phone,
        avatar: nextAvatarValue
      };

      setSavedProfile(nextSaved);
      setForm({
        ...nextSaved,
        avatarPreview: nextSaved.avatar,
        avatarFile: null,
        avatarAction: 'keep'
      });
      setErrors({});
      setSaveState({ type: 'success', message: text.saveSuccess });
      addToast(text.saveSuccess, 'success');
    } catch (error) {
      const message = error?.message || text.saveError;
      setSaveState({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!user?.id) return;
    const validationErrors = validatePassword();
    setErrors((prev) => ({
      ...prev,
      currentPassword: validationErrors.currentPassword,
      nextPassword: validationErrors.nextPassword,
      confirmPassword: validationErrors.confirmPassword
    }));
    if (Object.keys(validationErrors).length) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.id, { password: passwordForm.next }, user);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setShowPassword({ current: false, next: false, confirm: false });
      setIsPasswordModalOpen(false);
      addToast(text.passwordSuccess, 'success');
    } catch (error) {
      addToast(error?.message || text.saveError, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const closePasswordModal = () => {
    if (isSaving) return;
    setIsPasswordModalOpen(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
    setShowPassword({ current: false, next: false, confirm: false });
    setErrors((prev) => ({ ...prev, currentPassword: '', nextPassword: '', confirmPassword: '' }));
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isInitialLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-14 animate-pulse rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
        <div className="h-52 animate-pulse rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
        <div className="h-64 animate-pulse rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
      </div>
    );
  }

  const emailVerified = Boolean(user?.emailVerified ?? true);

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      {isDirty ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          {text.unsavedAlert}
        </div>
      ) : null}

      {saveState.message ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            saveState.type === 'success'
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : saveState.type === 'error'
                ? 'border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                : 'border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.88)] text-[var(--color-text-secondary)]'
          }`}
        >
          {saveState.message}
        </div>
      ) : null}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden rounded-[1.75rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-card-rgb)/0.96)] p-0 shadow-[0_24px_70px_-42px_rgb(var(--color-primary-rgb)/0.65)]">
          <div className="relative h-28 overflow-hidden bg-[linear-gradient(120deg,rgb(var(--color-primary-rgb)/0.98),rgb(var(--color-primary-rgb)/0.72),rgb(var(--color-primary-rgb)/0.42))] sm:h-32">
            <div className="absolute -end-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 start-1/3 h-44 w-44 rounded-full bg-black/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <UserCircle2 className="h-5 w-5" />
                {text.profileTitle}
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgb(110_231_183/0.16)]" />
                {text.activeAccount}
              </span>
            </div>
          </div>

          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-start">
              <div className="relative -mt-12 shrink-0 sm:-mt-14">
                <div className="rounded-full bg-[var(--color-card)] p-1.5 shadow-[0_16px_40px_-18px_rgb(0_0_0/0.7)]">
                  <img
                    src={displayedAvatar}
                    alt={form.fullName || text.pageTitle}
                    className="h-24 w-24 rounded-full bg-[var(--color-surface)] object-cover sm:h-28 sm:w-28"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 end-1 grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--color-card)] bg-[var(--color-primary)] text-[var(--color-button-text)] shadow-lg transition hover:scale-105 hover:brightness-110"
                  aria-label={text.changePhoto}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1 pt-3 sm:px-5 sm:pb-1">
                <p className="truncate text-xl font-black text-[var(--color-text)] sm:text-2xl">{form.fullName || '---'}</p>
                {form.username && form.username.trim().toLowerCase() !== form.fullName.trim().toLowerCase() ? (
                  <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-primary)]">@{form.username}</p>
                ) : null}
                <p className="mt-1.5 flex items-center justify-center gap-1.5 truncate text-sm text-[var(--color-text-secondary)] sm:justify-start">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{form.email || '---'}</span>
                </p>
              </div>

              <div className="mt-4 flex w-full flex-wrap justify-center gap-2 sm:mt-0 sm:w-auto sm:justify-end sm:pb-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button type="button" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                  {text.changePhoto}
                </Button>
                {(form.avatarPreview || savedProfile.avatar) ? (
                  <Button type="button" variant="outline" onClick={handleRemoveAvatar}>
                    <X className="h-4 w-4" />
                    {text.removePhoto}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] px-4 py-3 text-center text-xs text-[var(--color-muted)] sm:text-start">
              {text.imageHint}
            </div>
            {errors.avatar ? <p className="mt-2 text-center text-xs text-rose-600 dark:text-rose-300 sm:text-start">{errors.avatar}</p> : null}
          </div>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
            <User className="h-[18px] w-[18px] text-[var(--color-primary)]" />
            {text.personalInfo}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={text.fullName}
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              error={errors.fullName}
              placeholder={isEnglish ? 'Enter full name' : 'أدخل الاسم الكامل'}
            />
            <Input
              label={text.username}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              error={errors.username}
              placeholder={isEnglish ? 'Optional username' : 'اسم عرض اختياري'}
            />
          </div>
        </Card>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-button-text)] shadow-[0_10px_24px_-12px_rgb(var(--color-primary-rgb)/0.9)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : text.saveLabel}
          </button>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
              <Mail className="h-[18px] w-[18px] text-[var(--color-primary)]" />
              {text.contactInfo}
            </h2>
            <Badge variant={emailVerified ? 'success' : 'warning'}>
              {emailVerified ? text.emailVerified : text.emailNotVerified}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={`${text.emailAddress} — ${text.emailLocked}`}
              type="email"
              value={form.email}
              disabled
              aria-readonly="true"
              placeholder={isEnglish ? 'name@example.com' : 'name@example.com'}
            />
            <Input
              label={text.phoneNumber}
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              error={errors.phone}
              placeholder={isEnglish ? '+1 555 123 4567' : '+20 100 123 4567'}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">{text.email2faHint}</p>
        </Card>
      </motion.section>

      <motion.section ref={passwordSectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-primary-rgb)/0.06))] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text)]">{text.passwordCard}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text.passwordDescription}</p>
              </div>
            </div>
            <Button type="button" onClick={() => setIsPasswordModalOpen(true)} className="shrink-0">
              <KeyRound className="h-4 w-4" />
              {text.passwordCard}
            </Button>
          </div>
        </Card>
      </motion.section>

      <SaveChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel={text.saveLabel}
        cancelLabel={text.cancelLabel}
        dirtyHint={text.dirtyHint}
        cleanHint={text.cleanHint}
      />

      <div className="h-3" />

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title={text.passwordCard}
        size="md"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closePasswordModal} disabled={isSaving}>
              {text.cancelLabel}
            </Button>
            <Button type="button" onClick={handlePasswordSave} disabled={isSaving}>
              <KeyRound className="h-4 w-4" />
              {isSaving ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : text.passwordSave}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] p-3 text-sm text-[var(--color-text-secondary)]">
            {text.passwordHint}
          </div>
          {[
            { key: 'current', label: text.currentPassword, error: errors.currentPassword },
            { key: 'next', label: text.newPassword, error: errors.nextPassword },
            { key: 'confirm', label: text.confirmPassword, error: errors.confirmPassword }
          ].map((item) => (
            <div key={item.key}>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">{item.label}</label>
              <div className="relative">
                <input
                  type={showPassword[item.key] ? 'text' : 'password'}
                  value={passwordForm[item.key]}
                  autoComplete={item.key === 'current' ? 'current-password' : 'new-password'}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, [item.key]: event.target.value }))}
                  className={`${inputBaseClassName} pl-10 ${item.error ? 'border-[color:rgb(var(--color-error-rgb)/0.85)]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[color:rgb(var(--color-surface-rgb)/0.8)] hover:text-[var(--color-text)]"
                  aria-label={showPassword[item.key] ? (isEnglish ? 'Hide password' : 'إخفاء كلمة المرور') : (isEnglish ? 'Show password' : 'إظهار كلمة المرور')}
                >
                  {showPassword[item.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {item.error ? <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-300">{item.error}</p> : null}
            </div>
          ))}
        </div>
      </Modal>

      <div className="hidden items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        <Mail className="h-3.5 w-3.5" />
        <Phone className="h-3.5 w-3.5" />
        <Save className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};

export default Account;
