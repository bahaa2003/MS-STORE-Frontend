import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeXenaOtpDigits, splitXenaOtpDigits } from './xenaOtp.js';

test('normalizes Arabic and Persian OTP digits to English digits', () => {
  assert.equal(normalizeXenaOtpDigits('١٢٣٤'), '1234');
  assert.equal(normalizeXenaOtpDigits('۱۲۳۴'), '1234');
});

test('removes non-digits and returns an iterable digit list for OTP distribution', () => {
  assert.deepEqual(splitXenaOtpDigits('1a٢-3٤', 4), ['1', '2', '3', '4']);
  assert.deepEqual(splitXenaOtpDigits('123456', 4), ['1', '2', '3', '4']);
});
