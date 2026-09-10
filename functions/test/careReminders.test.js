const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHealthReminders, buildRoutineBriefing, buildWeeklyDigest, channelEnabled, dateOnly, isQuietTime, localClock, timeZoneFor } = require('../domain/careReminders');
const user = { notificationPreferences: { timeZone: 'Asia/Kolkata' } };

test('routine briefings require explicit opt-in, honour quiet hours, and skip completed plans', () => {
  const routines = { water: { active: true, petId: 'milo', startDate: '2026-09-01' } };
  const pets = { milo: { name: 'Milo' } };
  const now = new Date('2026-09-09T04:00:00Z');
  assert.equal(buildRoutineBriefing(routines, {}, pets, user, now), null);
  const enabled = { notificationPreferences: { timeZone: 'Asia/Kolkata', push: { routines: true }, routineReminderTime: '09:00' } };
  const briefing = buildRoutineBriefing(routines, {}, pets, enabled, now);
  assert.match(briefing.body, /1 daily routine/);
  assert.equal(briefing.id, buildRoutineBriefing(routines, {}, pets, enabled, new Date('2026-09-09T05:00:00Z')).id);
  assert.equal(buildRoutineBriefing(routines, { water: { status: 'done' } }, pets, enabled, now), null);
  assert.equal(buildRoutineBriefing(routines, {}, pets, enabled, new Date('2026-09-09T02:00:00Z')), null);
  enabled.notificationPreferences.quietHours = { enabled: true, start: '09:00', end: '10:00' };
  assert.equal(buildRoutineBriefing(routines, {}, pets, enabled, now), null);
  assert.equal(channelEnabled(enabled, 'email', 'routine_briefing'), false);
});

test('weekly recap counts the seven completed calendar days and excludes corrections', () => {
  const result = buildWeeklyDigest({}, {}, { timeZone: 'UTC' }, new Date('2026-09-14T09:00:00Z'), {
    '2026-09-07': { a: { status: 'done' }, b: { status: 'open' } },
    '2026-09-13': { a: { status: 'done' } },
    '2026-09-14': { a: { status: 'done' } },
    '2026-09-06': { a: { status: 'done' } },
  });
  assert.match(result[0], /2 daily care actions across 2 days/);
});

test('uses the parent calendar day, not the UTC day', () => {
  const now = new Date('2026-09-08T20:00:00Z');
  assert.equal(localClock(now, timeZoneFor(user)).date, '2026-09-09');
  const reminders = buildHealthReminders({ p: { name: 'Milo', vaccinations: [{ nextDue: '2026-09-10', name: 'Saved vaccine' }] } }, user, now);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].data.click_action, '/pet-details/p');
});

test('missing/invalid dates never imply a health problem', () => {
  assert.equal(dateOnly('2026-02-30'), null);
  assert.equal(dateOnly('invalid'), null);
  assert.deepEqual(buildHealthReminders({ p: { vaccinations: [null, { nextDue: 'broken' }], lastCheckup: '2020-01-01' } }, user), []);
});

test('retains reminders from legacy Date.toDateString vaccination records', () => {
  assert.equal(dateOnly('Wed Sep 09 2026'), '2026-09-09');
  assert.equal(dateOnly('Mon Feb 30 2026'), null);
  const reminders = buildHealthReminders({ p: { vaccinations: [{ nextDue: 'Wed Sep 09 2026' }] } }, user, new Date('2026-09-09T06:00:00Z'));
  assert.equal(reminders.length, 1);
});

test('weekly digest retains birthdays and both historical request timestamp formats', () => {
  const now = new Date('2026-12-28T06:00:00Z');
  const items = buildWeeklyDigest({ p: { name: 'Milo', dateOfBirth: '2020-01-01', vaccinations: [{ nextDue: '2027-01-01' }] } }, {
    a: { createdAt: now.getTime() - 1000 }, b: { timestamp: now.getTime() - 2000 }, old: { timestamp: 1 },
  }, user, now);
  assert.equal(items.length, 3);
  assert.match(items[2], /2 new connection requests/);
});

test('overdue vaccine reminders are bounded weekly follow-ups', () => {
  const pet = { p: { vaccinations: [{ id: 'v', nextDue: '2026-09-01' }] } };
  const remindersOn = (date) => buildHealthReminders(pet, user, new Date(`${date}T06:00:00Z`));
  assert.equal(remindersOn('2026-09-08').length, 1);
  assert.equal(remindersOn('2026-09-09').length, 0);
  assert.equal(remindersOn('2026-09-29').length, 0);
  assert.equal(remindersOn('2026-09-08')[0].id, remindersOn('2026-09-08')[0].id);
});

test('birthday reminders cross year boundaries and ignore malformed birthdays', () => {
  const reminders = buildHealthReminders({ p: { name: 'Milo', dateOfBirth: '2020-01-01' }, invalid: { dateOfBirth: '2026-02-30' } }, user, new Date('2026-12-29T06:00:00Z'));
  assert.equal(reminders.length, 1);
  assert.match(reminders[0].body, /turns 7/);
});

test('medication reminders use only saved dates and exclude inactive or disabled records', () => {
  const reminders = buildHealthReminders({ p: { medications: [
    { name: 'A', nextDose: '2026-09-09' },
    { name: 'B', nextDose: '2026-09-09', active: false },
    { name: 'C', nextDose: '2026-09-09', reminderEnabled: false },
    { name: 'D', frequency: 'twice-daily' },
  ] } }, user, new Date('2026-09-09T06:00:00Z'));
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].type, 'medication_date');
});

test('category switches, master switch, and overnight quiet hours work independently', () => {
  const preferences = { notificationPreferences: { timeZone: 'UTC', push: { vaccinations: false }, email: { enabled: false }, quietHours: { enabled: true, start: '22:00', end: '07:00' } } };
  assert.equal(channelEnabled(preferences, 'push', 'vacc_due'), false);
  assert.equal(channelEnabled(preferences, 'push', 'message'), true);
  assert.equal(channelEnabled(preferences, 'email', 'message'), false);
  assert.equal(isQuietTime(preferences, new Date('2026-09-09T23:00:00Z')), true);
  assert.equal(isQuietTime(preferences, new Date('2026-09-09T06:59:00Z')), true);
  assert.equal(isQuietTime(preferences, new Date('2026-09-09T07:00:00Z')), false);
  assert.equal(timeZoneFor({ timeZone: 'invalid/zone' }), 'Asia/Kolkata');
});
