/**
 * Simple Email Test - No Firebase needed
 * Tests EmailJS integration directly
 */

const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_PUBLIC_KEY = '9Ic6G_vwTk3Wl8Szu';
// Note: For production, you need to get a private key from EmailJS dashboard
// Go to: https://dashboard.emailjs.com/admin/account
// For now, we'll use the public key with accessToken method
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

async function sendTestEmail(testEmail) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const htmlMessage = `
      <div style="${EMAIL_STYLES.container}">
        <div style="${EMAIL_STYLES.header}">
          <h1 style="margin: 0; font-size: 28px;">💉 Vaccination Reminder (TEST)</h1>
        </div>
        <div style="${EMAIL_STYLES.content}">
          <h2 style="color: #7c3aed;">Hi Test User! 👋</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            This is a <strong>TEST EMAIL</strong> to verify the email notification system is working correctly!
          </p>
          <div style="${EMAIL_STYLES.petInfo}">
            <h3 style="margin-top: 0; color: #f59e0b;">🐕 Pet Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> Buddy (Test Pet)</p>
            <p style="margin: 5px 0;"><strong>Breed:</strong> Golden Retriever</p>
          </div>
          <div style="${EMAIL_STYLES.highlight}">
            <h3 style="margin-top: 0; color: #dc2626;">⚠️ Vaccination Details</h3>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Vaccine:</strong> Rabies Vaccine (Test)</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Due Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </div>
          <div style="text-align: center;">
            <a href="https://pawppy.in/profile?tab=pets" style="${EMAIL_STYLES.button}">View Pet Profile →</a>
          </div>
          <p style="font-size: 12px; color: #dc2626; margin-top: 20px; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
            ⚠️ <strong>This is a test email.</strong> If you received this, the email notification system is working correctly!
          </p>
        </div>
        <div style="${EMAIL_STYLES.footer}">
          <p>Pawppy - Never miss important pet care dates</p>
          <p>© 2025 Pawppy. All rights reserved.</p>
        </div>
      </div>
    `;
    
    console.log(`\n📧 Sending test email to: ${testEmail}`);
    console.log('⚠️  Note: Using EmailJS public key - this may fail from server-side');
    console.log('💡 For production, get a private key from EmailJS dashboard\n');
    
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PUBLIC_KEY, // Try with accessToken for server-side
        template_params: {
          to_email: testEmail,
          to_name: 'Test User',
          from_name: 'Pawppy',
          subject: '💉 TEST: Vaccination Reminder - Email System Test',
          message: htmlMessage,
        },
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('\n📬 Please check your inbox (and spam folder) for the test email.');
      console.log('✨ If you received it, the email notification system is working!\n');
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send email: ${error}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
}

// Get email from command line argument
const testEmail = process.argv[2];

if (!testEmail) {
  console.log('\n❌ Please provide a test email address:');
  console.log('   node testEmailSimple.js your-email@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(testEmail)) {
  console.log('\n❌ Invalid email format. Please provide a valid email address.\n');
  process.exit(1);
}

console.log('\n🚀 Testing Email Notification System');
console.log('=' .repeat(60));

sendTestEmail(testEmail)
  .then(success => {
    if (success) {
      console.log('=' .repeat(60));
      console.log('✅ Test completed successfully!\n');
      process.exit(0);
    } else {
      console.log('=' .repeat(60));
      console.log('❌ Test failed. Please check the error messages above.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error.message, '\n');
    process.exit(1);
  });
