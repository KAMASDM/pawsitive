// Netlify Scheduled Function — Auto-activate/deactivate challenges and quizzes
// based on their startTime / endTime, then push FCM topic notifications for any
// newly activated content.
//
// Runs hourly (netlify.toml: schedule = "@hourly").
// No manual activation needed — the seed data drives everything.
//
// Lifecycle per document:
//   startTime <= now AND isActive=false  → activate + send push + mark notificationSent=true
//   endTime   <  now AND isActive=true   → deactivate
//
// We query by isActive (equality, single-field index) and filter by time in JS
// to avoid needing composite Firestore indexes.

const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { credential } = require('firebase-admin');

const BASE_URL = process.env.URL || 'https://pawppy.in';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    credential: credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function isStaleActiveDocument(data, nowDate) {
  const start = toDate(data.startTime);
  const end = toDate(data.endTime);

  if (end) return end < nowDate;
  if (!start) return true;

  const maxActiveMs = 8 * 24 * 60 * 60 * 1000;
  return nowDate.getTime() - start.getTime() > maxActiveMs;
}

function isCurrentActiveDocument(data, nowDate) {
  const start = toDate(data.startTime);
  const end = toDate(data.endTime);

  if (start && start > nowDate) return false;
  if (end) return end >= nowDate;
  if (!start) return false;

  const maxActiveMs = 8 * 24 * 60 * 60 * 1000;
  return nowDate.getTime() - start.getTime() <= maxActiveMs;
}

/**
 * Activate documents whose startTime has passed and deactivate expired ones.
 * Returns the list of documents that were just activated (need notifications).
 */
async function syncCollection(db, collectionName, now) {
  const nowDate = now.toDate();
  const batch = db.batch();
  const justActivated = [];

  // 1. Find inactive docs that should now be active
  const inactiveSnap = await db
    .collection(collectionName)
    .where('isActive', '==', false)
    .get();

  for (const doc of inactiveSnap.docs) {
    const data = doc.data();
    // Skip if already notified (covers edge case of re-seeded docs)
    if (data.notificationSent) continue;
    const start = toDate(data.startTime);
    const end = toDate(data.endTime);
    if (start && start <= nowDate && (!end || end >= nowDate)) {
      batch.update(doc.ref, { isActive: true, notificationSent: true });
      justActivated.push({ id: doc.id, ...data });
      console.log(`[check-and-notify] Activating ${collectionName}/${doc.id} (started ${start.toISOString()})`);
    }
  }

  // 2. Find active docs that have expired
  const activeSnap = await db
    .collection(collectionName)
    .where('isActive', '==', true)
    .get();

  for (const doc of activeSnap.docs) {
    const data = doc.data();
    if (isStaleActiveDocument(data, nowDate)) {
      batch.update(doc.ref, { isActive: false });
      console.log(`[check-and-notify] Deactivating stale ${collectionName}/${doc.id}`);
    }
  }

  await batch.commit();
  return justActivated;
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getChallengeWindow(nowDate) {
  const istNow = new Date(nowDate.getTime() + IST_OFFSET_MS);
  const day = istNow.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue
  let daysSinceTuesday = (day - 2 + 7) % 7;

  const startIstMs = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate() - daysSinceTuesday,
    9,
    0,
    0,
    0
  );

  let startUtcMs = startIstMs - IST_OFFSET_MS;
  if (nowDate.getTime() < startUtcMs) {
    startUtcMs -= 7 * 24 * 60 * 60 * 1000;
  }

  const endUtcMs = startUtcMs + (7 * 24 * 60 * 60 * 1000) - 1;
  const startTime = new Date(startUtcMs);
  const endTime = new Date(endUtcMs);

  return {
    startTime,
    endTime,
    weekNumber: getISOWeekNumber(startTime),
    year: new Date(startTime.getTime() + IST_OFFSET_MS).getUTCFullYear(),
  };
}

