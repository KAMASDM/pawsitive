import emailjs from '@emailjs/browser';
import { getDatabase, ref, set, push, get } from 'firebase/database';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '9Ic6G_vwTk3Wl8Szu';

// Email Template ID - Using single template with dynamic content
const EMAIL_TEMPLATE_ID = 'template_pe8gs6o';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Base Email Styling - Consistent across all emails
 */
const EMAIL_STYLES = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;',
  header: 'background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center;',
  content: 'background: white; padding: 30px; border-radius: 10px; margin: 20px;',
  button: 'display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;',
  footer: 'text-align: center; padding: 20px; color: #6b7280; font-size: 12px;',
  highlight: 'background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed;',
  petInfo: 'background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;',
};

/**
 * Send Email Helper
 */
const sendEmail = async (to_email, name, subject, htmlMessage) => {
  try {
    const emailParams = {
      to_email,
      to_name: name,           // Recipient's name (used in email greeting)
      from_name: 'Pawppy',     // Sender name (displays as "from Pawppy")
      subject,
      message: htmlMessage,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      emailParams
    );
    
    console.log(`Email sent to ${to_email}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
};

/**
 * Log notification to database
 */
const logNotification = async (userId, notificationData) => {
  try {
    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${userId}`);
    const newNotificationRef = push(notificationsRef);
    
    await set(newNotificationRef, {
      ...notificationData,
      timestamp: Date.now(),
      read: false,
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

// ============================================================================
// 1. WELCOME EMAIL - When user signs up
// ============================================================================
export const sendWelcomeEmail = async (userData) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🐾 Welcome to Pawppy!</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${userData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          We're thrilled to have you join the Pawppy family! Your pet's journey to a happier, healthier life starts here.
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">🎉 What You Can Do Now:</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li><strong>Add Your Pets</strong> - Create detailed profiles for all your furry friends</li>
            <li><strong>Track Health Records</strong> - Never miss a vaccination or checkup</li>
            <li><strong>Find Mates</strong> - Connect with other pet parents for breeding</li>
            <li><strong>Discover Places</strong> - Explore pet-friendly locations nearby</li>
            <li><strong>Get Resources</strong> - Access expert tips and pet care guides</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/home" style="${EMAIL_STYLES.button}">
            Get Started →
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Need help? Reply to this email or visit our <a href="${import.meta.env.VITE_BASE_URL}/faq" style="color: #7c3aed;">FAQ page</a>.
        </p>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Your Pet's Complete Care Platform</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(userData.uid, {
    type: 'welcome',
    title: 'Welcome to Pawppy!',
    message: 'Your account has been created successfully',
  });

  return await sendEmail(
    userData.email,
    userData.displayName,
    '🐾 Welcome to Pawppy - Let\'s Get Started!',
    htmlMessage
  );
};

// ============================================================================
// 2. VACCINATION REMINDER - 7 days before due date
// ============================================================================
export const sendVaccinationReminder = async (ownerData, petData, vaccination) => {
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
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          This is a friendly reminder that <strong>${petData.name}</strong> has an upcoming vaccination due soon!
        </p>
        
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🐕 Pet Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${petData.name}</p>
          <p style="margin: 5px 0;"><strong>Breed:</strong> ${petData.breed || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Age:</strong> ${petData.age || 'Not specified'}</p>
        </div>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #dc2626;">⚠️ Vaccination Details</h3>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Vaccine:</strong> ${vaccination.name}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Due Date:</strong> ${dueDate}</p>
          ${vaccination.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${vaccination.notes}</p>` : ''}
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">
          <strong>Why it's important:</strong> Vaccinations protect ${petData.name} from serious diseases and keep them healthy. Don't miss this important date!
        </p>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=pets" style="${EMAIL_STYLES.button}">
            View Pet Profile →
          </a>
        </div>
        
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
          💡 <strong>Tip:</strong> Schedule the appointment now to avoid last-minute rush! Most vets recommend booking 1-2 weeks in advance.
        </p>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Never miss important pet care dates</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'vaccination_reminder',
    title: `Vaccination due for ${petData.name}`,
    message: `${vaccination.name} is due on ${dueDate}`,
    petId: petData.id,
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `💉 Vaccination Reminder: ${vaccination.name} due for ${petData.name}`,
    htmlMessage
  );
};

// ============================================================================
// 3. MATING REQUEST RECEIVED - When someone sends a mating request
// ============================================================================
export const sendMatingRequestNotification = async (receiverData, senderData, requestData) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">💕 New Mating Request</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${receiverData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Great news! <strong>${senderData.displayName}</strong> is interested in mating their pet with yours!
        </p>
        
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🐕 Pet Details</h3>
          <p style="margin: 5px 0;"><strong>Pet Name:</strong> ${requestData.senderPetName || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Breed:</strong> ${requestData.senderPetBreed || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Gender:</strong> ${requestData.senderPetGender || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Age:</strong> ${requestData.senderPetAge || 'Not specified'}</p>
        </div>
        
        ${requestData.message ? `
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">💬 Message from ${senderData.displayName}</h3>
          <p style="font-style: italic; color: #374151;">"${requestData.message}"</p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">
          Review the request and get in touch with ${senderData.displayName} to discuss the details!
        </p>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=requests" style="${EMAIL_STYLES.button}">
            View Request →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Connecting Pet Parents</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(receiverData.uid, {
    type: 'mating_request',
    title: 'New mating request received',
    message: `${senderData.displayName} sent you a mating request`,
    senderId: senderData.uid,
  });

  return await sendEmail(
    receiverData.email,
    receiverData.displayName,
    `💕 New Mating Request from ${senderData.displayName}`,
    htmlMessage
  );
};

// ============================================================================
// 4. MATING REQUEST ACCEPTED - When request is accepted
// ============================================================================
export const sendMatingRequestAcceptedNotification = async (senderData, receiverData, petData) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🎉 Request Accepted!</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Great News, ${senderData.displayName}! 🎊</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          <strong>${receiverData.displayName}</strong> has accepted your mating request!
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #10b981;">✅ What's Next?</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li>Connect with ${receiverData.displayName} to arrange a meeting</li>
            <li>Discuss health records and vaccination status</li>
            <li>Choose a comfortable location for the pets to meet</li>
            <li>Prepare any necessary documentation</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=messages" style="${EMAIL_STYLES.button}">
            Send Message →
          </a>
        </div>
        
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
          💡 <strong>Pro Tip:</strong> Always ensure both pets are healthy, vaccinated, and comfortable before proceeding. Consider consulting with a veterinarian for guidance!
        </p>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Making Pet Connections Easy</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(senderData.uid, {
    type: 'request_accepted',
    title: 'Mating request accepted!',
    message: `${receiverData.displayName} accepted your request`,
    receiverId: receiverData.uid,
  });

  return await sendEmail(
    senderData.email,
    senderData.displayName,
    `🎉 ${receiverData.displayName} accepted your mating request!`,
    htmlMessage
  );
};

// ============================================================================
// 5. NEW MESSAGE NOTIFICATION - When user receives a message
// ============================================================================
export const sendNewMessageNotification = async (receiverData, senderData, messagePreview) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">💬 New Message</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${receiverData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          You have a new message from <strong>${senderData.displayName}</strong>!
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <p style="font-size: 14px; color: #374151; font-style: italic; margin: 0;">
            "${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=messages" style="${EMAIL_STYLES.button}">
            Read & Reply →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Stay Connected</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(receiverData.uid, {
    type: 'new_message',
    title: `New message from ${senderData.displayName}`,
    message: messagePreview.substring(0, 100),
    senderId: senderData.uid,
  });

  return await sendEmail(
    receiverData.email,
    receiverData.displayName,
    `💬 New message from ${senderData.displayName}`,
    htmlMessage
  );
};

// ============================================================================
// 6. NEARBY MATES ALERT - When new compatible pets are found nearby
// ============================================================================
export const sendNearbyMatesAlert = async (ownerData, petData, nearbyPets) => {
  const petsList = nearbyPets.slice(0, 3).map(pet => `
    <div style="padding: 10px; background-color: #f9fafb; border-radius: 8px; margin: 10px 0;">
      <p style="margin: 5px 0;"><strong>${pet.name}</strong> - ${pet.breed}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
        ${pet.age} • ${pet.gender} • ${pet.distance}
      </p>
    </div>
  `).join('');

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🔍 New Matches Found!</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Great news! We found <strong>${nearbyPets.length} compatible pet${nearbyPets.length > 1 ? 's' : ''}</strong> near you for <strong>${petData.name}</strong>!
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">🐕 Top Matches</h3>
          ${petsList}
          ${nearbyPets.length > 3 ? `<p style="text-align: center; color: #6b7280; margin-top: 15px;">+ ${nearbyPets.length - 3} more matches</p>` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/nearby-mates" style="${EMAIL_STYLES.button}">
            View All Matches →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Finding Perfect Matches</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'nearby_mates',
    title: `${nearbyPets.length} new matches found!`,
    message: `Compatible pets found near you for ${petData.name}`,
    petId: petData.id,
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `🔍 ${nearbyPets.length} New Match${nearbyPets.length > 1 ? 'es' : ''} for ${petData.name}!`,
    htmlMessage
  );
};

// ============================================================================
// 7. PET BIRTHDAY REMINDER - 3 days before pet's birthday
// ============================================================================
export const sendPetBirthdayReminder = async (ownerData, petData) => {
  const birthdayDate = new Date(petData.dateOfBirth).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const age = petData.age ? parseInt(petData.age) + 1 : 'another';

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🎂 Birthday Coming Up!</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Get ready to celebrate! <strong>${petData.name}</strong> is turning <strong>${age}</strong> on <strong>${birthdayDate}</strong>! 🎉
        </p>
        
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🎈 Birthday Celebration Ideas</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li>🦴 Special treats or favorite food</li>
            <li>🎾 New toys or playtime at the park</li>
            <li>📸 Photo shoot with birthday decorations</li>
            <li>🐕 Playdate with furry friends</li>
            <li>🏃 Extra long walk or adventure</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
          Make it a day to remember for your furry friend! 🎊
        </p>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Celebrating Every Moment</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'pet_birthday',
    title: `${petData.name}'s birthday is coming up!`,
    message: `Birthday on ${birthdayDate}`,
    petId: petData.id,
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `🎂 ${petData.name}'s Birthday is Coming Up!`,
    htmlMessage
  );
};

// ============================================================================
// 8. PET-FRIENDLY PLACE NEARBY - When new places are added near user
// ============================================================================
export const sendPetFriendlyPlaceAlert = async (ownerData, places) => {
  const placesList = places.slice(0, 3).map(place => `
    <div style="padding: 15px; background-color: ${place.isFriendly ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${place.isFriendly ? '#10b981' : '#ef4444'};">
      <p style="margin: 5px 0; font-size: 16px;"><strong>${place.name}</strong></p>
      <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">${place.address}</p>
      <p style="margin: 5px 0; font-size: 14px;">
        <span style="color: ${place.isFriendly ? '#10b981' : '#ef4444'}; font-weight: bold;">
          ${place.isFriendly ? '✅ Pet Friendly' : '❌ Not Pet Friendly'}
        </span>
      </p>
      ${place.description ? `<p style="margin: 5px 0; font-size: 13px; color: #6b7280; font-style: italic;">${place.description}</p>` : ''}
    </div>
  `).join('');

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">📍 New Places Near You!</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          We've discovered <strong>${places.length} new place${places.length > 1 ? 's' : ''}</strong> near you that you might want to know about!
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">📍 Recently Added</h3>
          ${placesList}
          ${places.length > 3 ? `<p style="text-align: center; color: #6b7280; margin-top: 15px;">+ ${places.length - 3} more places</p>` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/home" style="${EMAIL_STYLES.button}">
            Explore Places →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Discover Pet-Friendly Places</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'nearby_places',
    title: `${places.length} new places discovered`,
    message: 'New pet-friendly places near you',
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `📍 ${places.length} New Place${places.length > 1 ? 's' : ''} Discovered Near You!`,
    htmlMessage
  );
};

// ============================================================================
// 9. HEALTH CHECKUP REMINDER - Annual/6-month checkup reminder
// ============================================================================
export const sendHealthCheckupReminder = async (ownerData, petData, checkupType = 'annual') => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🏥 Health Checkup Due</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          It's time for <strong>${petData.name}</strong>'s ${checkupType} health checkup!
        </p>
        
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #dc2626;">⚕️ Why Regular Checkups Matter</h3>
          <ul style="line-height: 1.8; color: #374151;">
            <li>Early detection of health issues</li>
            <li>Monitor weight and nutrition</li>
            <li>Dental health examination</li>
            <li>Update vaccinations if needed</li>
            <li>Discuss any behavioral changes</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=pets" style="${EMAIL_STYLES.button}">
            Update Health Record →
          </a>
        </div>
        
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          💡 <strong>Reminder:</strong> Regular checkups help catch problems early and keep ${petData.name} healthy for years to come!
        </p>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Your Pet's Health Partner</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'health_checkup',
    title: `${checkupType} checkup due for ${petData.name}`,
    message: 'Time for a vet visit',
    petId: petData.id,
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `🏥 Time for ${petData.name}'s ${checkupType} checkup`,
    htmlMessage
  );
};

