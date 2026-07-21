import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';

/**
 * Badge Management Service
 * Handles app icon badge counter for notifications
 */

let unsubscribeListener = null;

/**
 * Start listening to unread notifications count and update badge
 */
export const startBadgeListener = (userId) => {
  if (!userId) {
    console.log('No user ID provided for badge listener');
    return;
  }

  // Stop any existing listener
  stopBadgeListener();

  const db = getDatabase();
  const unreadRef = ref(db, `users/${userId}/unreadNotifications`);

  console.log('Starting badge listener for user:', userId);

  unsubscribeListener = onValue(unreadRef, (snapshot) => {
    const count = snapshot.val() || 0;
    console.log('Unread notifications count:', count);

    // Update badge using Badging API (PWA)
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => {
          console.error('Error setting app badge:', err);
        });
      } else {
        navigator.clearAppBadge().catch(err => {
          console.error('Error clearing app badge:', err);
        });
      }
    }

    // Also notify service worker to update badge
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_BADGE',
        userId: userId
      });
    }
  });
};

/**
 * Stop listening to unread notifications
 */
export const stopBadgeListener = () => {
  if (unsubscribeListener) {
    unsubscribeListener();
    unsubscribeListener = null;
    console.log('Badge listener stopped');
  }
};

/**
 * Clear unread notifications count
 * Call this when user views their notifications/requests/messages
 */
export const clearUnreadNotifications = async (userId) => {
  if (!userId) return;

  const db = getDatabase();
  const unreadRef = ref(db, `users/${userId}/unreadNotifications`);

  try {
    await set(unreadRef, 0);
    console.log('Cleared unread notifications for user:', userId);

    // Clear badge
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
    }

    // Notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_BADGE'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error clearing unread notifications:', error);
    return { success: false, error };
  }
};

/**
 * Get current unread count
 */
export const getUnreadCount = async (userId) => {
  if (!userId) return 0;

  const db = getDatabase();
  const unreadRef = ref(db, `users/${userId}/unreadNotifications`);

  try {
    const snapshot = await get(unreadRef);
    return snapshot.val() || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Initialize badge management
 * Call this when user logs in
 */
export const initializeBadgeManagement = () => {
  const auth = getAuth();
  
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User logged in, starting badge management');
      startBadgeListener(user.uid);
    } else {
      console.log('User logged out, stopping badge management');
      stopBadgeListener();
      
      // Clear badge when logged out
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge();
      }
    }
  });
};
