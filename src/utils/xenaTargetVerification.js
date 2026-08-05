const XENA_PROVIDER_CODE = 'xena-recharge';
const XENA_TARGET_FIELD_KEY = 'target_uid';
const XENA_TARGET_TYPE = 'xena_target';

const XENA_ERROR_MESSAGES = {
  XENA_TARGET_INVALID: {
    ar: 'معرّف Xena غير صحيح أو غير موجود.',
    en: 'Xena ID is invalid or does not exist.',
  },
  XENA_REAUTHENTICATION_REQUIRED: {
    ar: 'خدمة Xena تحتاج إلى إعادة تسجيل الدخول من الإدارة.',
    en: 'Xena needs an admin to sign in again.',
  },
  XENA_PROVIDER_AUTH_FAILED: {
    ar: 'إعدادات مزود Xena تحتاج إلى مراجعة من الإدارة.',
    en: 'Xena provider settings need admin review.',
  },
  XENA_RATE_LIMITED: {
    ar: 'التحقق مشغول مؤقتًا، حاول مرة أخرى بعد قليل.',
    en: 'Verification is temporarily busy. Try again shortly.',
  },
  XENA_VERIFICATION_UNAVAILABLE: {
    ar: 'تعذر التحقق من Xena مؤقتًا، حاول مرة أخرى.',
    en: 'Xena verification is temporarily unavailable. Try again.',
  },
};

const FALLBACK_ERROR = {
  ar: 'تعذر التحقق من Xena مؤقتًا، حاول مرة أخرى.',
  en: 'Xena verification is temporarily unavailable. Try again.',
};

export const normalizeXenaTargetUid = (value) => String(value ?? '').trim();

const firstNonEmptyText = (...values) => (
  values
    .map((value) => String(value ?? '').trim())
    .find(Boolean) || ''
);

/**
 * Normalizes the safe profile returned by Xena verification without inventing
 * any missing display data. The documented field is `nickname`; aliases are
 * accepted defensively because some backend envelopes use generic user names.
 */
export const normalizeXenaVerifiedUser = (payload = {}, fallbackTargetUid = '') => {
  const candidates = [
    payload?.user,
    payload?.targetUser,
    payload?.profile,
    payload?.account,
    payload?.verification?.user,
    payload?.data?.user,
  ];
  const user = candidates.find((candidate) => (
    candidate && typeof candidate === 'object' && !Array.isArray(candidate)
  )) || {};

  return {
    uid: firstNonEmptyText(
      user?.uid,
      user?.targetUid,
      user?.userId,
      payload?.targetUid,
      payload?.uid,
      fallbackTargetUid
    ),
    nickname: firstNonEmptyText(
      user?.nickname,
      user?.displayName,
      user?.display_name,
      user?.name,
      user?.username,
      payload?.nickname,
      payload?.displayName,
      payload?.name,
      payload?.username
    ),
    avatar: firstNonEmptyText(user?.avatar, user?.avatarUrl, payload?.avatar) || null,
    country: firstNonEmptyText(user?.country, user?.countryCode, payload?.country),
  };
};

export const getXenaVerifiedUserName = (payload = {}) => (
  normalizeXenaVerifiedUser(payload).nickname
);

export const getXenaTargetErrorMessage = (code, language = 'ar') => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const messages = XENA_ERROR_MESSAGES[normalizedCode] || FALLBACK_ERROR;
  return messages[language === 'en' ? 'en' : 'ar'];
};

export const validateXenaTargetUid = (value, language = 'ar') => {
  const targetUid = normalizeXenaTargetUid(value);
  if (!targetUid) {
    return {
      valid: false,
      targetUid,
      message: language === 'en' ? 'Xena ID is required.' : 'يرجى إدخال Xena ID',
    };
  }
  if (!/^\d+$/.test(targetUid) || targetUid.length > 50) {
    return {
      valid: false,
      targetUid,
      message: language === 'en'
        ? 'Xena ID must contain digits only and be at most 50 characters.'
        : 'يجب أن يحتوي Xena ID على أرقام فقط وبحد أقصى 50 رقمًا.',
    };
  }
  return { valid: true, targetUid, message: '' };
};

export const isXenaTargetField = (field = {}, product = {}) => {
  const key = String(field?.key || field?.name || field?.id || '').trim();
  if (key !== XENA_TARGET_FIELD_KEY) return false;

  const providerCode = String(product?.providerCode || product?.supplierCode || '').trim().toLowerCase();
  const verification = field?.verification || {};
  const verificationType = String(verification?.type || field?.verificationType || '').trim().toLowerCase();

  return Boolean(
    providerCode === XENA_PROVIDER_CODE
    || field?.verifiable === true
    || verification?.required === true
    || verificationType === XENA_TARGET_TYPE
  );
};

export const getXenaTargetField = (fields = [], product = {}) => (
  (Array.isArray(fields) ? fields : []).find((field) => isXenaTargetField(field, product)) || null
);

export const isXenaVerificationSatisfied = ({ fieldValue, verification }) => {
  const targetUid = normalizeXenaTargetUid(fieldValue);
  return Boolean(
    targetUid
    && verification?.status === 'success'
    && verification?.targetUid === targetUid
  );
};

export const makeXenaVerificationRequestBody = (targetUid) => ({
  targetUid: normalizeXenaTargetUid(targetUid),
});
