import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoinRechargeVerificationSnapshot } from './coinRechargeTargetVerification.js';

test('verified coin-recharge purchase creates a normalized verification snapshot', () => {
  const snapshot = createCoinRechargeVerificationSnapshot({
    required: true,
    ready: true,
    verification: {
      status: 'success',
      targetUid: '001234567890123456789',
      user: { userId: '1234567890123456789', nickName: 'Verified player', avatar: 'https://example.test/avatar.png' },
    },
  });

  assert.deepEqual(snapshot, {
    type: 'coin_recharge_target',
    targetUid: '001234567890123456789',
    user: { userId: '1234567890123456789', nickName: 'Verified player', avatar: 'https://example.test/avatar.png' },
  });
});
