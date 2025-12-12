/**
 * Manual test trigger for daily email reminders
 * This simulates what Netlify's scheduled function will do
 * 
 * Usage: node netlify/functions/test-daily-reminders.js
 */

// Import the handler from the actual function
const { handler } = require('./daily-email-reminders.js');

async function runTest() {
  console.log('\n🧪 Testing Daily Email Reminder Function');
  console.log('=' .repeat(60));
  console.log('⚠️  This will check your Firebase database for reminders');
  console.log('📧 Emails will be sent to real users if reminders are due!\n');
  
  // Simulate Netlify event and context
  const mockEvent = {
    httpMethod: 'POST',
    headers: {},
    body: null,
  };
  
  const mockContext = {
    functionName: 'daily-email-reminders',
    functionVersion: '1',
  };

  try {
    const result = await handler(mockEvent, mockContext);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Function Result:');
    console.log('   Status Code:', result.statusCode);
    console.log('   Response:', JSON.parse(result.body));
    console.log('='.repeat(60));
    
    if (result.statusCode === 200) {
      console.log('\n✅ Test completed successfully!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed. Check the errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error('\n💡 Make sure you have set the required environment variables:');
    console.error('   - VITE_FIREBASE_PROJECT_ID');
    console.error('   - VITE_FIREBASE_DATABASE_URL');
    console.error('   - FIREBASE_CLIENT_EMAIL');
    console.error('   - FIREBASE_PRIVATE_KEY');
    console.error('   - EMAILJS_PRIVATE_KEY (optional, for server-side emails)\n');
    process.exit(1);
  }
}

runTest().catch(console.error);
