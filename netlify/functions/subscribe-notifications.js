// Netlify Function: Subscribe an FCM device token to the new-challenges and
// new-quizzes broadcast topics so the device receives push notifications when
// new content goes live.
//
// Called by the client after FCM permission is granted, replacing the Firebase
// Callable Function that could not be deployed due to billing limitations.

const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { credential } = require('firebase-admin');

const ALLOWED_ORIGINS = [
  'https://pawppy.in',
  'https://www.pawppy.in',
  'http://localhost:3000',
  'http://localhost:5173',
];

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

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');
    if (!token || typeof token !== 'string') {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing FCM token' }),
      };
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    await Promise.all([
      messaging.subscribeToTopic([token], 'new-challenges'),
      messaging.subscribeToTopic([token], 'new-quizzes'),
    ]);

    console.log('[subscribe-notifications] Subscribed token to new-challenges + new-quizzes');
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('[subscribe-notifications] Error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
