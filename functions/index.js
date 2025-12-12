const {onValueCreated} = require('firebase-functions/v2/database');
const {onCall} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
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

// ============================================================================
// SCHEDULED EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Daily Email Notification Scheduler
 * Runs every day at 9 AM IST (3:30 AM UTC)
 * Checks for:
 * - Vaccination reminders (7 days before due)
 * - Pet birthday reminders (3 days before)
 * - Health checkup reminders (6 months overdue)
 */
exports.dailyEmailNotifications = onSchedule(
  {
    schedule: '30 3 * * *', // 3:30 AM UTC = 9:00 AM IST
    timeZone: 'UTC',
    memory: '512MB',
  },
  async (event) => {
    console.log('Running daily email notification checks...');
    
    try {
      const db = admin.database();
      
      // Get all users
      const usersSnapshot = await db.ref('users').once('value');
      if (!usersSnapshot.exists()) {
        console.log('No users found');
        return null;
      }

      const users = usersSnapshot.val();
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let emailsSent = 0;

      for (const [userId, userData] of Object.entries(users)) {
        if (!userData.email || !userData.pets) continue;

        for (const [petId, petData] of Object.entries(userData.pets)) {
          // 1. Check Vaccination Reminders
          if (petData.vaccinations) {
            for (const [vaccinationId, vaccination] of Object.entries(petData.vaccinations)) {
              if (!vaccination.nextDue) continue;

              const dueDate = new Date(vaccination.nextDue);
              const dueDateStr = dueDate.toISOString().split('T')[0];
              const targetDateStr = sevenDaysFromNow.toISOString().split('T')[0];
              
              if (dueDateStr === targetDateStr) {
                console.log(`Sending vaccination reminder to ${userData.email} for ${petData.name}`);
                
                // Send email via EmailJS HTTP API
                await sendVaccinationEmail(userData, petData, vaccination);
                emailsSent++;
              }
            }
          }

          // 2. Check Pet Birthday Reminders
          if (petData.dateOfBirth) {
            const birthDate = new Date(petData.dateOfBirth);
            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            const threeDaysBeforeBirthday = new Date(thisYearBirthday);
            threeDaysBeforeBirthday.setDate(threeDaysBeforeBirthday.getDate() - 3);
            
            const todayStr = today.toISOString().split('T')[0];
            const reminderDateStr = threeDaysBeforeBirthday.toISOString().split('T')[0];
            
            if (todayStr === reminderDateStr) {
              console.log(`Sending birthday reminder to ${userData.email} for ${petData.name}`);
              
              await sendBirthdayEmail(userData, petData);
              emailsSent++;
            }
          }

          // 3. Check Health Checkup Reminders
          const lastCheckup = petData.lastCheckup ? new Date(petData.lastCheckup) : null;
          
          if (!lastCheckup || lastCheckup < sixMonthsAgo) {
            // Only send once per pet (check if we already sent this notification)
            const notificationKey = `healthCheckup_${petId}_${today.toISOString().split('T')[0]}`;
            const notificationSnapshot = await db.ref(`notificationsSent/${userId}/${notificationKey}`).once('value');
            
            if (!notificationSnapshot.exists()) {
              console.log(`Sending health checkup reminder to ${userData.email} for ${petData.name}`);
              
              await sendHealthCheckupEmail(userData, petData);
              
              // Mark as sent
              await db.ref(`notificationsSent/${userId}/${notificationKey}`).set({
                sentAt: Date.now(),
                type: 'healthCheckup',
                petId: petId,
              });
              
              emailsSent++;
            }
          }
        }
      }

      console.log(`Daily email notifications completed. Sent ${emailsSent} emails.`);
      return { success: true, emailsSent };
      
    } catch (error) {
      console.error('Error in daily email notifications:', error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Weekly Email Notification Scheduler
 * Runs every Monday at 9 AM IST (3:30 AM UTC)
 * Sends:
 * - Weekly activity digest
 * - Nearby mates alerts
 */
exports.weeklyEmailNotifications = onSchedule(
  {
    schedule: '30 3 * * 1', // Every Monday at 3:30 AM UTC = 9:00 AM IST
    timeZone: 'UTC',
    memory: '512MB',
  },
  async (event) => {
    console.log('Running weekly email notification checks...');
    
    try {
      const db = admin.database();
      const usersSnapshot = await db.ref('users').once('value');
      
      if (!usersSnapshot.exists()) {
        console.log('No users found');
        return null;
      }

      const users = usersSnapshot.val();
      let emailsSent = 0;

      for (const [userId, userData] of Object.entries(users)) {
        if (!userData.email) continue;

        // Send weekly digest
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const digestData = await getUserWeeklyActivity(db, userId, oneWeekAgo);

        if (digestData.newRequests > 0 || digestData.newMessages > 0 || digestData.upcomingReminders.length > 0) {
          console.log(`Sending weekly digest to ${userData.email}`);
          
          await sendWeeklyDigestEmail(userData, digestData);
          emailsSent++;
        }
      }

      console.log(`Weekly email notifications completed. Sent ${emailsSent} emails.`);
      return { success: true, emailsSent };
      
    } catch (error) {
      console.error('Error in weekly email notifications:', error);
      return { success: false, error: error.message };
    }
  }
);

// ============================================================================
// EMAIL HELPER FUNCTIONS (Using EmailJS HTTP API)
// ============================================================================

const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_USER_ID = '9Ic6G_vwTk3Wl8Szu';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const EMAIL_STYLES = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;',
  header: 'background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center;',
  content: 'background: white; padding: 30px; border-radius: 10px; margin: 20px;',
  button: 'display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;',
  footer: 'text-align: center; padding: 20px; color: #6b7280; font-size: 12px;',
  highlight: 'background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed;',
  petInfo: 'background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;',
};

async function sendEmailViaEmailJS(to_email, to_name, subject, htmlMessage) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: {
          to_email,
          to_name,
          from_name: 'Pawppy',
          subject,
          message: htmlMessage,
        },
      }),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${to_email}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`Failed to send email: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendVaccinationEmail(userData, petData, vaccination) {
  const dueDate = new Date(vaccination.nextDue).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">💉 Vaccination Reminder</h1>
      </div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          This is a friendly reminder that <strong>${petData.name}</strong> has an upcoming vaccination due soon!
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🐕 Pet Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${petData.name}</p>
          <p style="margin: 5px 0;"><strong>Breed:</strong> ${petData.breed || 'Not specified'}</p>
        </div>
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #dc2626;">⚠️ Vaccination Details</h3>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Vaccine:</strong> ${vaccination.name}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <div style="text-align: center;">
          <a href="https://pawppy.in/profile?tab=pets" style="${EMAIL_STYLES.button}">View Pet Profile →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Never miss important pet care dates</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmailViaEmailJS(
    userData.email,
    userData.displayName,
    `💉 Vaccination Reminder: ${vaccination.name} due for ${petData.name}`,
    htmlMessage
  );
}

async function sendBirthdayEmail(userData, petData) {
  const birthdayDate = new Date(petData.dateOfBirth).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🎂 Birthday Coming Up!</h1>
      </div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Get ready to celebrate! <strong>${petData.name}</strong>'s birthday is on <strong>${birthdayDate}</strong>! 🎉
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🎈 Birthday Celebration Ideas</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li>🦴 Special treats or favorite food</li>
            <li>🎾 New toys or playtime at the park</li>
            <li>📸 Photo shoot with birthday decorations</li>
          </ul>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Celebrating Every Moment</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmailViaEmailJS(
    userData.email,
    userData.displayName,
    `🎂 ${petData.name}'s Birthday is Coming Up!`,
    htmlMessage
  );
}

