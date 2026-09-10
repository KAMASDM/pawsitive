const test = require('node:test');
const assert = require('node:assert/strict');
const { publicPet, publicUser, publicEvents, publicPosts, ownershipIndex } = require('../domain/publicProfiles');

test('public profiles cannot expose care, expense, token, or exact location fields', () => {
  const pet = { name: 'Milo', vaccinations: [{ name: 'private' }], medical: { notes: 'private' }, expenses: { one: 50 }, location: { latitude: 19.12345, longitude: 72.12345 }, privacy: { shareLocation: true }, unexpected: 'private' };
  const safe = publicPet(pet, 'alice', 'milo');
  assert.equal(safe.medical, undefined);
  assert.equal(safe.expenses, undefined);
  assert.equal(safe.unexpected, undefined);
  assert.equal(safe.vaccinations, undefined);
  assert.deepEqual(safe.location, { latitude: 19.12, longitude: 72.12 });
  assert.equal(publicPet({ ...pet, privacy: { isPrivate: true } }, 'alice', 'milo'), null);
  assert.equal(publicPet({ ...pet, privacy: {} }, 'alice', 'milo').location, undefined);
  assert.deepEqual(publicUser({ displayName: 'Asha', email: 'private', fcmToken: 'secret' }), { displayName: 'Asha' });
});

test('only explicitly published non-medical events are shared', () => {
  const safe = publicEvents({ old: { type: 'birthday' }, medical: { type: 'veterinary', visibility: 'public' }, visit: { type: 'vet-visit', visibility: 'public' }, published: { type: 'birthday', visibility: 'public', title: 'Birthday' } });
  assert.deepEqual(Object.keys(safe), ['published']);
});

test('public comments do not leak the legacy author email', () => {
  const safe = publicPosts({ p: { comments: { c: { text: 'Hello', userEmail: 'private', userId: 'alice' } } } });
  assert.equal(safe.p.comments.c.userEmail, undefined);
  assert.equal(safe.p.comments.c.text, 'Hello');
});

test('migration refuses ambiguous pet ownership', () => {
  assert.deepEqual(ownershipIndex({ alice: { one: {} }, bob: { two: {} } }), { one: 'alice', two: 'bob' });
  assert.throws(() => ownershipIndex({ alice: { same: {} }, bob: { same: {} } }), /Duplicate pet IDs/);
});
