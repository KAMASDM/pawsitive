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

const content = `// AUTO-GENERATED — scripts/generate-firebase-sw.js
// Register before Firebase so custom notification clicks are handled reliably.
self.addEventListener('notificationclick', (event) => {
  const message = event.notification.data?.FCM_MSG;
  const path = event.notification.data?.click_action || message?.data?.click_action || message?.fcmOptions?.link || message?.webpush?.fcm_options?.link;
  // Handle both Firebase-displayed and app-displayed notifications.
  if (!path) return;
  event.stopImmediatePropagation();
  event.notification.close();
  const target = new URL(path, self.location.origin);
  if (target.origin !== self.location.origin) return;
  target.searchParams.set('notificationSource', 'push');
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
        const navigated = await client.navigate(target.href);
        if (navigated) return navigated.focus();
      }
    }
    return clients.openWindow(target.href);
  }));
});
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify({ apiKey, authDomain, projectId, storageBucket, messagingSenderId: senderId, appId })});
firebase.messaging().onBackgroundMessage((payload) => {
  // Notification payloads are already displayed by Firebase. Only render data-only messages.
  if (payload.notification) return;
  return self.registration.showNotification(payload.data?.title || 'Pawppy', {
    body: payload.data?.body || 'Open Pawppy to view your update.',
    icon: '/favicon.png', badge: '/favicon.png',
    tag: payload.data?.notificationId || payload.data?.type,
    data: payload.data || {},
  });
});
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'UPDATE_BADGE') return;
  const count = Math.max(0, Number(event.data.count) || 0);
  if (count && self.navigator.setAppBadge) event.waitUntil(self.navigator.setAppBadge(count));
  else if (self.navigator.clearAppBadge) event.waitUntil(self.navigator.clearAppBadge());
});
`;

const outPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-firebase-sw] Written:', outPath);
