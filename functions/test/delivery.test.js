const test = require('node:test');
const assert = require('node:assert/strict');
const { deliverOnce } = require('../domain/delivery');

function database(initial) {
  let value = initial;
  return { value: () => value, ref: () => ({
    async transaction(change) {
      const next = change(value);
      if (next === undefined) return { committed: false };
      value = next;
      return { committed: true };
    },
    async update(patch) { value = { ...value, ...patch }; },
  }) };
}

test('overlapping workers claim once, and accepted deliveries are not resent', async () => {
  const db = database();
  let calls = 0;
  const send = async () => { calls++; return { success: true }; };
  await Promise.all([deliverOnce(db, 'same', send, 1000), deliverOnce(db, 'same', send, 1000)]);
  await deliverOnce(db, 'same', send, 200000);
  assert.equal(calls, 1);
  assert.equal(db.value().status, 'accepted');
});

test('rejected provider attempts can retry and stale leases can be recovered', async () => {
  const db = database();
  await deliverOnce(db, 'same', async () => ({ success: false }), 1000);
  assert.equal(db.value().status, 'failed');
  await deliverOnce(db, 'same', async () => ({ success: true }), 2000);
  assert.equal(db.value().status, 'accepted');
  assert.equal(db.value().attempts, 2);
  const stale = database({ status: 'sending', leaseUntil: 999, attempts: 1 });
  await deliverOnce(stale, 'same', async () => ({ success: true }), 1000);
  assert.equal(stale.value().status, 'accepted');
});
