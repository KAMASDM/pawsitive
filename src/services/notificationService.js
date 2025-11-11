import emailjs from '@emailjs/browser';
import { getDatabase, ref, set, push, get } from 'firebase/database';
import { getMessaging, getToken } from 'firebase/messaging';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '9Ic6G_vwTk3Wl8Szu';

// Email Template IDs - You can create separate templates in EmailJS for each type
const EMAIL_TEMPLATES = {
  WELCOME: 'template_pe8gs6o',        // Welcome email template
  MATING_REQUEST: 'template_pe8gs6o', // Mating request notification  
  REQUEST_ACCEPTED: 'template_pe8gs6o', // Request accepted notification
  VACCINATION_REMINDER: 'template_pe8gs6o', // Vaccination reminder
};

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Get user notification preferences
 */
export const getUserPreferences = async (userId) => {
  const db = getDatabase();
  const prefsRef = ref(db, `users/${userId}/notificationPreferences`);
  const snapshot = await get(prefsRef);
  
  if (snapshot.exists()) {
    return snapshot.val();
  }
  
  // Default preferences
  return {
    email: {
      matingRequests: true,
      adoptionInquiries: true,
      messages: true,
      vaccinations: true,
      nearbyMates: true,
    },
    push: {
      matingRequests: true,
      adoptionInquiries: true,
      messages: true,
      vaccinations: true,
      nearbyMates: true,
    },
  };
};

/**
 * Check if user wants to receive this notification type
 */
const shouldSendNotification = async (userId, notificationType, channel) => {
  const prefs = await getUserPreferences(userId);
  return prefs?.[channel]?.[notificationType] !== false;
};

/**
 * Log notification to database
 */
const logNotification = async (userId, notificationData) => {
  const db = getDatabase();
  const notificationsRef = ref(db, `notifications/${userId}`);
  const newNotificationRef = push(notificationsRef);
  
  await set(newNotificationRef, {
    ...notificationData,
    timestamp: Date.now(),
    read: false,
  });
};

/**
 * Send Email Notification
 */
export const sendEmail = async (templateParams, templateId = EMAIL_TEMPLATES.WELCOME) => {
  try {
    console.log('Sending email with params:', {
      templateId,
      to: templateParams.to_email,
      name: templateParams.name,
      hasMessage: !!templateParams.message
    });
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );
    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
};

/**
 * Send Push Notification
 */
export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const db = getDatabase();
    const tokenRef = ref(db, `users/${userId}/fcmToken`);
    const snapshot = await get(tokenRef);
    
    if (!snapshot.exists()) {
      console.log('No FCM token found for user');
      return { success: false, error: 'No FCM token' };
    }
    
    const token = snapshot.val();
    
    // Store notification for in-app display
    await logNotification(userId, {
      type: 'push',
      title,
      body,
      data,
    });
    
    // Note: Actual push notification sending would require a backend
    // For now, we'll just log it and store it in the database
    console.log('Push notification queued:', { title, body, token });
    
    return { success: true };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, error };
  }
};

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Welcome Email Template
 */
