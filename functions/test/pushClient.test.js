const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('registration retries failures after reconnect and deduplicates successful setup', async () => {
  const { createPushRegistrationSync } = await import('../../src/services/pushRegistration.mjs');
  let count = 0, user = { uid: 'alice', emailVerified: true };
  const sync = createPushRegistrationSync({ getUser: () => user, register: async () => ({ success: ++count > 1 }), now: () => 1000 });
  await sync(); await sync(); assert.equal(count, 1);
  await sync({ forceRetry: true }); await sync({ forceRetry: true }); assert.equal(count, 2);
  user = null; await sync(); user = { uid: 'bob', emailVerified: true }; await sync(); assert.equal(count, 3);
});
test('concurrent setup is deduplicated and an old account cannot mark a new one registered', async () => {
  const { createPushRegistrationSync } = await import('../../src/services/pushRegistration.mjs');
  let user = { uid: 'alice' }, resolve, calls = 0;
  const sync = createPushRegistrationSync({ getUser: () => user, register: () => { calls++; return new Promise(r => { resolve = r; }); } });
  const first = sync(); await sync(); assert.equal(calls, 1);
  user = { uid: 'bob' }; resolve({ success: true }); await first;
  const second = sync(); assert.equal(calls, 2); resolve({ success: true }); await second;
});
function worker() {
  let source, background;
  const handlers = {}, shown = [], navigated = [];
  const env = Object.fromEntries(['API_KEY','AUTH_DOMAIN','PROJECT_ID','STORAGE_BUCKET','MESSAGING_SENDER_ID','APP_ID','DATABASE_URL'].map(k => ['VITE_FIREBASE_'+k, 'fixture']));
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../scripts/generate-firebase-sw.js'), 'utf8'), { require: name => name === 'fs' ? { existsSync: () => false, writeFileSync: (_, value) => { source = value; } } : path, __dirname, process: { env }, console: { log() {}, warn() {} } });
  const self = { location: { origin: 'https://pawppy.in' }, addEventListener: (type, handler) => { handlers[type] = handler; }, registration: { showNotification: (...args) => { shown.push(args); } } };
  vm.runInNewContext(source, { self, URL, importScripts() {}, firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage: fn => { background = fn; } }) }, clients: { matchAll: async () => [{ url: 'https://pawppy.in/today', navigate: async url => { navigated.push(url); return { focus() {} }; } }], openWindow: async url => { navigated.push(url); } } });
  return { handlers, shown, navigated, background };
}
test('background notifications display data messages once and leave Firebase notification payloads alone', async () => {
  const w = worker(); await w.background({ notification: { title: 'Already displayed' } }); assert.equal(w.shown.length, 0);
  await w.background({ data: { title: 'Care reminder', body: 'Open your care plan' } }); assert.equal(w.shown.length, 1); assert.equal(w.shown[0][0], 'Care reminder');
});
test('Firebase-displayed notification clicks navigate an existing app window to the correct route', async () => {
  const w = worker(); let pending;
  w.handlers.notificationclick({ notification: { data: { FCM_MSG: { data: { click_action: '/pet-details/milo' } } }, close() {} }, stopImmediatePropagation() {}, waitUntil: promise => { pending = promise; } });
  await pending; assert.equal(w.navigated[0], 'https://pawppy.in/pet-details/milo?notificationSource=push');
});
test('notification clicks cannot navigate outside Pawppy', () => {
  const w = worker(); w.handlers.notificationclick({ notification: { data: { click_action: 'https://example.test/' }, close() {} }, stopImmediatePropagation() {}, waitUntil() { assert.fail('external navigation'); } });
  assert.equal(w.navigated.length, 0);
});
