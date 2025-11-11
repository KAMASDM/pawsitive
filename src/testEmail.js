import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_PUBLIC_KEY = '9Ic6G_vwTk3Wl8Szu';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Test function to send email
 */
const sendTestEmail = async () => {
  try {
    console.log('Sending test email...');
    
    const templateParams = {
      to_email: 'anantsoftcomputing@gmail.com',
      to_name: 'Test User',
      subject: '🐾 Pawppy Notification Test',
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8b77c3; text-align: center;">Pawppy Notification System Test 🐾</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hi there,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            This is a test email from the Pawppy notification system! If you're receiving this, 
            it means the email integration is working perfectly.
          </p>
          
          <div style="background: #f3f0f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #8b77c3; margin-top: 0;">✅ System Status:</h3>
            <ul style="line-height: 2;">
              <li>📧 EmailJS Integration: <strong style="color: #10b981;">Active</strong></li>
              <li>🎯 Service ID: service_zdt4u0q</li>
              <li>📝 Template ID: template_pe8gs6o</li>
              <li>⏰ Test Time: ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background: linear-gradient(135deg, #8b77c3, #a78bfa); 
                      padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h3 style="color: white; margin: 0;">🎉 Email Notifications Ready!</h3>
            <p style="color: white; margin: 10px 0 0 0;">
              Your Pawppy app can now send notifications for mating requests, 
              vaccination reminders, and more.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 40px;">
            This is an automated test message from Pawppy<br/>
            <a href="https://pawppy.in" style="color: #8b77c3; text-decoration: none;">pawppy.in</a>
          </p>
        </div>
      `,
    };
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Response:', response);
    console.log('Status:', response.status);
    console.log('Text:', response.text);
    
    return { success: true, response };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    console.error('Error details:', error.text || error.message);
    return { success: false, error };
  }
};

// Run the test
console.log('🚀 Starting email test...');
sendTestEmail()
  .then(result => {
    if (result.success) {
      console.log('✅ TEST PASSED - Email sent to anantsoftcomputing@gmail.com');
    } else {
      console.log('❌ TEST FAILED - Check error details above');
    }
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
  });
