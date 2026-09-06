import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getXenaTargetErrorMessage,
  getXenaTargetField,
  isXenaTargetField,
  isXenaVerificationSatisfied,
  makeXenaVerificationRequestBody,
  normalizeXenaTargetUid,
  normalizeXenaVerifiedUser,
  validateXenaTargetUid,
} from './xenaTargetVerification.js';

test('detects target_uid on a dynamic Xena product by external product ID', () => {
  assert.equal(isXenaTargetField(
    { key: 'target_uid' },
    { externalProductId: 'xena-dynamic-recharge' }
  ), true);
});

test('detects target_uid on a dynamic Xena product by nested provider product ID', () => {
  assert.equal(isXenaTargetField(
    { key: 'target_uid' },
    { providerProduct: { externalProductId: 'xena-dynamic-recharge' } }
  ), true);
});

test('continues to detect target_uid by Xena provider code', () => {
  assert.equal(isXenaTargetField(
    { key: 'target_uid' },
    { providerCode: 'xena-recharge' }
  ), true);
});

test('continues to detect target_uid by Xena verification metadata', () => {
  assert.equal(isXenaTargetField(
    { key: 'target_uid', verification: { required: true, type: 'xena_target' } },
    {}
  ), true);
});

test('does not detect a non-target field on a Xena product', () => {
  assert.equal(isXenaTargetField(
    { key: 'player_id' },
    { externalProductId: 'xena-dynamic-recharge', providerCode: 'xena-recharge' }
  ), false);
});

test('does not detect an unrelated normal field and product', () => {
  assert.equal(isXenaTargetField(
    { key: 'account_id' },
    { externalProductId: 'normal-recharge' }
  ), false);
});

test('detects Xena target field from public product verification metadata', () => {
  const product = { providerCode: 'xena-recharge' };
  const fields = [
    { key: 'player_id', type: 'text' },
    {
      key: 'target_uid',
      type: 'text',
      required: true,
      verifiable: true,
      verification: { required: true, type: 'xena_target' },
    },
  ];

  assert.equal(getXenaTargetField(fields, product)?.key, 'target_uid');
});

test('normalizes and validates Xena target uid as a string with leading zeroes preserved', () => {
  const value = ' 001234 ';
  assert.equal(normalizeXenaTargetUid(value), '001234');
  const validation = validateXenaTargetUid(value, 'en');
  assert.deepEqual(validation, { valid: true, targetUid: '001234', message: '' });
  assert.equal(typeof validation.targetUid, 'string');
});

test('rejects empty, letters, and overlong Xena target uid before verification', () => {
  assert.equal(validateXenaTargetUid('', 'en').valid, false);
  assert.equal(validateXenaTargetUid('12A34', 'en').valid, false);
  assert.equal(validateXenaTargetUid('1'.repeat(51), 'en').valid, false);
});

test('verification request body sends only targetUid', () => {
  const body = makeXenaVerificationRequestBody(' 001234 ');
  assert.deepEqual(body, { targetUid: '001234' });
  assert.equal(Object.hasOwn(body, 'connectionId'), false);
  assert.equal(Object.hasOwn(body, 'apiKey'), false);
  assert.equal(Object.hasOwn(body, 'verified'), false);
});

test('verification is satisfied only for the exact normalized uid', () => {
  assert.equal(isXenaVerificationSatisfied({
    fieldValue: '001234',
    verification: { status: 'success', targetUid: '001234' },
  }), true);
  assert.equal(isXenaVerificationSatisfied({
    fieldValue: '001235',
    verification: { status: 'success', targetUid: '001234' },
  }), false);
  assert.equal(isXenaVerificationSatisfied({
    fieldValue: '001234',
    verification: { status: 'error', targetUid: '001234' },
  }), false);
});

test('keeps the verified Xena nickname and accepts safe backend name aliases', () => {
  assert.deepEqual(normalizeXenaVerifiedUser({
    targetUid: '32668525',
    user: { uid: '32668525', nickname: 'Xena Player', country: 'EG' },
  }), {
    uid: '32668525',
    nickname: 'Xena Player',
    avatar: null,
    country: 'EG',
  });

  assert.equal(normalizeXenaVerifiedUser({
    user: { uid: '32668525', displayName: 'Displayed Player' },
  }).nickname, 'Displayed Player');
});

test('maps normalized Xena error codes to customer-safe Arabic messages', () => {
  assert.equal(getXenaTargetErrorMessage('XENA_TARGET_INVALID', 'ar'), 'معرّف Xena غير صحيح أو غير موجود.');
  assert.equal(getXenaTargetErrorMessage('XENA_REAUTHENTICATION_REQUIRED', 'ar'), 'خدمة Xena تحتاج إلى إعادة تسجيل الدخول من الإدارة.');
  assert.equal(getXenaTargetErrorMessage('XENA_PROVIDER_AUTH_FAILED', 'ar'), 'إعدادات مزود Xena تحتاج إلى مراجعة من الإدارة.');
  assert.equal(getXenaTargetErrorMessage('XENA_RATE_LIMITED', 'ar'), 'التحقق مشغول مؤقتًا، حاول مرة أخرى بعد قليل.');
  assert.equal(getXenaTargetErrorMessage('XENA_VERIFICATION_UNAVAILABLE', 'ar'), 'تعذر التحقق من Xena مؤقتًا، حاول مرة أخرى.');
});
