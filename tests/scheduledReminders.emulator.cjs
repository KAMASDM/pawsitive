const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9015';
process.env.GCLOUD_PROJECT = 'demo-pawppy';
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-pawppy', databaseURL: 'https://demo-pawppy-default-rtdb.firebaseio.com' });
const handlers = require('../functions');
const admin = require('../functions/node_modules/firebase-admin');
const db = admin.database();
let sends;

before(async () => {
  sends = [];
  mock.method(admin.messaging(), 'send', async (message) => { sends.push(message); return 'local-provider-acceptance'; });
  mock.timers.enable({ apis: ['Date'], now: new Date('2026-09-09T10:00:00Z') });
  // No emails, actual FCM calls, or production data are used in this fixture.
  await db.ref().set({
    users: {
      alice: { notificationPreferences: { timeZone: 'UTC', email: { enabled: false } } },
      bob: { pets: { legacy: { vaccinations: [{ nextDue: '2026-09-10' }] } } },
    },
    userPets: { alice: { milo: { name: 'Test pet', vaccinations: [{ name: 'Test vaccine', nextDue: '2026-09-10' }] } } },
    notificationDevices: { alice: { one: { token: 'local-token-one' }, two: { token: 'local-token-two' } } },
  });
});
after(async () => { mock.restoreAll(); mock.timers.reset(); await db.ref().remove(); await admin.app().delete(); });

test('actual scheduled handler reads canonical pets and retries without duplicate inbox or device sends', async () => {
  await handlers.dailyHealthNotifications.run({});
  await handlers.dailyHealthNotifications.run({});
  assert.equal(sends.length, 2, 'one accepted message for each registered device');
  assert.match(sends[0].webpush.fcm_options.link, /\/pet-details\/milo\?notificationSource=push$/);
  assert.equal(sends[0].webpush.headers.TTL, '3600');
  const inbox = (await db.ref('notifications/alice').once('value')).val();
  assert.equal(Object.keys(inbox).length, 1);
  assert.equal((await db.ref('users/alice/unreadNotifications').once('value')).val(), 1);
  assert.equal((await db.ref('notifications/bob').once('value')).exists(), false);
  const deliveries = (await db.ref('notificationDeliveries/alice').once('value')).val();
  assert.equal(Object.values(Object.values(deliveries)[0]).filter((attempt) => attempt.status === 'accepted').length, 2);
});

test('a disabled care category prevents external push for a newly due record', async () => {
  await db.ref('users/alice/notificationPreferences/push/vaccinations').set(false);
  await db.ref('userPets/alice/milo/vaccinations/1').set({ name: 'Another saved vaccine', nextDue: '2026-09-10' });
  await handlers.dailyHealthNotifications.run({});
  assert.equal(sends.length, 2);
  assert.equal(Object.keys((await db.ref('notifications/alice').once('value')).val()).length, 2, 'in-app care history remains available');
});

test('daily routine briefing sends once per device only after explicit opt-in', async () => {
  await db.ref('careRoutines/alice/water').set({ active: true, petId: 'milo', title: 'Water', startDate: '2026-09-01' });
  const before = sends.length;
  await handlers.dailyRoutineBriefing.run({});
  assert.equal(sends.length, before);
  await db.ref('users/alice/notificationPreferences/push/routines').set(true);
  await handlers.dailyRoutineBriefing.run({});
  await handlers.dailyRoutineBriefing.run({});
  assert.equal(sends.length, before + 2);
  assert.match(sends.at(-1).webpush.fcm_options.link, /\/today\?notificationSource=push$/);
});

test('device self-test targets only the caller, requires registration and limits repeated sends', async () => {
  const context = { auth: { uid: 'selftest', token: { email_verified: true } } };
  await assert.rejects(handlers.testNotificationDevice.run({ deviceId: 'test-device-id' }, {}), error => error.code === 'unauthenticated');
  await db.ref('notificationDevices/selftest/test-device-id').set({ token: 'self-test-token' });
  const before = sends.length;
  assert.deepEqual(await handlers.testNotificationDevice.run({ deviceId: 'test-device-id', uid: 'alice', token: 'other-token' }, context), { accepted: true });
  assert.equal(sends.length, before + 1);
  assert.equal(sends.at(-1).token, 'self-test-token');
  assert.equal(sends.at(-1).topic, undefined);
  assert.match(sends.at(-1).webpush.fcm_options.link, /\/settings\?notificationSource=push$/);
  await assert.rejects(handlers.testNotificationDevice.run({ deviceId: 'test-device-id' }, context), error => error.code === 'resource-exhausted');
  await assert.rejects(handlers.testNotificationDevice.run({ deviceId: 'test-device-id' }, { auth: { uid: 'other', token: { email_verified: true } } }), error => error.code === 'failed-precondition');
});