async function sendHealthCheckupEmail(userData, petData) {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🏥 Health Checkup Due</h1>
      </div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          It's time for <strong>${petData.name}</strong>'s health checkup!
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #dc2626;">⚕️ Why Regular Checkups Matter</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li>Early detection of health issues</li>
            <li>Monitor weight and nutrition</li>
            <li>Update vaccinations if needed</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="https://pawppy.in/profile?tab=pets" style="${EMAIL_STYLES.button}">Update Health Record →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Your Pet's Health Partner</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmailViaEmailJS(
    userData.email,
    userData.displayName,
    `🏥 Time for ${petData.name}'s health checkup`,
    htmlMessage
  );
}

async function sendWeeklyDigestEmail(userData, digestData) {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">📊 Your Weekly Digest</h1>
      </div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Here's what happened this week with your pets on Pawppy!
        </p>
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">📈 This Week's Activity</h3>
          <p><strong>${digestData.newRequests || 0}</strong> Mating Requests</p>
          <p><strong>${digestData.newMessages || 0}</strong> New Messages</p>
        </div>
        ${digestData.upcomingReminders && digestData.upcomingReminders.length > 0 ? `
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #dc2626;">⏰ Upcoming Reminders</h3>
          <ul style="line-height: 1.8; color: #374151;">
            ${digestData.upcomingReminders.map(reminder => `<li>${reminder}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        <div style="text-align: center;">
          <a href="https://pawppy.in/profile" style="${EMAIL_STYLES.button}">View Full Dashboard →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Your Weekly Update</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmailViaEmailJS(
    userData.email,
    userData.displayName,
    '📊 Your Weekly Pawppy Digest',
    htmlMessage
  );
}

async function getUserWeeklyActivity(db, userId, sinceTimestamp) {
  try {
    let newRequests = 0;
    let newMessages = 0;
    const upcomingReminders = [];

    // Get mating requests
    const requestsSnapshot = await db.ref(`matingRequests/${userId}`).once('value');
    if (requestsSnapshot.exists()) {
      const requests = requestsSnapshot.val();
      newRequests = Object.values(requests).filter(
        req => req.timestamp > sinceTimestamp
      ).length;
    }

    // Get messages
    const conversationsSnapshot = await db.ref('conversations').once('value');
    if (conversationsSnapshot.exists()) {
      const conversations = conversationsSnapshot.val();
      for (const [convId, convData] of Object.entries(conversations)) {
        if (!convId.includes(userId)) continue;
        
        if (convData.messages) {
          newMessages += Object.values(convData.messages).filter(
            msg => msg.timestamp > sinceTimestamp && msg.senderId !== userId
          ).length;
        }
      }
    }

    // Get upcoming reminders
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      
      if (userData.pets) {
        const nextWeek = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        for (const petData of Object.values(userData.pets)) {
          if (petData.vaccinations) {
            for (const vaccination of Object.values(petData.vaccinations)) {
              if (vaccination.nextDue) {
                const dueDate = new Date(vaccination.nextDue).getTime();
                if (dueDate > Date.now() && dueDate < nextWeek) {
                  upcomingReminders.push(
                    `${petData.name}: ${vaccination.name} due on ${new Date(vaccination.nextDue).toLocaleDateString()}`
                  );
                }
              }
            }
          }
        }
      }
    }

    return {
      newRequests,
      newMessages,
      upcomingReminders,
    };
  } catch (error) {
    console.error('Error getting user weekly activity:', error);
    return {
      newRequests: 0,
      newMessages: 0,
      upcomingReminders: [],
    };
  }
}
