#!/usr/bin/env node
/**
 * Generates public/firebase-messaging-sw.js from VITE_FIREBASE_* environment
 * variables so that the Firebase API key is never hardcoded in the repository.
 *
 * Run automatically as part of the build:
 *   netlify.toml   →  command = "node scripts/generate-firebase-sw.js && npm run build"
 *   package.json   →  "prebuild": "node scripts/generate-firebase-sw.js"
 */

const fs = require('fs');
const path = require('path');

// Manually parse .env file (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(
    '[generate-firebase-sw] WARNING: Missing env vars:',
    missing.join(', '),
    '— service worker will not be able to initialise Firebase.'
  );
}

const apiKey          = process.env.VITE_FIREBASE_API_KEY          || '';
const authDomain      = process.env.VITE_FIREBASE_AUTH_DOMAIN      || '';
const projectId       = process.env.VITE_FIREBASE_PROJECT_ID       || '';
const storageBucket   = process.env.VITE_FIREBASE_STORAGE_BUCKET   || '';
const senderId        = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
const appId           = process.env.VITE_FIREBASE_APP_ID           || '';
const measurementId   = process.env.VITE_FIREBASE_MEASUREMENT_ID   || '';
const databaseURL     = process.env.VITE_FIREBASE_DATABASE_URL     || '';

const content = `// AUTO-GENERATED — do not edit by hand.
// Regenerated at build time by scripts/generate-firebase-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js');

firebase.initializeApp({
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${senderId}",
  appId: "${appId}",
  measurementId: "${measurementId}",
  databaseURL: "${databaseURL}"
});

const messaging = firebase.messaging();
const database = firebase.database();

async function updateBadge(userId) {
  if (!userId) return 0;
  try {
    const snapshot = await database.ref(\`users/\${userId}/unreadNotifications\`).once('value');
    const count = snapshot.val() || 0;
    if (navigator.setAppBadge) {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    }
    return count;
  } catch (error) {
    console.error('Error updating badge:', error);
    return 0;
  }
}

messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const userId = payload.data?.receiverId;
  let badgeCount = 0;
  if (userId) {
    badgeCount = await updateBadge(userId);
  }
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/favicon.png',
    badge: '/favicon.png',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open App' }
    ],
    tag: payload.data?.notificationId || 'default',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  if (badgeCount > 0) {
    notificationOptions.body += \` (\${badgeCount} unread)\`;
  }
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', async (event) => {
  console.log('[Service Worker] Notification click received.', event);
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.click_action || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    const { userId } = event.data;
    await updateBadge(userId);
  }
});
`;

const outPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-firebase-sw] Written:', outPath);
