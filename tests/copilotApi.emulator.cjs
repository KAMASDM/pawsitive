const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const { ref, get, set } = require('firebase/database');
const adminSdk = require('../functions/node_modules/firebase-admin');
const functions = require('node:module').createRequire(require('node:path').resolve('functions/index.js'))('firebase-functions/v1');
let environment, app, api, count, clock, provider;
const context = uid => ({ auth: { uid, token: { email_verified: true } } });
const question = id => ({ mode: 'question', question: 'Suggest gentle play ideas for a cat.', requestId: id || 'request-id-123456789', consent: true, consentVersion: 'copilot-v1' });
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-pawppy', database: { host: '127.0.0.1', port: 9015, rules: fs.readFileSync('database.rules.json', 'utf8') } });
  app = adminSdk.initializeApp({ projectId: 'demo-pawppy', databaseURL: 'http://127.0.0.1:9015?ns=demo-pawppy' }, 'copilot-tests');
  api = require('../functions/copilotApi')({ functions, admin: { database: () => app.database() }, now: () => clock, generate: async args => { count++; return provider(args); } });
});
beforeEach(async () => {
  clock = Date.UTC(2026, 8, 12); count = 0;
  provider = async ({ sources }) => ({ output: { answer: sources.length ? 'Milo has saved records to review.' : 'Try a supervised, gentle play session.', references: sources.map(source => source.id), followUpQuestions: [] }, model: 'test-model' });
  await environment.clearDatabase();
  await app.database().ref().set({ copilotConfig: { enabled: true }, petOwners: { milo: 'alice' }, userPets: { alice: { milo: { name: 'Milo', type: 'Cat', notes: 'PRIVATE', medications: { a: { name: 'Saved medicine', dosage: 'DOSE' } } } } }, careFamilies: { alice: { members: { bob: { role: 'caregiver', expiresAt: clock + 86400000 } } } } });
});
after(async () => { await environment?.cleanup(); await app?.delete(); });

test('unauthenticated, unverified, and non-consenting calls never reach the model', async () => {
  await assert.rejects(api.askPetCopilot.run(question(), {}), /Sign in/);
  await assert.rejects(api.askPetCopilot.run(question(), { auth: { uid: 'alice', token: {} } }), /Verify/);
  await assert.rejects(api.askPetCopilot.run({ ...question(), consent: false }, context('alice')), /approve/);
  await assert.rejects(api.askPetCopilot.run({ ...question(), consentVersion: 'old' }, context('alice')), /approve/);
  assert.equal(count, 0);
});

test('only the owner can preview records, and summaries require the exact approved preview', async () => {
  await assert.rejects(api.previewCopilotRecords.run({ petId: 'milo' }, context('bob')), /own pet/);
  await assert.rejects(api.previewCopilotRecords.run({ petId: '../alice' }, context('alice')), /Choose/);
  const preview = await api.previewCopilotRecords.run({ petId: 'milo' }, context('alice'));
  assert.equal(JSON.stringify(preview).includes('PRIVATE'), false);
  assert.equal(JSON.stringify(preview).includes('DOSE'), false);
  const data = { ...question(), mode: 'summary', petId: 'milo', fingerprint: preview.fingerprint, approveRecords: true };
  await assert.rejects(api.askPetCopilot.run({ ...data, approveRecords: false }, context('alice')), /approved/);
  await assert.rejects(api.askPetCopilot.run({ ...data, fingerprint: 'old' }, context('alice')), /changed/);
  await assert.rejects(api.askPetCopilot.run(data, context('bob')), /own pet/);
  const answer = await api.askPetCopilot.run(data, context('alice'));
  assert.deepEqual(answer.references, preview.sources.map(source => source.id));
  assert.equal(count, 1);
});

test('record changes during generation invalidate the answer', async () => {
  const preview = await api.previewCopilotRecords.run({ petId: 'milo' }, context('alice'));
  provider = async () => { await app.database().ref('userPets/alice/milo/name').set('Changed'); return { output: { answer: 'Milo', references: ['profile'], followUpQuestions: [] } }; };
  await assert.rejects(api.askPetCopilot.run({ ...question(), mode: 'summary', petId: 'milo', fingerprint: preview.fingerprint, approveRecords: true }, context('alice')), /changed/);
});

test('general questions never forward records, and duplicates never repeat provider work', async () => {
  provider = async ({ sources }) => { assert.deepEqual(sources, []); return { output: { answer: 'Gentle play can be fun.', references: [], followUpQuestions: [] }, model: 'test' }; };
  await api.askPetCopilot.run(question(), context('alice'));
  clock += 20000;
  await assert.rejects(api.askPetCopilot.run(question(), context('alice')), /limit|already sent/);
  await assert.rejects(api.askPetCopilot.run({ ...question('another-request-1234'), petId: 'milo' }, context('alice')), /do not include/);
  assert.equal(count, 1);
});

test('concurrent requests cannot exceed the app-wide allowance', async () => {
  await app.database().ref('copilotUsage/current').set({ date: '2026-09-12', total: 49, accounts: {}, requests: {} });
  const results = await Promise.allSettled(['alice', 'bob', 'charlie'].map(uid => api.askPetCopilot.run(question(`request-${uid}-12345678`), context(uid))));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(count, 1);
  assert.equal((await app.database().ref('copilotUsage/current/total').once('value')).val(), 50);
});

test('provider errors do not return fake answers and safety guidance bypasses model generation', async () => {
  provider = async () => { throw new Error('provider secret payload'); };
  await assert.rejects(api.askPetCopilot.run(question(), context('alice')), error => error.code === 'unavailable' && !error.message.includes('secret'));
  const safety = await api.askPetCopilot.run({ ...question(), question: 'My cat cannot breathe' }, context('alice'));
  assert.equal(safety.safetyNotice, true); assert.match(safety.answer, /now/); assert.equal(count, 1);
});

test('usage and enable flags cannot be read or changed by client accounts', async () => {
  const db = environment.authenticatedContext('alice').database();
  for (const path of ['copilotConfig/enabled', 'copilotUsage/current']) {
    await assertFails(get(ref(db, path)));
    await assertFails(set(ref(db, path), true));
  }
  await app.database().ref('copilotConfig/enabled').set(false);
  await assert.rejects(api.askPetCopilot.run(question(), context('alice')), /not available/);
  assert.equal(count, 0);
});
