const COIN_RECHARGE_PROVIDER_CODE = 'coin-recharge';
const COIN_RECHARGE_TARGET_TYPE = 'coin_recharge_target';

export const normalizeCoinRechargeTargetUid = (value) => String(value ?? '').trim();

export const validateCoinRechargeTargetUid = (value, language = 'ar') => {
  const targetUid = normalizeCoinRechargeTargetUid(value);
  if (!targetUid) return { valid: false, targetUid, message: language === 'en' ? 'User ID is required.' : 'يرجى إدخال معرّف المستخدم.' };
  if (!/^\d+$/.test(targetUid) || targetUid.length > 50) {
    return { valid: false, targetUid, message: language === 'en' ? 'User ID must contain digits only and be at most 50 characters.' : 'يجب أن يحتوي معرّف المستخدم على أرقام فقط وبحد أقصى 50 رقمًا.' };
  }
  return { valid: true, targetUid, message: '' };
};

export const isCoinRechargeTargetField = (field = {}, product = {}) => {
  const key = String(field?.key || field?.name || field?.id || '').trim();
  if (key !== 'target_uid') return false;
  const providerCode = String(product?.providerCode || product?.supplierCode || '').trim().toLowerCase();
  const verification = field?.verification || {};
  const type = String(verification?.type || field?.verificationType || '').trim().toLowerCase();
  return providerCode === COIN_RECHARGE_PROVIDER_CODE || type === COIN_RECHARGE_TARGET_TYPE;
};

export const getCoinRechargeTargetField = (fields = [], product = {}) => (
  (Array.isArray(fields) ? fields : []).find((field) => isCoinRechargeTargetField(field, product)) || null
);

export const isCoinRechargeVerificationSatisfied = ({ fieldValue, verification }) => {
  const targetUid = normalizeCoinRechargeTargetUid(fieldValue);
  return Boolean(targetUid && verification?.status === 'success' && verification?.targetUid === targetUid);
};

export const normalizeCoinRechargeVerifiedUser = (payload = {}, fallbackTargetUid = '') => {
  const user = payload?.user && typeof payload.user === 'object' ? payload.user : {};
  return {
    userId: String(user.userId ?? fallbackTargetUid ?? ''),
    nickName: user.nickName ? String(user.nickName) : null,
    avatar: user.avatar ? String(user.avatar) : null,
  };
};

export const createCoinRechargeVerificationSnapshot = ({ required, ready, verification } = {}) => {
  if (!required || !ready) return null;
  return {
    type: COIN_RECHARGE_TARGET_TYPE,
    targetUid: verification?.targetUid,
    user: normalizeCoinRechargeVerifiedUser(verification, verification?.targetUid),
  };
};
