const SESSION_TOKEN_CODES = new Set([
  'auth_token_invalid',
  'invalid_token',
  'jwt_expired',
  'token_expired',
]);

const EXTERNAL_AUTH_CODE_PREFIXES = ['xena_', 'provider_', 'supplier_', 'digiteech_'];

const isProviderOperationUrl = (url) => {
  const value = String(url || '').toLowerCase();
  return (
    /\/admin\/providers\/[^/]+\/(?:balance|check-order|products|test-connection|xena)(?:\/|\?|$)/.test(value)
    || value.includes('/admin/catalog/sync/')
  );
};

const getResponseData = (error) => {
  const data = error?.response?.data;
  return data && typeof data === 'object' ? data : {};
};

export const getHttpErrorCode = (error) => {
  const data = getResponseData(error);
  const nested = data?.data && typeof data.data === 'object' ? data.data : {};
  return String(data.code || nested.code || error?.code || '').trim();
};

export const getHttpErrorMessage = (error) => {
  const data = getResponseData(error);
  const nested = data?.data && typeof data.data === 'object' ? data.data : {};
  const directError = typeof data.error === 'string' ? data.error : data.error?.message;
  return String(data.message || nested.message || directError || error?.message || '').trim();
};

export const isSessionTokenAuthError = (error) => {
  const status = Number(error?.response?.status || error?.status || 0);
  const code = getHttpErrorCode(error).toLowerCase();
  const message = getHttpErrorMessage(error).toLowerCase();
  const url = error?.config?.url || error?.response?.config?.url || '';

  const hasExplicitTokenFailure = (
    (/jwt|access token|auth token/.test(message) && /expired|invalid|missing|malformed|revoked/.test(message))
    || SESSION_TOKEN_CODES.has(code)
  );
  if (hasExplicitTokenFailure) return true;

  if (status !== 401) return false;

  const isExternalAuthFailure = EXTERNAL_AUTH_CODE_PREFIXES.some((prefix) => code.startsWith(prefix));
  if (isExternalAuthFailure || isProviderOperationUrl(url)) return false;

  return true;
};
