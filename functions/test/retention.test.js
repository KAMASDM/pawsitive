const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeRetention } = require('../domain/retention');
const event = (date, name = 'session_started') => ({ timestamp: Date.parse(date), name });

test('excludes incomplete return windows and counts repeated actions once per account', () => {
  const accounts = {
    a: { one: event('2026-09-01T10:00Z'), two: event('2026-09-08T10:00Z'), three: event('2026-09-08T11:00Z', 'health_record_saved') },
    b: { one: event('2026-09-01T11:00Z') },
    c: { one: event('2026-09-08T10:00Z') },
  };
  const rows = summarizeRetention(accounts, Date.parse('2026-09-09T00:00Z'));
  assert.deepEqual(rows[0].D7, { eligible: 2, returned: 1, rate: 0.5 });
  assert.deepEqual(rows[0].D30, { eligible: 0, returned: 0, rate: null });
  assert.equal(rows[1].D1.eligible, 0);
});

test('activation needs both a pet and care action, not only an install/session', () => {
  const rows = summarizeRetention({
    a: { one: event('2026-09-01T10:00Z'), two: event('2026-09-01T10:10Z', 'pet_created'), three: event('2026-09-01T10:20Z', 'health_record_saved') },
    b: { one: event('2026-09-01T10:00Z') },
  }, Date.parse('2026-09-03T00:00Z'));
  assert.equal(rows[0].activatedWithin24Hours, 1);
  assert.equal(rows[0].activationEligible, 2);
  assert.equal(rows[0].accounts, 2);
});
