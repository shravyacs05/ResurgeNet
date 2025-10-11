// services/notifications.js
require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let client = null;

// Initialize Twilio client with error handling
try {
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
  } else {
    console.warn('⚠️ Twilio credentials not found. WhatsApp notifications will be disabled.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error.message);
}

/**
 * Send WhatsApp message to a single recipient
 * @param {string} toNumber - Recipient's phone number in E.164 format (e.g., +919876543210)
 * @param {string} messageBody - Message content
 * @returns {Promise<Object>} - Message SID and status
 */
async function sendWhatsAppMessage(toNumber, messageBody) {
  // Check if Twilio is configured
  if (!client) {
    console.warn('⚠️ Twilio not configured. Message not sent to:', toNumber);
    return {
      success: false,
      error: 'Twilio not configured'
    };
  }

  try {
    // Validate phone number format
    if (!toNumber.startsWith('+')) {
      console.error('❌ Invalid phone number format:', toNumber);
      return {
        success: false,
        error: 'Phone number must be in E.164 format (e.g., +919876543210)'
      };
    }

    console.log(`📱 Sending WhatsApp message to: ${toNumber}`);
    console.log(`📝 Message: ${messageBody.substring(0, 50)}...`);

    const message = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: `whatsapp:${toNumber}`,
      body: messageBody
    });

    console.log(`✅ WhatsApp message sent successfully. SID: ${message.sid}`);
    
    return {
      success: true,
      messageSid: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    
    // Log specific Twilio errors
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Send WhatsApp messages to multiple recipients
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} messageBody - Message content
 * @returns {Promise<Array>} - Array of results
 */
async function sendBulkWhatsAppMessages(phoneNumbers, messageBody) {
  if (!client) {
    console.warn('⚠️ Twilio not configured. Bulk messages not sent.');
    return [];
  }

  console.log(`📱 Sending bulk WhatsApp messages to ${phoneNumbers.length} recipients`);

  const results = await Promise.allSettled(
    phoneNumbers.map(phone => sendWhatsAppMessage(phone, messageBody))
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failCount = results.length - successCount;

  console.log(`✅ Bulk WhatsApp send complete: ${successCount} success, ${failCount} failed`);

  return results.map((result, index) => ({
    phone: phoneNumbers[index],
    ...result
  }));
}

/**
 * Send emergency alert to user and their emergency contacts
 * @param {Object} userProfile - User profile with emergency contacts
 * @param {Object} alertDetails - Alert information
 * @returns {Promise<Object>} - Send results
 */
async function sendEmergencyAlertNotifications(userProfile, alertDetails) {
  if (!client) {
    console.warn('⚠️ Twilio not configured. Emergency notifications not sent.');
    return {
      success: false,
      error: 'Twilio not configured'
    };
  }

  const { emergencyType, location, message, urgencyLevel } = alertDetails;
  
  // Compose message
  const alertMessage = `
🚨 EMERGENCY ALERT 🚨

Type: ${emergencyType.toUpperCase()}
Urgency: ${urgencyLevel.toUpperCase()}
Location: ${location.address}

Message: ${message}

Reported by: ${userProfile.name}
Time: ${new Date().toLocaleString()}

Emergency services have been notified.
`.trim();

  const results = {
    user: null,
    emergencyContacts: []
  };

  // Send to user
  if (userProfile.phone && userProfile.phone.startsWith('+')) {
    results.user = await sendWhatsAppMessage(
      userProfile.phone,
      `Your emergency alert has been sent to authorities.\n\n${alertMessage}`
    );
  }

  // Send to emergency contacts
  if (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0) {
    for (const contact of userProfile.emergencyContacts) {
      if (contact.phone && contact.phone.startsWith('+')) {
        const contactMessage = `
EMERGENCY: ${userProfile.name} needs help!

${contact.name}, you are listed as an emergency contact.

${alertMessage}
`.trim();

        const result = await sendWhatsAppMessage(contact.phone, contactMessage);
        results.emergencyContacts.push({
          contact: contact.name,
          phone: contact.phone,
          result
        });
      }
    }
  }

  return results;
}

/**
 * Check if Twilio is properly configured
 * @returns {boolean}
 */
function isTwilioConfigured() {
  return client !== null;
}

module.exports = {
  sendWhatsAppMessage,
  sendBulkWhatsAppMessages,
  sendEmergencyAlertNotifications,
  isTwilioConfigured
};