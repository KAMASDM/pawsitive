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

const BASE_URL = 'https://pawppy.in';

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
  const userId = payload.data?.receiverId;
  let badgeCount = 0;
  if (userId) {
    badgeCount = await updateBadge(userId);
  }
  const notificationTitle = payload.notification?.title || 'Pawppy';
  let notificationBody = payload.notification?.body || 'You have a new notification';
  if (badgeCount > 0) {
    notificationBody += \` (\${badgeCount} unread)\`;
  }
  const notificationOptions = {
    body: notificationBody,
    icon: BASE_URL + '/favicon.png',
    badge: BASE_URL + '/favicon.png',
    data: payload.data || {},
    actions: [{ action: 'open', title: 'Open Pawppy' }],
    tag: payload.data?.notificationId || payload.data?.type || 'default',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    // click_action is a path like "/challenge" — always resolve to an absolute URL
    const path = event.notification.data?.click_action || '/';
    const fullUrl = path.startsWith('http') ? path : BASE_URL + path;
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Focus an existing tab that matches the target path
        for (const client of windowClients) {
          try {
            const clientPath = new URL(client.url).pathname;
            const targetPath = new URL(fullUrl).pathname;
            if (clientPath === targetPath && 'focus' in client) {
              return client.focus();
            }
          } catch (_) {}
        }
        // Navigate any open Pawppy tab to the target URL
        for (const client of windowClients) {
          if (client.url.startsWith(BASE_URL) && 'navigate' in client) {
            return client.navigate(fullUrl).then((c) => c && c.focus());
          }
        }
        // No existing tab — open a new one
        return clients.openWindow(fullUrl);
      })
    );
  }
});

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    await updateBadge(event.data.userId);
  }
});
`;

const outPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-firebase-sw] Written:', outPath);
