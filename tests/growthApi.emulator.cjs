const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { ref, get, set, serverTimestamp } = require('firebase/database');
const admin = require('../functions/node_modules/firebase-admin');
const functions = require('node:module').createRequire(require('node:path').resolve('functions/index.js'))('firebase-functions/v1');
let environment, app, api, family;
const context = uid => ({ auth: { uid } });
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-pawppy', database: { host: '127.0.0.1', port: 9015, rules: fs.readFileSync('database.rules.json', 'utf8') } });
  app = admin.initializeApp({ projectId: 'demo-pawppy', databaseURL: 'http://127.0.0.1:9015?ns=demo-pawppy' }, 'growth-tests');
  const deps = { functions, admin: { database: () => app.database() }, now: () => Date.parse('2026-10-24T12:00:00Z') };
  api = require('../functions/growthApi')(deps); family = require('../functions/familyApi')(deps);
});
beforeEach(async () => {
  await environment.clearDatabase();
  await app.database().ref().set({ users: { alice: { displayName: 'Alice', email: 'private@example.test', timeZone: 'UTC' }, bob: { displayName: 'Bob' } }, petOwners: { milo: 'alice' }, userPets: { alice: { milo: { name: 'Milo', type: 'Dog', breed: 'Lab', privacy: { isPrivate: true }, medical: { notes: 'private' } } } }, careRoutines: { alice: { water: { petId: 'milo', title: 'Water', kind: 'water', time: '08:00', startDate: '2020-01-01', active: true, createdAt: Date.now() } } }, careDays: { alice: { '2026-10-24': { water: { petId: 'milo', title: 'Water', status: 'done', updatedBy: 'alice', revision: 1, updatedAt: Date.now() } } } } });
});
after(async () => { await environment?.cleanup(); await app?.delete(); });
const safety = { petId: 'milo', enabled: true, phone: '+91 9999999999', email: '', contactName: 'Alice', message: 'Please call.', shareBreed: false, sharePhoto: false };

test('anonymous safety links expose only opted-in contact fields and revoke on disable or pet deletion', async () => {
  await assert.rejects(api.saveSafetyCard.run(safety, {}), /Sign in/);
  await assert.rejects(api.saveSafetyCard.run(safety, context('bob')), /owner/);
  const saved = await api.saveSafetyCard.run(safety, context('alice'));
  const card = await api.getSafetyCard.run({ token: saved.token }, {});
  assert.equal(card.phone, safety.phone); assert.equal(card.name, 'Milo'); assert.equal(card.breed, undefined); assert.equal(card.medical, undefined); assert.equal(card.ownerId, undefined);
  await assertFails(get(ref(environment.unauthenticatedContext().database(), `petSafetyCards/alice/milo`)));
  await assertFails(set(ref(environment.authenticatedContext('alice').database(), `safetyCardLinks/${saved.token}`), { ownerId: 'bob', petId: 'milo' }));
  const disabled = await api.saveSafetyCard.run({ ...safety, enabled: false }, context('alice'));
  assert.equal(disabled.token, saved.token); assert.equal(await api.getSafetyCard.run({ token: saved.token }, {}), null);
  await api.saveSafetyCard.run(safety, context('alice')); await app.database().ref('userPets/alice/milo').remove();
  assert.equal(await api.getSafetyCard.run({ token: saved.token }, {}), null);
});

test('weekly links are owner-scoped, retry-safe, revocable, and omit private events', async () => {
  const requestId = require('node:crypto').randomBytes(32).toString('base64url');
  await app.database().ref('petEvents/milo').set({ birthday: { type: 'birthday', title: 'One today', date: '2026-10-24', timestamp: 1 }, vet: { type: 'veterinary', title: 'Private', date: '2026-10-24', timestamp: 2 } });
  const input = { petId: 'milo', requestId, caption: 'A good week', includeCareCount: true, milestoneIds: ['birthday', 'vet'], photo: '' };
  await assert.rejects(api.publishWeeklyCard.run(input, context('bob')), /owner/);
  const saved = await api.publishWeeklyCard.run(input, context('alice'));
  assert.equal(saved.card.careCount, 1); assert.deepEqual(saved.card.milestones, ['One today']);
  const retry = await api.publishWeeklyCard.run({ ...input, caption: 'A changed draft must use a new token' }, context('alice'));
  assert.equal(retry.card.caption, 'A good week');
  assert.equal((await api.listMyWeeklyCards.run({ petId: 'milo' }, context('alice'))).length, 1);
  await assert.rejects(api.revokeWeeklyCard.run({ token: requestId }, context('bob')), /own/);
  await api.revokeWeeklyCard.run({ token: requestId }, context('alice'));
  assert.equal(await api.getWeeklyCard.run({ token: requestId }, {}), null);
  await assert.rejects(api.publishWeeklyCard.run(input, context('alice')), /revoked/);
});

test('handover and photo updates respect viewer roles, identity, expiry, revocation and field limits', async () => {
  const owner = environment.authenticatedContext('alice').database();
  const bob = environment.authenticatedContext('bob').database();
  const invite = await family.createCareInvitation.run({ role: 'sitter', days: 2 }, context('alice'));
  const preview = await family.previewCareInvitation.run({ ownerId: 'alice', token: invite.token }, {});
  assert.equal(preview.ownerName, 'Alice'); assert.equal(preview.accessDays, 2); assert.equal(preview.email, undefined); assert.equal(preview.pets, undefined);
  await family.acceptCareInvitation.run({ ownerId: 'alice', token: invite.token }, context('bob'));
  const handover = { feeding: 'Use the labelled food.', routineNotes: 'A quiet corner.', emergencyName: 'Alice', emergencyPhone: '123456789', extraNotes: '', updatedAt: serverTimestamp() };
  await assertSucceeds(set(ref(owner, 'careHandovers/alice/milo'), handover));
  await assertSucceeds(get(ref(bob, 'careHandovers/alice')));
  await assertFails(set(ref(bob, 'careHandovers/alice/milo'), handover));
  const note = { authorId: 'bob', note: 'Fresh water given.', photo: '', updatedAt: serverTimestamp() };
  await assertSucceeds(set(ref(bob, 'careUpdates/alice/2026-10-24/water'), note));
  await assertFails(set(ref(bob, 'careUpdates/alice/2026-10-24/water'), { ...note, authorId: 'alice' }));
  await assertFails(set(ref(bob, 'careUpdates/alice/2026-10-24/water'), { ...note, photo: 'https://example.test/private-file' }));
  await assertFails(set(ref(owner, 'careHandovers/alice/milo'), { ...handover, medicalRecords: 'not allowed' }));
  await family.revokeCareAccess.run({ memberId: 'bob' }, context('alice'));
  await assertFails(get(ref(bob, 'careHandovers/alice'))); await assertFails(get(ref(bob, 'careUpdates/alice')));
  await assertFails(set(ref(bob, 'careUpdates/alice/2026-10-24/water'), note));
  const viewerInvite = await family.createCareInvitation.run({ role: 'viewer' }, context('alice'));
  await family.acceptCareInvitation.run({ ownerId: 'alice', token: viewerInvite.token }, context('bob'));
  await assertSucceeds(get(ref(bob, 'careHandovers/alice'))); await assertFails(set(ref(bob, 'careUpdates/alice/2026-10-24/water'), note));
  await app.database().ref('careFamilies/alice/members/bob/expiresAt').set(Date.now() - 1);
  await assertFails(get(ref(bob, 'careHandovers/alice')));
});
