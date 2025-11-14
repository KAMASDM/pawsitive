const {onValueCreated} = require('firebase-functions/v2/database');
const {onCall} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Send push notification when a mating request is created
 * Triggered by database write to /matingRequests/{requestId}
 */
exports.sendMatingRequestNotification = onValueCreated(
  '/matingRequests/{requestId}',
  async (event) => {
    try {
      const requestData = event.data.val();
      const { receiverId, senderId, senderPetId } = requestData;
      const requestId = event.params.requestId;

      console.log('Processing mating request notification:', { requestId, receiverId, senderId });

      // Get receiver's FCM token
      const receiverTokenSnapshot = await admin.database()
        .ref(`users/${receiverId}/fcmToken`)
        .once('value');
      
      const fcmToken = receiverTokenSnapshot.val();

      if (!fcmToken) {
        console.log('No FCM token found for user:', receiverId);
        return null;
      }

      // Get sender's details
      const senderSnapshot = await admin.database()
        .ref(`users/${senderId}`)
        .once('value');
      
      const senderData = senderSnapshot.val();

      // Get sender's pet details
      const petSnapshot = await admin.database()
        .ref(`pets/${senderPetId}`)
        .once('value');
      
      const petData = petSnapshot.val();

      // Prepare notification payload
      const message = {
        token: fcmToken,
        notification: {
          title: '💕 New Mating Request',
          body: `${senderData.displayName || 'Someone'} wants to mate their ${petData.breed || 'pet'} with yours!`,
          icon: '/favicon.png',
          badge: '/favicon.png',
        },
        data: {
          type: 'mating_request',
          requestId: requestId,
          senderId: senderId,
          receiverId: receiverId, // Added for badge update
          click_action: '/profile?tab=requests',
        },
        webpush: {
          fcm_options: {
            link: `${process.env.VITE_BASE_URL || 'https://pawppy.in'}/profile?tab=requests`,
          },
        },
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log('Successfully sent mating request notification:', response);

      // Increment unread count for badge
      await admin.database()
        .ref(`users/${receiverId}/unreadNotifications`)
        .transaction((current) => (current || 0) + 1);

      return response;
    } catch (error) {
      console.error('Error sending mating request notification:', error);
      return null;
    }
  }
);

/**
 * Send push notification when a new message is received
 * Triggered by database write to /conversations/{conversationId}/messages/{messageId}
 */
exports.sendMessageNotification = onValueCreated(
  '/conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    try {
      const messageData = event.data.val();
      const conversationId = event.params.conversationId;
      const { senderId, text, timestamp } = messageData;

      console.log('Processing message notification:', { conversationId, senderId });

      // Get conversation details to find receiver
      const conversationSnapshot = await admin.database()
        .ref(`conversations/${conversationId}`)
        .once('value');
      
      const conversationData = conversationSnapshot.val();
      const participants = conversationData.participants || [];
      
      // Find receiver (the participant who is not the sender)
      const receiverId = participants.find(id => id !== senderId);

      if (!receiverId) {
        console.log('No receiver found in conversation:', conversationId);
        return null;
      }

      // Get receiver's FCM token
      const receiverTokenSnapshot = await admin.database()
        .ref(`users/${receiverId}/fcmToken`)
        .once('value');
      
      const fcmToken = receiverTokenSnapshot.val();

      if (!fcmToken) {
        console.log('No FCM token found for user:', receiverId);
        return null;
      }

      // Get sender's details
      const senderSnapshot = await admin.database()
        .ref(`users/${senderId}`)
        .once('value');
      
      const senderData = senderSnapshot.val();

      // Prepare notification payload
      const message = {
        token: fcmToken,
        notification: {
          title: `💬 ${senderData.displayName || 'Someone'}`,
          body: text.length > 100 ? text.substring(0, 100) + '...' : text,
          icon: senderData.photoURL || '/favicon.png',
          badge: '/favicon.png',
        },
        data: {
          type: 'message',
          conversationId: conversationId,
          senderId: senderId,
          receiverId: receiverId, // Added for badge update
          click_action: '/profile?tab=messages',
        },
        webpush: {
          fcm_options: {
            link: `${process.env.VITE_BASE_URL || 'https://pawppy.in'}/profile?tab=messages`,
          },
        },
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message notification:', response);

      // Increment unread count for badge
      await admin.database()
        .ref(`users/${receiverId}/unreadNotifications`)
        .transaction((current) => (current || 0) + 1);

      return response;
    } catch (error) {
      console.error('Error sending message notification:', error);
      return null;
    }
  }
);

/**
 * Clear unread notifications count
 * Called via HTTP when user views notifications
 */
exports.clearUnreadNotifications = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;

    // Clear the unread count
    await admin.database()
      .ref(`users/${userId}/unreadNotifications`)
      .set(0);

    console.log('Cleared unread notifications for user:', userId);

    return { success: true, message: 'Unread notifications cleared' };
  } catch (error) {
    console.error('Error clearing unread notifications:', error);
    throw new Error('Failed to clear notifications');
  }
});
