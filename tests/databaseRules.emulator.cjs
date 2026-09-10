const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { ref, set, get, serverTimestamp, remove, update } = require('firebase/database');
let environment;

before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-pawppy', database: { host: '127.0.0.1', port: 9015, rules: fs.readFileSync('database.rules.json', 'utf8') } });
});
beforeEach(async () => { await environment.clearDatabase(); });
after(async () => { await environment?.cleanup(); });

const event = () => ({ name: 'session_started', screen: 'pets', platform: 'installed', sessionId: 'local-test-session', timestamp: serverTimestamp() });

test('signed-in accounts can append only their own allowlisted activity', async () => {
  const db = environment.authenticatedContext('alice').database();
  await assertSucceeds(set(ref(db, 'productEvents/alice/one'), event()));
  await assertFails(set(ref(db, 'productEvents/bob/one'), event()));
  await assertFails(set(ref(db, 'productEvents/alice/two'), { ...event(), notes: 'private care content' }));
  await assertFails(set(ref(db, 'productEvents/alice/three'), { ...event(), name: 'arbitrary_event' }));
  await assertFails(set(ref(db, 'productEvents/alice/four'), { ...event(), timestamp: 0 }));
  await assertFails(remove(ref(db, 'productEvents/alice/one')));
});

test('activity is not readable by visitors, other users, or reporting clients', async () => {
  const alice = environment.authenticatedContext('alice').database();
  await assertSucceeds(set(ref(alice, 'productEvents/alice/one'), event()));
  await assertFails(get(ref(alice, 'productEvents/alice')));
  await assertFails(get(ref(environment.authenticatedContext('bob').database(), 'productEvents/alice')));
  await assertFails(get(ref(environment.unauthenticatedContext().database(), 'productEvents')));
  await assertFails(set(ref(environment.unauthenticatedContext().database(), 'productEvents/alice/two'), event()));
});

test('measurement opt-out is enforced on the server, including other devices', async () => {
  const alice = environment.authenticatedContext('alice').database();
  await assertSucceeds(set(ref(alice, 'users/alice/productMeasurementEnabled'), false));
  await assertFails(set(ref(alice, 'productEvents/alice/one'), event()));
});

test('device registry and delivery logs cannot be forged or inspected across accounts', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), 'notificationDevices/alice/device'), { token: 'test-only' });
  });
  const alice = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  await assertSucceeds(get(ref(alice, 'notificationDevices/alice')));
  await assertFails(get(ref(bob, 'notificationDevices/alice')));
  await assertFails(set(ref(alice, 'notificationDevices/alice/forged'), { token: 'fake' }));
  await assertFails(set(ref(alice, 'notificationDeliveries/alice/fake'), { status: 'accepted' }));
  await assertFails(get(ref(alice, 'notificationInstallations')));
});

test('care records and private events remain private even when the pet has a public profile', async () => {
  const alice = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  const visitor = environment.unauthenticatedContext().database();
  await assertSucceeds(update(ref(alice), { 'petOwners/milo': 'alice', 'userPets/alice/milo': { name: 'Milo', privacy: { isPrivate: false }, medical: { notes: 'private' }, expenses: { one: 20 } } }));
  await assertSucceeds(set(ref(alice, 'petEvents/milo/visit'), { title: 'Care visit', date: '2026-09-09', type: 'veterinary', timestamp: 1 }));
  await assertSucceeds(get(ref(alice, 'userPets/alice/milo')));
  await assertFails(get(ref(bob, 'userPets/alice')));
  await assertFails(get(ref(visitor, 'userPets/alice/milo')));
  await assertFails(get(ref(visitor, 'petEvents/milo')));
  await assertFails(get(ref(bob, 'petEvents/milo')));
  await assertFails(get(ref(bob, 'users/alice')));
});

test('a second account cannot claim an existing pet ID or spoof its slug', async () => {
  const alice = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  await assertSucceeds(update(ref(alice), { 'petOwners/milo': 'alice', 'userPets/alice/milo': { name: 'Milo' } }));
  await assertFails(update(ref(bob), { 'petOwners/milo': 'bob', 'userPets/bob/milo': { name: 'Imposter' } }));
  await assertFails(set(ref(bob, 'userPets/bob/milo'), { name: 'Imposter' }));
  await assertFails(set(ref(bob, 'petSlugs/pretend'), { userId: 'bob', petId: 'milo' }));
  await assertSucceeds(set(ref(alice, 'petSlugs/milo'), { userId: 'alice', petId: 'milo' }));
  await assertFails(set(ref(bob, 'petSlugs/milo'), { userId: 'bob', petId: 'milo' }));
});

test('care routines and occurrences enforce ownership, attribution, and revision checks', async () => {
  const alice = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  await update(ref(alice), { 'petOwners/milo': 'alice', 'userPets/alice/milo': { name: 'Milo' } });
  const routine = { petId: 'milo', title: 'Water', kind: 'water', time: '08:00', startDate: '2026-09-09', active: true, createdAt: serverTimestamp() };
  await assertSucceeds(set(ref(alice, 'careRoutines/alice/water'), routine));
  await assertFails(set(ref(bob, 'careRoutines/alice/other'), routine));
  await assertFails(set(ref(alice, 'careRoutines/alice/missing'), { ...routine, petId: 'not-owned' }));
  const path = 'careDays/alice/2026-09-09/water';
  const record = { petId: 'milo', title: 'Water', status: 'done', updatedBy: 'alice', updatedAt: serverTimestamp(), revision: 1 };
  await assertSucceeds(set(ref(alice, path), record));
  await assertFails(get(ref(bob, 'careDays/alice')));
  await assertFails(get(ref(environment.unauthenticatedContext().database(), 'careRoutines/alice')));
  await assertFails(set(ref(alice, path), record));
  await assertFails(set(ref(alice, path), { ...record, status: 'open', revision: 2, updatedBy: 'bob' }));
  await assertSucceeds(set(ref(alice, path), { ...record, status: 'open', revision: 2 }));
  await assertFails(set(ref(alice, path), { ...record, revision: 2 }));
  await assertSucceeds(update(ref(alice, 'careRoutines/alice/water'), { active: false }));
  await assertFails(set(ref(alice, path), { ...record, revision: 3 }));
  await assertFails(remove(ref(alice, path)));
});

test('private conversations are readable only by participants and cannot be taken over', async () => {
  const alice = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  const stranger = environment.authenticatedContext('stranger').database();
  const path = 'conversations/alice_bob';
  await assertSucceeds(set(ref(alice, path), { participants: { alice: true, bob: true }, messages: { one: { senderId: 'alice', text: 'Private conversation', timestamp: Date.now() } } }));
  await assertSucceeds(get(ref(bob, path)));
  await assertFails(get(ref(stranger, path)));
  await assertFails(get(ref(alice, 'conversations')));
  await assertFails(update(ref(stranger, path), { participants: { stranger: true, alice: true } }));
  await assertFails(update(ref(alice, path), { participants: { alice: true, stranger: true } }));
  await assertFails(set(ref(bob, `${path}/messages/fake`), { senderId: 'alice', text: 'Forged sender', timestamp: Date.now() }));
  await assertSucceeds(set(ref(bob, `${path}/messages/two`), { senderId: 'bob', text: 'Reply', timestamp: Date.now() }));
});
