const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

const COMMERCE_ADMIN_EMAIL = 'anantsoftcomputing@gmail.com';
const ALLOWED_ORIGINS = [
  'https://pawppy.in',
  'https://www.pawppy.in',
  'http://localhost:3000',
  'http://localhost:5173',
];

function corsHeaders(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(statusCode, event, body) {
  return {
    statusCode,
    headers: { ...corsHeaders(event), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL,
  });
}

async function requireAuth(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  if (!token) {
    const error = new Error('Missing Firebase ID token.');
    error.statusCode = 401;
    throw error;
  }

  const app = getFirebaseApp();
  return getAuth(app).verifyIdToken(token);
}

function requireAdmin(decodedToken) {
  const email = (decodedToken.email || '').toLowerCase();
  if (decodedToken.role !== 'admin' && email !== COMMERCE_ADMIN_EMAIL) {
    const error = new Error('Admin access required.');
    error.statusCode = 403;
    throw error;
  }
}

function getServices() {
  const app = getFirebaseApp();
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    rtdb: getDatabase(app),
  };
}

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (error) {
    const parseError = new Error('Invalid JSON body.');
    parseError.statusCode = 400;
    throw parseError;
  }
}

async function writeUserNotification(userId, notification) {
  if (!userId) return null;
  const { rtdb } = getServices();
  const notificationRef = rtdb.ref(`notifications/${userId}`).push();
  const payload = {
    ...notification,
    timestamp: Date.now(),
    read: false,
  };
  await notificationRef.set(payload);
  return { id: notificationRef.key, ...payload };
}

function handleOptions(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' };
  }
  return null;
}

module.exports = {
  COMMERCE_ADMIN_EMAIL,
  FieldValue,
  Timestamp,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAdmin,
  requireAuth,
  writeUserNotification,
};
