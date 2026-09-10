const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { ref, get, set, runTransaction, serverTimestamp } = require('firebase/database');
const admin = require('../functions/node_modules/firebase-admin');
const functions = require('node:module').createRequire(require('node:path').resolve('functions/index.js'))('firebase-functions/v1');
let environment, app, api, publicApi;
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-pawppy', database: { host: '127.0.0.1', port: 9015, rules: fs.readFileSync('database.rules.json', 'utf8') } });
  app = admin.initializeApp({ projectId: 'demo-pawppy', databaseURL: 'http://127.0.0.1:9015?ns=demo-pawppy' }, 'family-tests');
  const deps = { functions, admin: { database: () => app.database() } };
  api = require('../functions/familyApi')(deps);
  publicApi = require('../functions/publicApi')(deps);
});
beforeEach(async () => {
  await environment.clearDatabase();
  await app.database().ref().set({ users: { alice: { displayName: 'Alice', email: 'private@example.test', timeZone: 'Asia/Kolkata' }, bob: { displayName: 'Bob' } }, petOwners: { milo: 'alice' }, userPets: { alice: { milo: { name: 'Milo', type: 'Cat', privacy: { isPrivate: true }, medical: { notes: 'private' }, expenses: { one: 100 } } } }, careRoutines: { alice: { water: { petId: 'milo', title: 'Water', kind: 'water', time: '08:00', startDate: '2026-09-09', active: true, createdAt: Date.now() } } } });
});
after(async () => { await environment?.cleanup(); await app?.delete(); });
const context = uid => ({ auth: { uid } });
const create = role => api.createCareInvitation.run({ role, days: 2 }, context('alice'));
const accept = (invitation, uid = 'bob') => api.acceptCareInvitation.run({ ownerId: 'alice', token: invitation.token }, context(uid));

test('caregiver invitation grants bounded daily care access, preserves private records, and revokes immediately', async () => {
  const invitation = await create('caregiver');
  await accept(invitation);
  await accept(invitation); // A network retry is safe.
  await assert.rejects(accept(invitation, 'charlie'), /expired|revoked|used/);
  const bob = environment.authenticatedContext('bob').database();
  await assertSucceeds(get(ref(bob, 'careRoutines/alice')));
  await assertFails(get(ref(bob, 'userPets/alice/milo')));
  await assertFails(get(ref(bob, 'users/alice')));
  const shared = await api.getSharedCarePets.run({ ownerId: 'alice' }, context('bob'));
  assert.deepEqual(Object.keys(shared.pets.milo).sort(), ['image', 'name', 'type']);
  const record = { petId: 'milo', title: 'Water', status: 'done', updatedBy: 'bob', updatedAt: serverTimestamp(), revision: 1 };
  await assertSucceeds(set(ref(bob, 'careDays/alice/2026-09-09/water'), record));
  await assertFails(set(ref(bob, 'careDays/alice/2026-09-10/water'), { ...record, updatedBy: 'alice' }));
  await api.revokeCareAccess.run({ memberId: 'bob' }, context('alice'));
  await assertFails(get(ref(bob, 'careDays/alice')));
  await assertFails(set(ref(bob, 'careDays/alice/2026-09-10/water'), record));
  await assert.rejects(api.getSharedCarePets.run({ ownerId: 'alice' }, context('bob')), /access has ended/);
  await assert.rejects(accept(invitation), /expired|revoked|used/);
});

test('viewer cannot record care; expired sitter and revoked invite cannot obtain access', async () => {
  await accept(await create('viewer'));
  const bob = environment.authenticatedContext('bob').database();
  await assertSucceeds(get(ref(bob, 'careRoutines/alice')));
  await assertFails(set(ref(bob, 'careDays/alice/2026-09-09/water'), { petId: 'milo', title: 'Water', status: 'done', updatedBy: 'bob', updatedAt: serverTimestamp(), revision: 1 }));
  await accept(await create('sitter'), 'sitter');
  await app.database().ref('careFamilies/alice/members/sitter/expiresAt').set(Date.now() - 1);
  await assertFails(get(ref(environment.authenticatedContext('sitter').database(), 'careRoutines/alice')));
  const invitation = await create('sitter');
  await api.revokeCareAccess.run({ invitationId: invitation.invitationId }, context('alice'));
  await assert.rejects(accept(invitation, 'new-sitter'), /expired|revoked|used/);
  await assert.rejects(api.createCareInvitation.run({ role: 'sitter', days: 100 }, context('alice')), /1 and 30/);
  await assertFails(set(ref(bob, 'careFamilies/alice/members/bob'), { role: 'caregiver', expiresAt: Date.now() + 999999 }));
});

test('public profile responses omit private fields and reject unregistered ownership', async () => {
  assert.equal((await publicApi.getPublicPetProfile.run({ ownerId: 'alice', petId: 'milo' }, {})).pet, null);
  await app.database().ref('userPets/alice/milo/privacy/isPrivate').set(false);
  await app.database().ref('petEvents/milo').set({ private: { type: 'veterinary', title: 'Private visit', visibility: 'public' }, public: { type: 'birthday', title: 'Happy birthday', visibility: 'public' } });
  const profile = await publicApi.getPublicPetProfile.run({ ownerId: 'alice', petId: 'milo' }, {});
  assert.equal(profile.pet.medical, undefined);
  assert.equal(profile.pet.expenses, undefined);
  assert.equal(profile.owner.email, undefined);
  assert.deepEqual(Object.keys(profile.events), ['public']);
  await app.database().ref('petOwners/milo').set('different-owner');
  assert.equal((await publicApi.getPublicPetProfile.run({ ownerId: 'alice', petId: 'milo' }, {})).pet, null);
});

test('conversation summaries include only rooms the caller participates in', async () => {
  await app.database().ref('conversations').set({
    own: { participants: { alice: true, bob: true }, lastMessageText: 'Hello', messages: { one: { text: 'Private history' } } },
    foreign: { participants: { bob: true, charlie: true }, lastMessageText: 'Not for Alice' },
  });
  const result = await publicApi.getMyConversations.run({}, context('alice'));
  assert.deepEqual(Object.keys(result), ['own']);
  assert.equal(result.own.messages, undefined);
  assert.equal(result.own.lastMessageText, 'Hello');
  await assert.rejects(publicApi.getMyConversations.run({}, {}), /Sign in/);
});

test('simultaneous owner and caregiver completions commit only one occurrence', async () => {
  await accept(await create('caregiver'));
  const { nextCareRecord } = await import('../src/domain/care.mjs');
  const results = await Promise.all(['alice', 'bob'].map(uid => {
    const db = environment.authenticatedContext(uid).database();
    return runTransaction(ref(db, 'careDays/alice/2026-09-09/water'), current => nextCareRecord(current, { routine: { petId: 'milo', title: 'Water' }, uid, status: 'done', expectedRevision: 0, timestamp: serverTimestamp() }), { applyLocally: false });
  }));
  assert.equal(results.filter(result => result.committed).length, 1);
  const saved = (await app.database().ref('careDays/alice/2026-09-09/water').once('value')).val();
  assert.equal(saved.revision, 1);
  assert.equal(saved.status, 'done');
  assert.ok(['alice', 'bob'].includes(saved.updatedBy));
});
