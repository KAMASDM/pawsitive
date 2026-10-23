const { test } = require('node:test');
const assert = require('node:assert/strict');
const { safetyCard, publicWeek } = require('../domain/growth');

test('safety projection includes only owner-selected public contact fields', () => {
  const pet = { name: 'Milo', type: 'Dog', breed: 'Lab', image: 'https://example.test/milo.jpg', medical: { allergies: 'private' }, expenses: [123], location: { latitude: 1 }, userId: 'private' };
  const { config, card } = safetyCard({ enabled: true, phone: '+91 99999 99999', email: '', shareBreed: false, sharePhoto: false }, pet);
  assert.equal(config.token.length, 43);
  assert.deepEqual(Object.keys(card).sort(), ['contactName', 'email', 'message', 'name', 'phone', 'type']);
  const updated = safetyCard({ ...config, shareBreed: true, sharePhoto: true }, pet, config);
  assert.equal(updated.config.token, config.token); assert.equal(updated.card.breed, 'Lab'); assert.equal(updated.card.image, pet.image);
  assert.throws(() => safetyCard({ enabled: true, shareBreed: false, sharePhoto: false }, pet), /contact/);
  assert.throws(() => safetyCard({ enabled: true, phone: 'javascript:alert(1)', shareBreed: false, sharePhoto: false }, pet), /valid contact/);
});

test('weekly card contains selected recent milestones, optional count and no clinical records', () => {
  const input = { petId: 'milo', caption: 'A little sunshine', milestoneIds: ['party', 'private', 'old'], includeCareCount: false };
  const events = { party: { type: 'birthday', title: 'A birthday', date: '2026-10-23' }, private: { type: 'veterinary', title: 'Do not share', date: '2026-10-23' }, old: { type: 'milestone', title: 'Too old', date: '2020-01-01' } };
  const days = { '2026-10-23': { one: { petId: 'milo', status: 'done' }, two: { petId: 'luna', status: 'done' }, correction: { petId: 'milo', status: 'open' } }, '2020-01-01': { old: { petId: 'milo', status: 'done' } } };
  const card = publicWeek(input, { name: 'Milo', medical: 'private' }, events, days, '2026-10-24');
  assert.deepEqual(card.milestones, ['A birthday']); assert.equal(card.careCount, undefined); assert.equal(card.medical, undefined);
  assert.equal(publicWeek({ ...input, includeCareCount: true }, { name: 'Milo' }, events, days, '2026-10-24').careCount, 1);
  assert.throws(() => publicWeek({ ...input, photo: 'https://example.test/unapproved.png' }, {}, events, days, '2026-10-24'), /smaller/);
});

test('document date parsing preserves explicit order and leaves unsupported dates blank', async () => {
  const { parseRecordDate, extractVaccinations, validRecordDate } = await import('../../src/features/growth/recordParser.mjs');
  assert.equal(parseRecordDate('03/04/2026', 'DMY'), '2026-04-03');
  assert.equal(parseRecordDate('03/04/2026', 'MDY'), '2026-03-04');
  assert.equal(parseRecordDate('2026-03-04'), '2026-03-04');
  assert.equal(parseRecordDate('3 Sep 2026'), '2026-09-03');
  assert.equal(parseRecordDate('3/4/26'), ''); assert.equal(parseRecordDate('31/02/2026'), ''); assert.equal(validRecordDate('2026-02-30'), false);
  const rows = extractVaccinations('Owner: Alice\nRabies 03/04/2026 03/04/2027\nFVRCP illegible\nPhone: 9999999999');
  assert.equal(rows.length, 2); assert.equal(rows[0].date, '2026-04-03'); assert.equal(rows[0].nextDue, '2027-04-03'); assert.equal(rows[0].selected, false); assert.equal(rows[1].date, '');
});

test('starter plans are species-aware, editable, and cannot duplicate or overwrite saved routines', async () => {
  const { starterSuggestions, starterWrites } = await import('../../src/features/growth/starterPlans.mjs');
  assert.ok(starterSuggestions('Dog').some(item => item.kind === 'walk'));
  assert.ok(starterSuggestions('Cat').some(item => item.kind === 'litter'));
  assert.ok(starterSuggestions('Other').every(item => item.kind === 'other'));
  const suggestions = starterSuggestions('Dog'); const first = starterWrites({}, 'milo', suggestions, '2026-10-24', 123);
  assert.equal(Object.keys(first).length, 1);
  assert.deepEqual(starterWrites(first, 'milo', suggestions, '2026-10-24', 456), {});
  suggestions[0].title = 'An edited name'; assert.deepEqual(starterWrites(first, 'milo', suggestions, '2026-10-24', 456), {});
  assert.equal(first.starter_milo_water.title, 'Fresh water');
});

test('growth funnels count unique measured accounts and only mature signup windows', () => {
  const { summarizeGrowth } = require('../domain/growthMetrics');
  const now = Date.now();
  const report = summarizeGrowth({ alice: { one: { name: 'signup_completed', timestamp: now - 2 * 86400000 }, two: { name: 'pet_created', timestamp: now - 2 * 86400000 + 100 }, three: { name: 'safety_link_signup', timestamp: now - 2 * 86400000 + 200 }, four: { name: 'safety_card_shared', timestamp: now - 100 }, five: { name: 'safety_card_shared', timestamp: now - 50 } }, bob: { signup: { name: 'signup_completed', timestamp: now - 1000 } } }, now);
  assert.equal(report.measuredSignups, 2); assert.equal(report.setupEligible, 1); assert.equal(report.firstPetWithin24Hours, 1); assert.equal(report.safetySharingAccounts, 1); assert.equal(report.sharedLinkSignups.safety, 1); assert.equal(report.alice, undefined);
});

test('changing starter goals retains selected routines and user-edited names and times', async () => {
  const { starterSuggestions, refreshStarterSuggestions } = await import('../../src/features/growth/starterPlans.mjs');
  const draft = { lifeStage: 'adult', goal: 'steady', suggestions: starterSuggestions('Dog') };
  draft.suggestions[0] = { ...draft.suggestions[0], title: 'Refill Milo’s bowl', time: '07:00' };
  const next = refreshStarterSuggestions('Dog', draft, { lifeStage: 'older', goal: 'shared' });
  assert.equal(next.suggestions[0].title, 'Refill Milo’s bowl'); assert.equal(next.suggestions[0].time, '07:00');
  assert.ok(next.suggestions.some(item => item.id === 'handover'));
});
