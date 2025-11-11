// Test Welcome Email Script
// Run with: node src/testWelcomeEmail.js

const emailjs = require('@emailjs/browser');

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_PUBLIC_KEY = '9Ic6G_vwTk3Wl8Szu';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

const sendTestEmail = async () => {
  const userData = {
    displayName: 'Jigar Desai',
    email: 'jigarrdesai@gmail.com', // Your email
  };

  const emailParams = {
    name: userData.displayName,
    to_email: userData.email,
    subject: `Welcome to Pawppy, ${userData.displayName}!`,
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
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b77c3 0%, #a78bfa 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🐾 Welcome to Pawppy!</h1>
              <p style="color: #f3f0f9; margin: 10px 0 0 0; font-size: 16px;">Your Pet's New Best Friend</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0;">
                Hi <strong>${userData.displayName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.8;">
                We're thrilled to have you join our community of pet lovers! 🎉
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://pawppy.in/profile" style="background: linear-gradient(135deg, #8b77c3 0%, #a78bfa 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; display: inline-block;">
                      Complete Your Profile →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Pawppy</strong> - Connecting Pet Parents Worldwide
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Pawppy. All rights reserved.
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

  console.log('Sending test email to:', userData.email);
  console.log('Using template:', EMAILJS_TEMPLATE_ID);
  console.log('\nEmail parameters:', {
    name: emailParams.name,
    to_email: emailParams.to_email,
    subject: emailParams.subject,
    messageLength: emailParams.message.length
  });

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams
    );
    console.log('\n✅ Email sent successfully!');
    console.log('Response:', response);
    console.log('\nCheck your inbox:', userData.email);
    console.log('\n⚠️  IMPORTANT: Update your EmailJS template to use {{{message}}} (triple braces)');
    console.log('Go to: https://dashboard.emailjs.com/admin/templates/template_pe8gs6o/edit');
  } catch (error) {
    console.error('\n❌ Email send failed!');
    console.error('Error:', error);
  }
};

sendTestEmail();
