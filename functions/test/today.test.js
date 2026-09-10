const { test } = require('node:test');
const assert = require('node:assert/strict');
const domain = import('../../src/domain/care.mjs');

test('a care day follows the saved timezone through midnight and DST', async () => {
  const { careDate, careTimeZone, shiftDate } = await domain;
  assert.equal(careDate(new Date('2026-09-09T20:00:00Z'), 'Asia/Kolkata'), '2026-09-10');
  assert.equal(careDate(new Date('2026-03-08T07:30:00Z'), 'America/New_York'), '2026-03-08');
  assert.equal(shiftDate('2026-03-09', -1), '2026-03-08');
  assert.equal(careTimeZone({ timeZone: 'invalid' }), 'Asia/Kolkata');
});

test('Today excludes paused, future and deleted-pet routines and resets on the next day', async () => {
  const { todayTasks } = await domain;
  const routine = { petId: 'milo', title: 'Water', time: '08:00', startDate: '2026-09-09', active: true };
  const routines = { water: routine, paused: { ...routine, active: false }, later: { ...routine, startDate: '2026-09-11' }, deleted: { ...routine, petId: 'missing' } };
  const pets = { milo: { name: 'Milo' } };
  assert.deepEqual(todayTasks(routines, pets, '2026-09-09', { water: { status: 'done' } }).map(task => [task.id, task.completed]), [['water', true]]);
  assert.equal(todayTasks(routines, pets, '2026-09-10', {})[0].completed, false);
  assert.equal(todayTasks(routines, pets, '2026-09-10', {}, 'other').length, 0);
});

test('retries and stale edits cannot duplicate or reverse a care completion', async () => {
  const { nextCareRecord } = await domain;
  const request = { routine: { petId: 'milo', title: 'Water' }, uid: 'alice', status: 'done', expectedRevision: 0, timestamp: 1 };
  const done = nextCareRecord(null, request);
  assert.equal(done.revision, 1);
  assert.equal(nextCareRecord(done, request), undefined);
  const corrected = nextCareRecord(done, { ...request, expectedRevision: 1, status: 'open', timestamp: 2 });
  assert.equal(corrected.revision, 2);
  assert.equal(corrected.status, 'open');
  assert.equal(nextCareRecord(corrected, { ...request, expectedRevision: 1 }), undefined);
});
