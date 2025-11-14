// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAIK_piYZ9ttfMmFYIotFNpcWe4qO_iLa4",
  authDomain: "sweekar-af756.firebaseapp.com",
  projectId: "sweekar-af756",
  storageBucket: "sweekar-af756.appspot.com",
  messagingSenderId: "984127079768",
  appId: "1:984127079768:web:5be10e9344efbf3e76d12d",
  measurementId: "G-RYNR8WMV90",
  databaseURL: "https://sweekar-af756-default-rtdb.firebaseio.com/"
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
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: true,
    ...(badgeCount > 0 && { badge: badgeCount }),
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
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
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      await navigator.clearAppBadge();
    }
  }
});
