const { test } = require('node:test');
const assert = require('node:assert/strict');
test('weekly recap counts only saved completions within the selected week and pet', async () => {
  const { weeklyCareSummary } = await import('../../src/domain/care.mjs');
  const days = { '2026-09-06': { old: { status: 'done', petId: 'milo' } }, '2026-09-07': { a: { status: 'done', petId: 'milo', title: 'Fresh water' }, b: { status: 'open', petId: 'milo' } }, '2026-09-13': { a: { status: 'done', petId: 'milo', title: 'Fresh water' }, b: { status: 'done', petId: 'luna', title: '__proto__' } }, '2026-09-14': { future: { status: 'done', petId: 'milo' } } };
  const pets = { milo: { name: 'Milo' }, luna: { name: 'Luna' } };
  const all = weeklyCareSummary(days, pets, '2026-09-13');
  assert.equal(all.total, 3); assert.equal(all.activeDays, 2); assert.equal(all.activity.length, 7);
  assert.deepEqual(all.routines[0], { title: 'Fresh water', count: 2 });
  assert.equal(all.routines[1].title, '__proto__');
  const filtered = weeklyCareSummary(days, pets, '2026-09-13', 'milo');
  assert.equal(filtered.total, 2); assert.equal(filtered.pets.length, 1);
  days['2026-09-07'].a.status = 'open';
  assert.equal(weeklyCareSummary(days, pets, '2026-09-13', 'milo').total, 1);
  assert.equal(weeklyCareSummary({}, {}, '2026-09-13').activeDays, 0);
});
