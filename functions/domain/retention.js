const DAY_MS = 86400000;
const day = (value) => new Date(value).toISOString().slice(0, 10);

// Cohorts start at the first measured session, which may be an existing account.
// Exact-day retention uses UTC calendar days and excludes immature accounts.
function summarizeRetention(accounts, now = Date.now()) {
  const cohorts = {};
  for (const account of Object.values(accounts || {})) {
    const events = Object.values(account || {}).filter((event) => Number.isFinite(event?.timestamp) && event.timestamp <= now).sort((a, b) => a.timestamp - b.timestamp);
    const first = events.find((event) => event.name === 'session_started');
    if (!first) continue;
    const cohortDate = day(first.timestamp);
    const cohortStart = Date.parse(`${cohortDate}T00:00:00Z`);
    const completeDays = Math.floor((now - cohortStart) / DAY_MS);
    const cohort = cohorts[cohortDate] ||= { date: cohortDate, accounts: 0, activatedWithin24Hours: 0, activationEligible: 0, D1: { eligible: 0, returned: 0 }, D7: { eligible: 0, returned: 0 }, D30: { eligible: 0, returned: 0 } };
    cohort.accounts++;
    if (now >= first.timestamp + DAY_MS) {
      cohort.activationEligible++;
      const firstDay = events.filter((event) => event.timestamp < first.timestamp + DAY_MS);
      if (firstDay.some((event) => event.name === 'pet_created') && firstDay.some((event) => ['health_record_saved', 'medication_saved', 'routine_completed'].includes(event.name))) cohort.activatedWithin24Hours++;
    }
    const activeDays = new Set(events.map((event) => day(event.timestamp)));
    for (const offset of [1, 7, 30]) {
      // The whole target calendar day must have elapsed before entering denominator.
      if (completeDays <= offset) continue;
      const metric = cohort[`D${offset}`];
      metric.eligible++;
      if (activeDays.has(day(cohortStart + offset * DAY_MS))) metric.returned++;
    }
  }
  return Object.values(cohorts).sort((a, b) => a.date.localeCompare(b.date)).map((cohort) => {
    for (const key of ['D1', 'D7', 'D30']) cohort[key].rate = cohort[key].eligible ? Number((cohort[key].returned / cohort[key].eligible).toFixed(4)) : null;
    return cohort;
  });
}

module.exports = { summarizeRetention };
