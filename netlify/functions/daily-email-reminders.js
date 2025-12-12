// Netlify Scheduled Function - Daily Email Reminders
// Runs daily at 9 AM IST (3:30 AM UTC)
// Checks for: Vaccination reminders, Pet birthdays, Health checkups

const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin (only once)
let firebaseApp;
function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      credential: credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    });
  }
  return firebaseApp;
}

const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY || '9Ic6G_vwTk3Wl8Szu';
const EMAILJS_PRIVATE_KEY = process.env.VITE_EMAILJS_PRIVATE_KEY || 'MTqRqduyn4mLy-FxYwJmw';

const EMAIL_STYLES = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;',
  header: 'background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center;',
  content: 'background: white; padding: 30px; border-radius: 10px; margin: 20px;',
  button: 'display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;',
  footer: 'text-align: center; padding: 20px; color: #6b7280; font-size: 12px;',
  highlight: 'background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed;',
  petInfo: 'background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;',
};

async function sendEmail(to_email, to_name, subject, htmlMessage) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email,
        to_name,
        from_name: 'Pawppy',
        subject,
        message: htmlMessage,
      },
    };

    // Add private key if available (for server-side)
    if (EMAILJS_PRIVATE_KEY) {
      payload.accessToken = EMAILJS_PRIVATE_KEY;
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ Email sent to ${to_email}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Email failed: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
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

  return await sendEmail(
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

  return await sendEmail(
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

  return await sendEmail(
    userData.email,
    userData.displayName,
    `🏥 Time for ${petData.name}'s health checkup`,
    htmlMessage
  );
}

// Main handler for Netlify Scheduled Function
exports.handler = async (event, context) => {
  console.log('🚀 Starting daily email reminder checks...');
  
  try {
    // Initialize Firebase
    getFirebaseApp();
    const db = getDatabase();
    
    // Get all users
    const usersSnapshot = await db.ref('users').once('value');
    if (!usersSnapshot.exists()) {
      console.log('No users found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No users found', emailsSent: 0 }),
      };
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
        // 1. Check Vaccination Reminders (7 days before)
        if (petData.vaccinations) {
          for (const [vaccinationId, vaccination] of Object.entries(petData.vaccinations)) {
            if (!vaccination.nextDue) continue;

            const dueDate = new Date(vaccination.nextDue);
            const dueDateStr = dueDate.toISOString().split('T')[0];
            const targetDateStr = sevenDaysFromNow.toISOString().split('T')[0];
            
            if (dueDateStr === targetDateStr) {
              console.log(`📧 Vaccination reminder: ${userData.email} for ${petData.name}`);
              await sendVaccinationEmail(userData, petData, vaccination);
              emailsSent++;
            }
          }
        }

        // 2. Check Pet Birthday Reminders (3 days before)
        if (petData.dateOfBirth) {
          const birthDate = new Date(petData.dateOfBirth);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const threeDaysBeforeBirthday = new Date(thisYearBirthday);
          threeDaysBeforeBirthday.setDate(threeDaysBeforeBirthday.getDate() - 3);
          
          const todayStr = today.toISOString().split('T')[0];
          const reminderDateStr = threeDaysBeforeBirthday.toISOString().split('T')[0];
          
          if (todayStr === reminderDateStr) {
            console.log(`🎂 Birthday reminder: ${userData.email} for ${petData.name}`);
            await sendBirthdayEmail(userData, petData);
            emailsSent++;
          }
        }

        // 3. Check Health Checkup Reminders (6 months overdue)
        const lastCheckup = petData.lastCheckup ? new Date(petData.lastCheckup) : null;
        
        if (!lastCheckup || lastCheckup < sixMonthsAgo) {
          const notificationKey = `healthCheckup_${petId}_${today.toISOString().split('T')[0]}`;
          const notificationSnapshot = await db.ref(`notificationsSent/${userId}/${notificationKey}`).once('value');
          
          if (!notificationSnapshot.exists()) {
            console.log(`🏥 Health checkup reminder: ${userData.email} for ${petData.name}`);
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

    console.log(`✅ Completed. Sent ${emailsSent} emails.`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        emailsSent,
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error) {
    console.error('❌ Error in daily email reminders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
