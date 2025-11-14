// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js');

// Fetch Firebase config from Netlify function for better security
// This keeps the API key out of the service worker file and Git history
fetch('/.netlify/functions/firebase-config')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config');
    }
    return response.json();
  })
  .then(config => {
    // Initialize Firebase with config from Netlify function
    firebase.initializeApp(config);

    // Retrieve an instance of Firebase Messaging and Database
    const messaging = firebase.messaging();
    const database = firebase.database();

    // Helper function to get unread count and update badge
    async function updateBadge(userId) {
      if (!userId) return 0;
      
      try {
        const snapshot = await database.ref(`users/${userId}/unreadNotifications`).once('value');
        const count = snapshot.val() || 0;
        
        // Update badge on app icon
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

    // Handle background messages
    messaging.onBackgroundMessage(async (payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      // Get unread count for badge
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
        // Show badge count in notification
        ...(badgeCount > 0 && { badge: badgeCount }),
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'close',
            title: 'Dismiss'
          }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

    // Handle notification clicks
    self.addEventListener('notificationclick', async (event) => {
      console.log('[Service Worker] Notification click received.', event);
      
      event.notification.close();
      
      if (event.action === 'open' || !event.action) {
        const urlToOpen = event.notification.data?.click_action || '/';
        
        // Open the app when notification is clicked
        event.waitUntil(
          clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
              // Check if there's already a window open
              for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                  return client.focus();
                }
              }
              // If no window is open, open a new one
              if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
              }
            })
        );
      }
    });

    // Listen for messages from the main app to update badge
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

    console.log('[firebase-messaging-sw.js] Firebase initialized successfully from Netlify function');
  })
  .catch(error => {
    console.error('[firebase-messaging-sw.js] Error fetching Firebase config:', error);
    console.log('[firebase-messaging-sw.js] Service worker will not function properly without config');
    
    // Note: We intentionally don't provide a fallback here in production
    // If the Netlify function fails, something is wrong and should be investigated
    // For local development, you can add a fallback or use environment variables
  });