// ============================================================================
// 10. ADOPTION INQUIRY - When someone is interested in adopting
// ============================================================================
export const sendAdoptionInquiryNotification = async (ownerData, interestedUserData, petData, message) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🏠 Adoption Inquiry</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Someone is interested in adopting <strong>${petData.name}</strong>!
        </p>
        
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">👤 Interested Adopter</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${interestedUserData.displayName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${interestedUserData.email}</p>
        </div>
        
        ${message ? `
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">💬 Message</h3>
          <p style="font-style: italic; color: #374151;">"${message}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${import.meta.env.VITE_BASE_URL}/profile?tab=messages" style="${EMAIL_STYLES.button}">
            Respond to Inquiry →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Finding Forever Homes</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'adoption_inquiry',
    title: `Adoption inquiry for ${petData.name}`,
    message: `${interestedUserData.displayName} is interested in adopting`,
    petId: petData.id,
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `🏠 Adoption Inquiry for ${petData.name}`,
    htmlMessage
  );
};

// ============================================================================
// 11. WEEKLY DIGEST - Summary of weekly activity
// ============================================================================
export const sendWeeklyDigest = async (ownerData, digestData) => {
  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">📊 Your Weekly Digest</h1>
      </div>
      
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${ownerData.displayName}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Here's what happened this week with your pets on Pawppy!
        </p>
        
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #7c3aed;">📈 This Week's Activity</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 0;">${digestData.newRequests || 0}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Mating Requests</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">${digestData.newMessages || 0}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">New Messages</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">${digestData.profileViews || 0}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Profile Views</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #ec4899; margin: 0;">${digestData.nearbyMatches || 0}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">New Matches</p>
            </div>
          </div>
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
          <a href="${import.meta.env.VITE_BASE_URL}/profile" style="${EMAIL_STYLES.button}">
            View Full Dashboard →
          </a>
        </div>
      </div>
      
      <div style="${EMAIL_STYLES.footer}">
        <p>Pawppy - Your Weekly Update</p>
        <p>© 2025 Pawppy. All rights reserved.</p>
      </div>
    </div>
  `;

  await logNotification(ownerData.uid, {
    type: 'weekly_digest',
    title: 'Your weekly digest is ready',
    message: 'See what happened this week',
  });

  return await sendEmail(
    ownerData.email,
    ownerData.displayName,
    `📊 Your Weekly Pawppy Digest`,
    htmlMessage
  );
};

// ============================================================================
// Export all notification functions
// ============================================================================
export default {
  sendWelcomeEmail,
  sendVaccinationReminder,
  sendMatingRequestNotification,
  sendMatingRequestAcceptedNotification,
  sendNewMessageNotification,
  sendNearbyMatesAlert,
  sendPetBirthdayReminder,
  sendPetFriendlyPlaceAlert,
  sendHealthCheckupReminder,
  sendAdoptionInquiryNotification,
  sendWeeklyDigest,
};
