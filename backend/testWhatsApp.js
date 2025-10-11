// scripts/testWhatsApp.js
// Test script to verify Twilio WhatsApp integration

require('dotenv').config();
const { 
  sendWhatsAppMessage, 
  isTwilioConfigured 
} = require('./notifications');

const TEST_PHONE = process.env.TEST_PHONE_NUMBER || '+917977653161'; // Replace with your phone

async function testWhatsAppIntegration() {
  console.log('🧪 Testing Twilio WhatsApp Integration\n');
  
  // Check if Twilio is configured
  console.log('1️⃣ Checking Twilio Configuration...');
  if (!isTwilioConfigured()) {
    console.error('❌ Twilio is not configured!');
    console.log('\nPlease ensure the following environment variables are set:');
    console.log('  - TWILIO_ACCOUNT_SID');
    console.log('  - TWILIO_AUTH_TOKEN');
    console.log('  - TWILIO_WHATSAPP_NUMBER (optional, defaults to sandbox)');
    process.exit(1);
  }
  console.log('✅ Twilio is configured\n');

  // Test 1: Send a simple message
  console.log('2️⃣ Sending test message...');
  console.log(`   To: ${TEST_PHONE}`);
  
  const testMessage = `
🧪 TEST MESSAGE

This is a test message from your SOS Alert System.

If you received this, WhatsApp integration is working correctly!

Time: ${new Date().toLocaleString()}
`.trim();

  try {
    const result = await sendWhatsAppMessage(TEST_PHONE, testMessage);
    
    if (result.success) {
      console.log('✅ Message sent successfully!');
      console.log(`   Message SID: ${result.messageSid}`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.error('❌ Failed to send message');
      console.error(`   Error: ${result.error}`);
      if (result.code) {
        console.error(`   Twilio Error Code: ${result.code}`);
        
        // Provide helpful error messages
        switch(result.code) {
          case 21211:
            console.log('\n💡 This phone number is not valid or not in E.164 format');
            console.log('   Format: +[country code][number] (e.g., +919876543210)');
            break;
          case 21614:
            console.log('\n💡 This phone number is not opted into WhatsApp');
            console.log('   Send "join <sandbox-code>" to +14155238886 first');
            break;
          case 21408:
            console.log('\n💡 Permission to send to this number is denied');
            console.log('   Make sure you joined the Twilio sandbox first');
            break;
          default:
            console.log(`\n💡 Check Twilio error code ${result.code} at:`);
            console.log('   https://www.twilio.com/docs/api/errors');
        }
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }

  console.log('\n3️⃣ Test Complete\n');
  
  // Instructions
  console.log('📝 Next Steps:');
  console.log('   1. Check if you received the WhatsApp message');
  console.log('   2. If not, verify you joined the Twilio sandbox');
  console.log('   3. Send "join <your-code>" to +14155238886 on WhatsApp');
  console.log('   4. Update TEST_PHONE_NUMBER in .env to your number');
  console.log('\n📚 Documentation:');
  console.log('   https://www.twilio.com/docs/whatsapp/sandbox');
}

// Run the test
console.log('═'.repeat(60));
console.log('  TWILIO WHATSAPP INTEGRATION TEST');
console.log('═'.repeat(60) + '\n');

testWhatsAppIntegration()
  .then(() => {
    console.log('═'.repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });