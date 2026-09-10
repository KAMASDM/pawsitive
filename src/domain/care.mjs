export const ROUTINE_KINDS = { meal: 'Meal', water: 'Fresh water', walk: 'Walk', play: 'Play & enrichment', grooming: 'Grooming', litter: 'Litter care', other: 'Other daily care' };

export function careTimeZone(user = {}) {
  const zone = user.notificationPreferences?.timeZone || user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return zone; } catch { return 'Asia/Kolkata'; }
}

export function careDate(now = new Date(), timeZone = 'Asia/Kolkata') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function shiftDate(date, days) { return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }

export function todayTasks(routines, pets, day, records = {}, petFilter = '') {
  return Object.entries(routines || {}).filter(([, routine]) => routine.active && routine.startDate <= day && pets[routine.petId] && (!petFilter || petFilter === routine.petId))
    .map(([id, routine]) => ({ ...routine, id, petName: pets[routine.petId].name, completed: records[id]?.status === 'done', record: records[id] }))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title));
}

// Both retries and simultaneous completion attempts converge on one occurrence.
// A stale request cannot reverse a newer correction (revision comparison).
export function nextCareRecord(current, { routine, uid, status, expectedRevision, timestamp }) {
  if ((current?.revision || 0) !== expectedRevision || current?.status === status) return undefined;
  return { petId: routine.petId, title: routine.title, status, updatedBy: uid, updatedAt: timestamp, revision: expectedRevision + 1 };
}
