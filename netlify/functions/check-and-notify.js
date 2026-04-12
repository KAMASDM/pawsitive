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
    const start = data.startTime?.toDate?.();
    if (start && start <= nowDate) {
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
    const end = data.endTime?.toDate?.();
    if (end && end < nowDate) {
      batch.update(doc.ref, { isActive: false });
      console.log(`[check-and-notify] Deactivating ${collectionName}/${doc.id} (ended ${end.toISOString()})`);
    }
  }

  await batch.commit();
  return justActivated;
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

    const [newChallenges, newQuizzes] = await Promise.all([
      syncCollection(db, 'challenges', now),
      syncCollection(db, 'weeklyQuiz', now),
    ]);

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
