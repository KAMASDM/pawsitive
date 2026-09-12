const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildContext, safetyResponse, reserveUsage, validateAnswer, DAILY_APP_LIMIT } = require('../domain/copilot');

test('AI context contains only bounded, reviewable fields and a stable fingerprint', () => {
  const pet = { name: 'Milo', type: 'Cat', ownerEmail: 'private@example.test', notes: 'PRIVATE NOTES', image: 'private-url', expenses: { a: 123 }, medications: { a: { name: 'Recorded medication', dosage: 'SECRET DOSE', notes: 'SECRET INSTRUCTIONS' } }, vaccinations: { a: { name: 'Saved vaccine', date: '2026-01-01' } } };
  const context = buildContext(pet);
  for (const secret of ['PRIVATE', 'SECRET', 'private@example.test', 'private-url']) assert.equal(JSON.stringify(context).includes(secret), false);
  assert.equal(context.fingerprint, buildContext({ ...pet, notes: 'changed excluded notes' }).fingerprint);
  assert.notEqual(context.fingerprint, buildContext({ ...pet, name: 'Luna' }).fingerprint);
  assert.ok(context.sources.every(source => Object.keys(source).sort().join(',') === 'id,label,value'));
});

test('large and malformed records cannot create unbounded provider input', () => {
  const context = buildContext({ name: '🐕'.repeat(1000), vaccinations: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [i, { name: '🐕'.repeat(1000), date: 'x'.repeat(1000) }])), medical: { allergies: ['z'.repeat(1000), null, {}, 2] } });
  assert.ok(Buffer.byteLength(JSON.stringify(context.sources)) <= 8000);
  assert.ok(context.sources.length <= 40);
});

test('known urgent and dosing questions are redirected without model generation', () => {
  assert.match(safetyResponse('My cat cannot breathe'), /now/);
  assert.match(safetyResponse('What dosage should I give my dog?'), /cannot diagnose/);
  assert.equal(safetyResponse('How can I enrich a cat’s indoor day?'), null);
});

test('usage blocks duplicate, rapid and over-budget requests and resets by UTC date', () => {
  let now = Date.UTC(2026, 8, 12);
  let current = reserveUsage(null, { uid: 'alice', requestId: 'request-one', now });
  assert.equal(reserveUsage(current, { uid: 'alice', requestId: 'request-one', now: now + 20000 }), undefined);
  assert.equal(reserveUsage(current, { uid: 'alice', requestId: 'request-two', now: now + 1000 }), undefined);
  for (let i = 1; i < 5; i++) current = reserveUsage(current, { uid: 'alice', requestId: `request-${i}`, now: now + i * 20000 });
  assert.equal(reserveUsage(current, { uid: 'alice', requestId: 'request-six', now: now + 120000 }), undefined);
  assert.equal(reserveUsage({ ...current, total: DAILY_APP_LIMIT }, { uid: 'bob', requestId: 'request', now }), undefined);
  assert.equal(reserveUsage(current, { uid: 'alice', requestId: 'tomorrow', now: now + 86400000 }).total, 1);
});

test('model output cannot cite other sources, include doses, or inject markup', () => {
  const answer = { answer: 'Milo has one saved vaccination record.', references: ['profile'], followUpQuestions: [] };
  assert.equal(validateAnswer(answer, [{ id: 'profile' }], 'summary').answer, answer.answer);
  assert.throws(() => validateAnswer({ ...answer, references: ['another-owner'] }, [{ id: 'profile' }], 'summary'), /citation/);
  assert.throws(() => validateAnswer({ ...answer, references: [] }, [{ id: 'profile' }], 'summary'), /citation/);
  assert.throws(() => validateAnswer({ ...answer, answer: 'Give 20 mg twice daily.' }, [{ id: 'profile' }], 'summary'), /unsupported/);
  assert.throws(() => validateAnswer({ ...answer, answer: '<script>steal()</script>' }, [{ id: 'profile' }], 'summary'), /unsupported/);
});