async function ensureCurrentChallenge(db, now) {
  const nowDate = now.toDate();
  const activeSnap = await db
    .collection('challenges')
    .where('isActive', '==', true)
    .get();

  if (activeSnap.docs.some((doc) => isCurrentActiveDocument(doc.data(), nowDate))) {
    return [];
  }

  const { startTime, endTime, weekNumber, year } = getChallengeWindow(nowDate);
  if (nowDate < startTime || nowDate > endTime) return [];

  const challengeRef = db.collection('challenges').doc(`challenge-${year}-W${String(weekNumber).padStart(2, '0')}`);
  const existing = await challengeRef.get();
  if (existing.exists) return [];

  const templatesSnap = await db.collection('challengeTemplates').get();
  if (templatesSnap.empty) {
    console.warn('[check-and-notify] No challengeTemplates found; cannot create fallback challenge');
    return [];
  }

  const templates = templatesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => Number(a.weekOffset || a.id) - Number(b.weekOffset || b.id));
  const template = templates[(weekNumber - 1) % templates.length];

  const challenge = {
    isActive: true,
    notificationSent: true,
    prompt: template.prompt,
    theme: template.theme,
    emoji: template.emoji || '🐾',
    weekNumber,
    year,
    entryCount: 0,
    winnerId: null,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    createdAt: now,
  };

  await challengeRef.set(challenge);
  console.log(`[check-and-notify] Created fallback challenge ${challengeRef.id}: "${challenge.theme}"`);
  return [{ id: challengeRef.id, ...challenge }];
}

async function sendChallengeNotifications(messaging, newChallenges) {
  let count = 0;
  for (const data of newChallenges) {
    try {
      await messaging.send({
        topic: 'new-challenges',
        notification: {
          title: '🏆 New Pawppy Challenge!',
          body: `${data.theme || 'New Challenge'}: "${data.prompt || 'Show us your pet!'}"`,
        },
        webpush: {
          notification: { icon: '/favicon.png', badge: '/favicon.png' },
          fcm_options: { link: `${BASE_URL}/challenge` },
        },
        data: { type: 'new_challenge', challengeId: data.id, click_action: '/challenge' },
      });
      count++;
      console.log(`[check-and-notify] Push sent for challenge "${data.theme}"`);
    } catch (err) {
      console.error(`[check-and-notify] Push failed for challenge ${data.id}:`, err.message);
    }
  }
  return count;
}

async function sendQuizNotifications(messaging, newQuizzes) {
  let count = 0;
  for (const data of newQuizzes) {
    try {
      await messaging.send({
        topic: 'new-quizzes',
        notification: {
          title: '🧠 New Weekly Quiz!',
          body: `${data.title || 'New Quiz'} — ${data.topic || 'Pet Knowledge'}. Can you get 5/5? 🌟`,
        },
        webpush: {
          notification: { icon: '/favicon.png', badge: '/favicon.png' },
          fcm_options: { link: `${BASE_URL}/quiz` },
        },
        data: { type: 'new_quiz', quizId: data.id, click_action: '/quiz' },
      });
      count++;
      console.log(`[check-and-notify] Push sent for quiz "${data.title}"`);
    } catch (err) {
      console.error(`[check-and-notify] Push failed for quiz ${data.id}:`, err.message);
    }
  }
  return count;
}

exports.handler = async () => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const messaging = getMessaging(app);
    const now = Timestamp.now();

    const [scheduledChallenges, newQuizzes] = await Promise.all([
      syncCollection(db, 'challenges', now),
      syncCollection(db, 'weeklyQuiz', now),
    ]);

    const fallbackChallenges = await ensureCurrentChallenge(db, now);
    const newChallenges = [...scheduledChallenges, ...fallbackChallenges];

    const [challengesSent, quizzesSent] = await Promise.all([
      sendChallengeNotifications(messaging, newChallenges),
      sendQuizNotifications(messaging, newQuizzes),
    ]);

    console.log(`[check-and-notify] Done — activated ${newChallenges.length} challenge(s), ${newQuizzes.length} quiz(zes); sent ${challengesSent + quizzesSent} push(es)`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        activated: { challenges: newChallenges.length, quizzes: newQuizzes.length },
        pushed: { challenges: challengesSent, quizzes: quizzesSent },
      }),
    };
  } catch (err) {
    console.error('[check-and-notify] Fatal error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
