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
  
  // Compose message for the user
  const userAlertMessage = `
🚨 YOUR EMERGENCY ALERT SENT 🚨

Type: ${emergencyType.toUpperCase()}
Urgency: ${urgencyLevel.toUpperCase()}
Location: ${location.address}

Your Message: ${message}

✅ Emergency services have been notified
✅ Your emergency contacts are being alerted
✅ Nearby responders are being notified

Stay safe! Help is on the way.

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
`.trim();

  // Compose message for emergency contacts
  const contactAlertMessage = `
🚨 EMERGENCY ALERT 🚨

${userProfile.name} NEEDS IMMEDIATE HELP!

Emergency Type: ${emergencyType.toUpperCase()}
Urgency Level: ${urgencyLevel.toUpperCase()}

📍 Location: ${location.address}
${location.lat && location.lng ? `GPS: https://maps.google.com/?q=${location.lat},${location.lng}` : ''}

💬 Their Message:
${message}

⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

📞 Contact: ${userProfile.phone || 'Not available'}

⚠️ EMERGENCY SERVICES NOTIFIED
Please check on ${userProfile.name} immediately or contact local authorities.

You received this because you are listed as an emergency contact for ${userProfile.name}.
`.trim();

  const results = {
    user: null,
    emergencyContacts: [],
    summary: {
      userNotified: false,
      contactsNotified: 0,
      contactsFailed: 0,
      totalContacts: 0
    }
  };

  // Send to user (confirmation message)
  console.log(`📱 Sending confirmation to user: ${userProfile.name} (${userProfile.phone})`);
  if (userProfile.phone && userProfile.phone.startsWith('+')) {
    results.user = await sendWhatsAppMessage(
      userProfile.phone,
      userAlertMessage
    );
    results.summary.userNotified = results.user.success;
  } else {
    console.warn(`⚠️ User phone not in E.164 format: ${userProfile.phone}`);
  }

  // Send to ALL emergency contacts
  if (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0) {
    console.log(`📞 Found ${userProfile.emergencyContacts.length} emergency contacts`);
    results.summary.totalContacts = userProfile.emergencyContacts.length;
    
    for (const contact of userProfile.emergencyContacts) {
      console.log(`📱 Notifying emergency contact: ${contact.name} (${contact.relationship}) - ${contact.phone}`);
      
      if (contact.phone && contact.phone.startsWith('+')) {
        const result = await sendWhatsAppMessage(contact.phone, contactAlertMessage);
        
        if (result.success) {
          results.summary.contactsNotified++;
          console.log(`✅ Successfully notified ${contact.name}`);
        } else {
          results.summary.contactsFailed++;
          console.error(`❌ Failed to notify ${contact.name}: ${result.error}`);
        }
        
        results.emergencyContacts.push({
          contact: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          result: result,
          timestamp: new Date()
        });
      } else {
        results.summary.contactsFailed++;
        console.warn(`⚠️ Invalid phone format for ${contact.name}: ${contact.phone}`);
        results.emergencyContacts.push({
          contact: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          result: {
            success: false,
            error: 'Invalid phone format - must start with +'
          },
          timestamp: new Date()
        });
      }
    }
    
    console.log(`📊 Emergency Contacts Summary: ${results.summary.contactsNotified} notified, ${results.summary.contactsFailed} failed out of ${results.summary.totalContacts} total`);
  } else {
    console.log('ℹ️ No emergency contacts found for this user');
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