export const sendWelcomeEmail = async (userData) => {
  const emailParams = {
    name: userData.displayName || 'Pet Parent',
    to_email: userData.email,
    subject: `Welcome to Pawppy, ${userData.displayName || 'Pet Parent'}!`,
    message: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f3ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b77c3 0%, #a78bfa 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🐾 Welcome to Pawppy!</h1>
              <p style="color: #f3f0f9; margin: 10px 0 0 0; font-size: 16px;">Your Pet's New Best Friend</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi <strong>${userData.displayName || 'there'}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.8;">
                We're thrilled to have you join our community of pet lovers! 🎉 Pawppy is here to help you connect with other pet parents, find perfect mating partners, and keep your furry friends healthy and happy.
              </p>
              
              <!-- Quick Start Guide Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f3f0f9 0%, #e9d5ff 100%); border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #8b77c3; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">� Quick Start Guide</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="vertical-align: top; width: 30px;">
                          <span style="font-size: 20px;">🐕</span>
                        </td>
                        <td style="color: #4a3a6b; font-size: 15px; line-height: 1.6;">
                          <strong>Add Your Pet's Profile</strong><br/>
                          Share photos and details about your furry friend
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">💉</span>
                        </td>
                        <td style="color: #4a3a6b; font-size: 15px; line-height: 1.6;">
                          <strong>Track Vaccinations</strong><br/>
                          Never miss an important vaccination date
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">💕</span>
                        </td>
                        <td style="color: #4a3a6b; font-size: 15px; line-height: 1.6;">
                          <strong>Browse Nearby Mates</strong><br/>
                          Find the perfect match for your pet
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">🏥</span>
                        </td>
                        <td style="color: #4a3a6b; font-size: 15px; line-height: 1.6;">
                          <strong>Find Veterinary Resources</strong><br/>
                          Locate trusted vets and pet services nearby
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">💬</span>
                        </td>
                        <td style="color: #4a3a6b; font-size: 15px; line-height: 1.6;">
                          <strong>Connect with Pet Parents</strong><br/>
                          Chat and share experiences with the community
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/profile" style="background: linear-gradient(135deg, #8b77c3 0%, #a78bfa 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(139, 119, 195, 0.3);">
                      Complete Your Profile →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; margin-top: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Need Help?</strong><br/>
                      Reply to this email or visit our <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/faq" style="color: #8b77c3; text-decoration: none; font-weight: bold;">FAQ section</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>Pawppy</strong> - Connecting Pet Parents Worldwide
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Pawppy. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}" style="color: #8b77c3; text-decoration: none; font-size: 12px; margin: 0 10px;">Visit Website</a>
                <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/privacy-policy" style="color: #8b77c3; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
  
  return await sendEmail(emailParams, EMAIL_TEMPLATES.WELCOME);
};

/**
 * Mating Request Notification (Email + Push)
 */
export const sendMatingRequestNotification = async (receiverData, senderData, requestData) => {
  const notificationType = 'matingRequests';
  
  // Check preferences
  const sendEmailPref = await shouldSendNotification(receiverData.uid, notificationType, 'email');
  const sendPushPref = await shouldSendNotification(receiverData.uid, notificationType, 'push');
  
  const results = {};
  
  // Send Email
  if (sendEmailPref) {
    const emailParams = {
      name: receiverData.displayName || 'Pet Parent',
      to_email: receiverData.email,
      message: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fef2f2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Hearts -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">💕 New Mating Request</h1>
              <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Someone's interested in ${requestData.receiverPetName}!</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi <strong>${receiverData.displayName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.8;">
                <strong>${senderData.displayName}</strong> is interested in a mating match between their pet <strong>${requestData.senderPetName}</strong> and your adorable <strong>${requestData.receiverPetName}</strong>! 🐾
              </p>
              
              <!-- Pet Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border-radius: 12px; margin-bottom: 25px; border: 2px solid #f9a8d4;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #be185d; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">🐕 ${requestData.senderPetName}</h2>
                    
                    <table width="100%" cellpadding="6" cellspacing="0">
                      <tr>
                        <td style="color: #831843; font-size: 15px; width: 100px;"><strong>Breed:</strong></td>
                        <td style="color: #4a1930; font-size: 15px;">${requestData.senderPetBreed}</td>
                      </tr>
                      <tr>
                        <td style="color: #831843; font-size: 15px;"><strong>Gender:</strong></td>
                        <td style="color: #4a1930; font-size: 15px;">${requestData.senderPetGender}</td>
                      </tr>
                      <tr>
                        <td style="color: #831843; font-size: 15px;"><strong>Age:</strong></td>
                        <td style="color: #4a1930; font-size: 15px;">${requestData.senderPetAge}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${requestData.message ? `
              <!-- Personal Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-left: 4px solid #ec4899; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;"><strong>Message from ${senderData.displayName}:</strong></p>
                    <p style="margin: 0; color: #374151; font-size: 15px; font-style: italic; line-height: 1.6;">"${requestData.message}"</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/profile?tab=requests" style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                      View & Respond to Request →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Safety Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Safety First:</strong><br/>
                      Always meet in a public place, verify vaccination records, and ensure both pets are comfortable before proceeding.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>Pawppy</strong> - Connecting Pet Parents Worldwide
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Pawppy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
    
    results.email = await sendEmail(emailParams);
  }
  
  // Send Push Notification
  if (sendPushPref) {
    results.push = await sendPushNotification(
      receiverData.uid,
      `💕 New Mating Request`,
      `${senderData.displayName} wants to connect ${requestData.senderPetName} with ${requestData.receiverPetName}`,
      { type: 'mating_request', requestId: requestData.id }
    );
  }
  
  return results;
};

/**
 * Mating Request Accepted Notification
 */
export const sendMatingRequestAcceptedNotification = async (senderData, receiverData, requestData) => {
  const notificationType = 'matingRequests';
  
  const sendEmailPref = await shouldSendNotification(senderData.uid, notificationType, 'email');
  const sendPushPref = await shouldSendNotification(senderData.uid, notificationType, 'push');
  
  const results = {};
  
  if (sendEmailPref) {
    const emailParams = {
      name: senderData.displayName || 'Pet Parent',
      to_email: senderData.email,
      message: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ecfdf5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Success -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Request Accepted!</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Time to connect and plan ahead</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi <strong>${senderData.displayName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.8;">
                Great news! 🎊 <strong>${receiverData.displayName}</strong> has accepted your mating request for <strong>${requestData.senderPetName}</strong> and <strong>${requestData.receiverPetName}</strong>!
              </p>
              
              <!-- Success Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin-bottom: 30px; border: 2px solid #6ee7b7;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🐾 ❤️ 🐾</div>
                    <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">
                      It's a Match!
                    </p>
                    <p style="margin: 10px 0 0 0; color: #047857; font-size: 14px;">
                      ${requestData.senderPetName} & ${requestData.receiverPetName}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">📋 Next Steps</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="vertical-align: top; width: 30px;">
                          <span style="font-size: 20px;">💬</span>
                        </td>
                        <td style="color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>Start Messaging</strong><br/>
                          Exchange contact information and get to know each other
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">📍</span>
                        </td>
                        <td style="color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>Plan the Meet-Up</strong><br/>
                          Discuss convenient location and timing
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">💉</span>
                        </td>
                        <td style="color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>Verify Health Records</strong><br/>
                          Share and confirm vaccination certificates
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align: top;">
                          <span style="font-size: 20px;">🤝</span>
                        </td>
                        <td style="color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>Introduction Meeting</strong><br/>
                          Let the pets meet in a neutral, safe environment
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/profile?tab=messages" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Start Messaging Now →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>💡 Pro Tip:</strong><br/>
                      Take your time to discuss expectations, health history, and ensure both pets are comfortable. A successful match starts with good communication!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>Pawppy</strong> - Connecting Pet Parents Worldwide
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Pawppy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
    
    results.email = await sendEmail(emailParams);
  }
  
  if (sendPushPref) {
    results.push = await sendPushNotification(
      senderData.uid,
      `🎉 Request Accepted!`,
      `${receiverData.displayName} accepted your request for ${requestData.senderPetName} and ${requestData.receiverPetName}`,
      { type: 'mating_request_accepted', requestId: requestData.id }
    );
  }
  
  return results;
};

/**
 * Vaccination Reminder Notification
 */
export const sendVaccinationReminder = async (ownerData, petData, vaccineData) => {
  const notificationType = 'vaccinations';
  
  const sendEmailPref = await shouldSendNotification(ownerData.uid, notificationType, 'email');
  const sendPushPref = await shouldSendNotification(ownerData.uid, notificationType, 'push');
  
  const daysUntilDue = Math.ceil((new Date(vaccineData.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  
  const results = {};
  
  if (sendEmailPref) {
    const emailParams = {
      name: ownerData.displayName || 'Pet Parent',
      to_email: ownerData.email,
      message: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${isOverdue ? '#ef4444' : '#f59e0b'} 0%, ${isOverdue ? '#f87171' : '#fbbf24'} 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">${isOverdue ? '🚨 Vaccination Overdue' : '⚕️ Vaccination Reminder'}</h1>
              <p style="color: ${isOverdue ? '#fee2e2' : '#fef3c7'}; margin: 10px 0 0 0; font-size: 16px;">${petData.name} needs your attention</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi <strong>${ownerData.displayName}</strong>,
              </p>
              
              ${isOverdue ? `
              <!-- Urgent Alert -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🚨</div>
                    <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold; line-height: 1.6;">
                      <strong>${petData.name}'s ${vaccineData.name} vaccination is OVERDUE!</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; color: #b91c1c; font-size: 14px;">
                      Please schedule an appointment with your vet immediately.
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <!-- Reminder Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚕️</div>
                    <p style="margin: 0; color: #78350f; font-size: 17px; font-weight: bold; line-height: 1.6;">
                      ${petData.name}'s ${vaccineData.name} vaccination is due in <span style="color: #f59e0b; font-size: 24px;">${daysUntilDue}</span> day${daysUntilDue !== 1 ? 's' : ''}
                    </p>
                    <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                      Schedule your appointment soon to stay on track!
                    </p>
                  </td>
                </tr>
              </table>
              `}
              
              <!-- Vaccination Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">💉 Vaccination Details</h2>
                    
                    <table width="100%" cellpadding="10" cellspacing="0">
                      <tr>
                        <td style="color: #1f2937; font-size: 15px; width: 140px; border-bottom: 1px solid #d1d5db;"><strong>Pet Name:</strong></td>
                        <td style="color: #4b5563; font-size: 15px; border-bottom: 1px solid #d1d5db;">${petData.name}</td>
                      </tr>
                      <tr>
                        <td style="color: #1f2937; font-size: 15px; border-bottom: 1px solid #d1d5db;"><strong>Vaccine:</strong></td>
                        <td style="color: #4b5563; font-size: 15px; border-bottom: 1px solid #d1d5db;">${vaccineData.name}</td>
                      </tr>
                      <tr>
                        <td style="color: #1f2937; font-size: 15px; border-bottom: 1px solid #d1d5db;"><strong>Due Date:</strong></td>
                        <td style="color: ${isOverdue ? '#dc2626' : '#4b5563'}; font-size: 15px; font-weight: ${isOverdue ? 'bold' : 'normal'}; border-bottom: 1px solid #d1d5db;">${new Date(vaccineData.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      ${isOverdue ? `
                      <tr>
                        <td style="color: #1f2937; font-size: 15px;"><strong>Days Overdue:</strong></td>
                        <td style="color: #dc2626; font-size: 15px; font-weight: bold;">${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.REACT_APP_URL || 'https://pawppy.in'}/resource" style="background: linear-gradient(135deg, ${isOverdue ? '#ef4444' : '#f59e0b'} 0%, ${isOverdue ? '#f87171' : '#fbbf24'} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                      Find Nearby Vets →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Why It Matters -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: bold;">
                      🛡️ Why Vaccinations Matter
                    </p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      Regular vaccinations protect ${petData.name} from serious diseases and keep your entire community safe. Staying on schedule ensures your pet can socialize, travel, and stay healthy for years to come.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>Pawppy</strong> - Caring for Pets, One Reminder at a Time
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Pawppy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
    
    results.email = await sendEmail(emailParams);
  }
  
  if (sendPushPref) {
    results.push = await sendPushNotification(
      ownerData.uid,
      isOverdue ? `🚨 Vaccination Overdue` : `⚕️ Vaccination Reminder`,
      `${petData.name}'s ${vaccineData.name} vaccination is ${isOverdue ? 'overdue' : `due in ${daysUntilDue} days`}`,
      { type: 'vaccination_reminder', petId: petData.id, vaccineId: vaccineData.id }
    );
  }
  
  return results;
};

/**
 * New Message Notification
 */
export const sendNewMessageNotification = async (recipientData, senderData, messagePreview) => {
  const notificationType = 'messages';
  
  const sendPushPref = await shouldSendNotification(recipientData.uid, notificationType, 'push');
  
  if (sendPushPref) {
    return await sendPushNotification(
      recipientData.uid,
      `💬 New message from ${senderData.displayName}`,
      messagePreview.substring(0, 100),
      { type: 'new_message', senderId: senderData.uid }
    );
  }
  
  return { success: false, reason: 'User preferences disabled' };
};

/**
 * Request FCM Permission and Get Token
 */
export const requestNotificationPermission = async (userId) => {
  try {
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      
      // Save token to database
      const db = getDatabase();
      const tokenRef = ref(db, `users/${userId}/fcmToken`);
      await set(tokenRef, token);
      
      console.log('FCM Token saved:', token);
      return { success: true, token };
    } else {
      console.log('Notification permission denied');
      return { success: false, error: 'Permission denied' };
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return { success: false, error };
  }
};
