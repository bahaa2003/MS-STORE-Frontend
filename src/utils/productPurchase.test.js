import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProductOrderFields } from './productPurchase.js';

test('public Xena product orderFields retain verification metadata and do not inject generic playerId', () => {
  const fields = resolveProductOrderFields({
    providerCode: 'xena-recharge',
    orderFields: [{
      key: 'target_uid',
      label: 'Xena ID',
      type: 'text',
      required: true,
      verifiable: true,
      verification: { required: true, type: 'xena_target' },
      validation: { digitsOnly: true, minLength: 1, maxLength: 50 },
    }],
  }, 'en');

  assert.equal(fields.length, 1);
  assert.equal(fields[0].key, 'target_uid');
  assert.equal(fields[0].verifiable, true);
  assert.deepEqual(fields[0].verification, { required: true, type: 'xena_target' });
  assert.deepEqual(fields[0].validation, { digitsOnly: true, minLength: 1, maxLength: 50 });
});

test('non-Xena products without field mappings still get the legacy playerId field', () => {
  const fields = resolveProductOrderFields({
    orderFields: [{
      key: 'server',
      label: 'Server',
      type: 'text',
      required: true,
    }],
  }, 'en');

  assert.equal(fields[0].key, 'playerId');
  assert.equal(fields[1].key, 'server');
});

