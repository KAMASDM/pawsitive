/**
 * Test script for email notification functions
 * Run this to test the email sending functionality before deploying
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to add this

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pawsitive-bb84e-default-rtdb.firebaseio.com'
});

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
    
    console.log(`\n📧 Sending email to: ${to_email}`);
    console.log(`📝 Subject: ${subject}`);
    
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
      console.log('✅ Email sent successfully!');
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send email: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

async function testVaccinationEmail() {
  console.log('\n🧪 Testing Vaccination Reminder Email...');
  
  const testUserData = {
    displayName: 'Test User',
    email: 'jigar@pawppy.in' // Replace with your test email
  };
  
  const testPetData = {
    name: 'Buddy',
    breed: 'Golden Retriever'
  };
  
  const testVaccination = {
    name: 'Rabies Vaccine',
    nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  };

  const dueDate = new Date(testVaccination.nextDue).toLocaleDateString('en-US', {
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
        <h2 style="color: #7c3aed;">Hi ${testUserData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          This is a friendly reminder that <strong>${testPetData.name}</strong> has an upcoming vaccination due soon!
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top: 0; color: #f59e0b;">🐕 Pet Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${testPetData.name}</p>
          <p style="margin: 5px 0;"><strong>Breed:</strong> ${testPetData.breed}</p>
        </div>
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top: 0; color: #dc2626;">⚠️ Vaccination Details</h3>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Vaccine:</strong> ${testVaccination.name}</p>
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
    testUserData.email,
    testUserData.displayName,
    `💉 TEST: Vaccination Reminder - ${testVaccination.name} due for ${testPetData.name}`,
    htmlMessage
  );
}

async function testBirthdayEmail() {
  console.log('\n🧪 Testing Birthday Reminder Email...');
  
  const testUserData = {
    displayName: 'Test User',
    email: 'jigar@pawppy.in' // Replace with your test email
  };
  
  const testPetData = {
    name: 'Max',
    dateOfBirth: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  };

  const birthdayDate = new Date(testPetData.dateOfBirth).toLocaleDateString('en-US', {
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
        <h2 style="color: #7c3aed;">Hi ${testUserData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Get ready to celebrate! <strong>${testPetData.name}</strong>'s birthday is on <strong>${birthdayDate}</strong>! 🎉
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
    testUserData.email,
    testUserData.displayName,
    `🎂 TEST: ${testPetData.name}'s Birthday is Coming Up!`,
    htmlMessage
  );
}

async function testHealthCheckupEmail() {
  console.log('\n🧪 Testing Health Checkup Reminder Email...');
  
  const testUserData = {
    displayName: 'Test User',
    email: 'jigar@pawppy.in' // Replace with your test email
  };
  
  const testPetData = {
    name: 'Luna'
  };

  const htmlMessage = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="margin: 0; font-size: 28px;">🏥 Health Checkup Due</h1>
      </div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color: #7c3aed;">Hi ${testUserData.displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          It's time for <strong>${testPetData.name}</strong>'s health checkup!
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
    testUserData.email,
    testUserData.displayName,
    `🏥 TEST: Time for ${testPetData.name}'s health checkup`,
    htmlMessage
  );
}

async function testSchedulerLogic() {
  console.log('\n🧪 Testing Scheduler Logic (Reading from Firebase)...');
  
  try {
    const db = admin.database();
    const usersSnapshot = await db.ref('users').once('value');
    
    if (!usersSnapshot.exists()) {
      console.log('⚠️  No users found in database');
      return;
    }

    const users = usersSnapshot.val();
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    console.log(`\n📅 Checking for vaccinations due on: ${sevenDaysFromNow.toLocaleDateString()}`);
    
    let foundReminders = 0;
    
    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.email || !userData.pets) continue;

      for (const [petId, petData] of Object.entries(userData.pets)) {
        if (!petData.vaccinations) continue;

        for (const [vaccinationId, vaccination] of Object.entries(petData.vaccinations)) {
          if (!vaccination.nextDue) continue;

          const dueDate = new Date(vaccination.nextDue);
          const dueDateStr = dueDate.toISOString().split('T')[0];
          const targetDateStr = sevenDaysFromNow.toISOString().split('T')[0];
          
          if (dueDateStr === targetDateStr) {
            console.log(`\n✅ Found reminder:`);
            console.log(`   User: ${userData.displayName || userData.email}`);
            console.log(`   Pet: ${petData.name}`);
            console.log(`   Vaccine: ${vaccination.name}`);
            console.log(`   Due: ${dueDate.toLocaleDateString()}`);
            foundReminders++;
          }
        }
      }
    }
    
    if (foundReminders === 0) {
      console.log('\n⚠️  No vaccination reminders found for 7 days from now');
      console.log('💡 Tip: Add a test vaccination in your database with nextDue set to 7 days from today');
    } else {
      console.log(`\n📊 Total reminders that would be sent: ${foundReminders}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing scheduler logic:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Email Notification Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Vaccination Email
    const result1 = await testVaccinationEmail();
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Birthday Email
    const result2 = await testBirthdayEmail();
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Health Checkup Email
    const result3 = await testHealthCheckupEmail();
    
    // Test 4: Scheduler Logic
    await testSchedulerLogic();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`   Vaccination Email: ${result1.success ? '✅ Passed' : '❌ Failed'}`);
    console.log(`   Birthday Email: ${result2.success ? '✅ Passed' : '❌ Failed'}`);
    console.log(`   Health Checkup Email: ${result3.success ? '✅ Passed' : '❌ Failed'}`);
    console.log('\n💡 Check your email inbox to verify the emails were received!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
    console.log('\n✅ Tests completed\n');
  }
}

// Run tests
runAllTests().catch(console.error);
