const { createHash } = require('node:crypto');

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';
const DAY_MS = 86400000;

function timeZoneFor(user = {}) {
  const candidate = user.notificationPreferences?.timeZone || user.timeZone || DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en', { timeZone: candidate }).format();
    return candidate;
  } catch { return DEFAULT_TIME_ZONE; }
}

function localClock(now, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function dateOnly(value) {
  if (typeof value !== 'string') return null;
  // Older vaccination forms saved Date.toDateString(); preserve those records
  // without relying on the server's local timezone or permissive Date parsing.
  const legacy = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) (\d{4})$/.exec(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const candidate = legacy ? `${legacy[3]}-${String(months.indexOf(legacy[1]) + 1).padStart(2, '0')}-${legacy[2].padStart(2, '0')}` : value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate ? candidate : null;
}

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
const hashKey = (value) => createHash('sha256').update(value).digest('hex').slice(0, 40);
const entries = (value) => value && typeof value === 'object' ? Object.entries(value).filter(([, item]) => item && typeof item === 'object') : [];

function categoryFor(type = '') {
  if (type === 'routine_briefing') return 'routines';
  if (type.startsWith('vacc')) return 'vaccinations';
  if (type.startsWith('medication')) return 'medications';
  if (type.startsWith('birthday')) return 'birthdays';
  if (type.startsWith('health_')) return 'checkups';
  if (type.startsWith('mating')) return 'matingRequests';
  if (type.startsWith('adoption')) return 'adoptionInquiries';
  if (type === 'message') return 'messages';
  if (type.includes('challenge')) return 'challenges';
  if (type.includes('quiz')) return 'quizzes';
  if (type.includes('pet_nearby')) return 'nearbyMates';
  if (type.startsWith('order')) return 'orders';
  if (type === 'weekly_digest') return 'weeklyDigest';
  return 'updates';
}

function channelEnabled(user, channel, type) {
  const prefs = user?.notificationPreferences;
  if (type === 'routine_briefing' && prefs?.[channel]?.routines !== true) return false;
  return prefs?.[channel]?.enabled !== false && prefs?.[channel]?.[categoryFor(type)] !== false;
}

function isQuietTime(user, now) {
  const quiet = user.notificationPreferences?.quietHours;
  if (!quiet?.enabled) return false;
  const valid = (time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  if (!valid(quiet.start) || !valid(quiet.end) || quiet.start === quiet.end) return false;
  const { time } = localClock(now, timeZoneFor(user));
  return quiet.start < quiet.end ? time >= quiet.start && time < quiet.end : time >= quiet.start || time < quiet.end;
}

function buildHealthReminders(pets, user, now = new Date()) {
  const { date: today } = localClock(now, timeZoneFor(user));
  const reminders = [];
  const add = (petId, type, identity, title, body) => reminders.push({
    id: hashKey(`${petId}|${type}|${identity}`), type, title, body,
    data: { petId, click_action: `/pet-details/${encodeURIComponent(petId)}` },
  });
  for (const [petId, pet] of entries(pets)) {
    const name = pet.name || 'Your pet';
    for (const [index, vaccine] of entries(pet.vaccinations)) {
      const due = dateOnly(vaccine.nextDue);
      if (!due) continue;
      const days = daysBetween(today, due);
      // Due, tomorrow, seven days ahead, then at most three weekly follow-ups.
      if (![7, 1, 0, -7, -14, -21].includes(days)) continue;
      const type = days < 0 ? 'vacc_overdue' : 'vacc_due';
      add(petId, type, `${vaccine.id || vaccine.name || index}|${due}|${days}`,
        days < 0 ? 'Review a vaccination date' : 'Upcoming vaccination',
        `${name}: ${vaccine.name || 'vaccination'} ${days < 0 ? 'has a saved due date of' : 'is recorded as due on'} ${due}. Check or update the record.`);
    }
    const birth = dateOnly(pet.dateOfBirth);
    if (birth && birth <= today) {
      // Include next year to handle late December reminders for January birthdays.
      for (const year of [Number(today.slice(0, 4)), Number(today.slice(0, 4)) + 1]) {
        const birthday = dateOnly(`${year}${birth.slice(4)}`);
        if (!birthday) continue;
        const days = daysBetween(today, birthday);
        if (![0, 1, 3].includes(days)) continue;
        add(petId, 'birthday', `${birthday}|${days}`, days === 0 ? `Happy birthday, ${name}!` : `${name}'s birthday is coming up`,
          `${name} turns ${year - Number(birth.slice(0, 4))} on ${birthday}.`);
      }
    }
    // Only an explicit saved next-checkup date establishes a due visit.
    const checkup = dateOnly(pet.nextCheckup);
    if (checkup && [7, 1, 0, -7].includes(daysBetween(today, checkup))) {
      add(petId, 'health_checkup', `${checkup}|${today}`, 'Upcoming care date', `${name}'s next checkup is recorded for ${checkup}. Review the appointment details.`);
    }
    for (const [index, medication] of entries(pet.medications)) {
      if (medication.active === false || medication.reminderEnabled === false) continue;
      // Respect explicit dates only. Do not infer dose times or treatment intervals.
      const nextDose = dateOnly(medication.nextDose);
      if (nextDose !== today) continue;
      add(petId, 'medication_date', `${medication.id || medication.name || index}|${nextDose}`,
        'Saved medication date', `${name}: review the saved instructions for ${medication.name || 'medication'} today. This reminder does not record a dose as given.`);
    }
  }
  return reminders;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function buildRoutineBriefing(routines, records, pets, user, now = new Date()) {
  const prefs = user.notificationPreferences || {};
  if (prefs.push?.routines !== true && prefs.email?.routines !== true) return null;
  const { date, time } = localClock(now, timeZoneFor(user));
  const chosen = /^([01]\d|2[0-3]):[0-5]\d$/.test(prefs.routineReminderTime || '') ? prefs.routineReminderTime : '08:00';
  if (time < chosen || isQuietTime(user, now)) return null;
  const pending = entries(routines).filter(([id, routine]) => routine.active && routine.startDate <= date && pets?.[routine.petId] && records?.[id]?.status !== 'done');
  if (!pending.length) return null;
  return { id: hashKey(`routine-briefing|${date}`), type: 'routine_briefing', title: 'A little care for today', body: `${pending.length} daily routine${pending.length === 1 ? ' is' : 's are'} still open on your care plan. See what needs doing and record what’s already done.`, data: { click_action: '/today' } };
}

function buildWeeklyDigest(pets, requests, user, now = new Date(), careDays = {}) {
  const { date: today } = localClock(now, timeZoneFor(user));
  const items = [];
  let completed = 0, activeDays = 0;
  for (const [date, records] of Object.entries(careDays || {})) {
    const age = dateOnly(date) ? daysBetween(date, today) : -1;
    if (age < 1 || age > 7) continue;
    const count = Object.values(records || {}).filter(record => record?.status === 'done').length;
    completed += count;
    if (count) activeDays++;
  }
  if (completed) items.push(`Your care team recorded ${completed} daily care action${completed === 1 ? '' : 's'} across ${activeDays} day${activeDays === 1 ? '' : 's'} in the last week.`);
  const thisWeek = (date) => date && daysBetween(today, date) >= 0 && daysBetween(today, date) < 7;
  for (const [, pet] of entries(pets)) {
    const name = pet.name || 'Your pet';
    for (const [, vaccine] of entries(pet.vaccinations)) {
      const due = dateOnly(vaccine.nextDue);
      if (thisWeek(due)) items.push(`${name}: ${vaccine.name || 'vaccination'} is recorded as due on ${due}.`);
    }
    const birth = dateOnly(pet.dateOfBirth);
    if (birth && birth <= today) for (const year of [Number(today.slice(0, 4)), Number(today.slice(0, 4)) + 1]) {
      const birthday = dateOnly(`${year}${birth.slice(4)}`);
      if (thisWeek(birthday)) items.push(`${name}'s birthday is on ${birthday}.`);
    }
    const checkup = dateOnly(pet.nextCheckup);
    if (thisWeek(checkup)) items.push(`${name}'s checkup is recorded for ${checkup}.`);
  }
  const newRequests = entries(requests).filter(([, request]) => {
    const timestamp = request.createdAt ?? request.timestamp;
    return typeof timestamp === 'number' && timestamp >= now.getTime() - 7 * DAY_MS && timestamp <= now.getTime();
  }).length;
  if (newRequests) items.push(`${newRequests} new connection request${newRequests === 1 ? '' : 's'} this week.`);
  return items;
}

module.exports = { DEFAULT_TIME_ZONE, timeZoneFor, localClock, dateOnly, daysBetween, hashKey, categoryFor, channelEnabled, isQuietTime, buildHealthReminders, buildRoutineBriefing, buildWeeklyDigest, escapeHtml };
