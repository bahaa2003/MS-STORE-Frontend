import assert from 'node:assert/strict';
import test from 'node:test';
import { isSessionTokenAuthError } from './httpAuthError.js';

const makeError = ({ status = 401, code = '', message = 'Unauthorized', url = '/me' } = {}) => ({
  config: { url },
  response: { status, data: { code, message } },
});

test('does not treat provider balance authentication failures as an expired admin session', () => {
  assert.equal(isSessionTokenAuthError(makeError({ url: '/admin/providers/provider-1/balance' })), false);
  assert.equal(isSessionTokenAuthError(makeError({
    code: 'XENA_PROVIDER_AUTH_FAILED',
    url: '/admin/providers/provider-1/xena/challenge',
  })), false);
});

test('still detects real application token failures', () => {
  assert.equal(isSessionTokenAuthError(makeError()), true);
  assert.equal(isSessionTokenAuthError(makeError({
    code: 'TOKEN_EXPIRED',
    message: 'Access token expired',
    url: '/admin/providers/provider-1/balance',
  })), true);
});
