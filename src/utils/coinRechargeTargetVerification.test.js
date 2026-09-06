import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoinRechargeVerificationSnapshot, isCoinRechargeTargetField } from './coinRechargeTargetVerification.js';

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

test('recognizes target_uid from a coin-recharge external product ID', () => {
  assert.equal(isCoinRechargeTargetField({ key: 'target_uid' }, { externalProductId: 'coin-recharge-dynamic' }), true);
  assert.equal(isCoinRechargeTargetField({ key: 'target_uid' }, { providerProduct: { externalProductId: 'coin-recharge-dynamic' } }), true);
});

test('recognizes target_uid from the coin-recharge provider code', () => {
  assert.equal(isCoinRechargeTargetField({ key: 'target_uid' }, { providerCode: 'coin-recharge' }), true);
});

test('recognizes target_uid from the coin-recharge verification type', () => {
  assert.equal(isCoinRechargeTargetField({ key: 'target_uid', verification: { type: 'coin_recharge_target' } }, {}), true);
});

test('does not classify target_uid for an unrelated product', () => {
  assert.equal(isCoinRechargeTargetField({ key: 'target_uid' }, { externalProductId: 'ordinary-product' }), false);
});

test('does not classify non-target_uid fields on coin recharge products', () => {
  assert.equal(isCoinRechargeTargetField({ key: 'player_id' }, { externalProductId: 'coin-recharge-dynamic' }), false);
});
