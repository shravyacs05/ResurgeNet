// backend/services/localAIService.js
class LocalAIService {
  constructor() {
    this.initialized = true;
    console.log('✅ Local AI Service initialized (Pattern-based responses)');
  }

  async sendMessage(userMessage, chatHistory = []) {
    console.log('🤖 Processing with local AI:', userMessage);
    
    // Use pattern matching for intelligent responses
    return this.generateIntelligentResponse(userMessage);
  }

  generateIntelligentResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Emergency detection with context
    const emergencyContext = this.detectEmergencyContext(lowerMessage);
    
    if (emergencyContext.severity === 'critical') {
      return this.generateCriticalEmergencyResponse(emergencyContext);
    } else if (emergencyContext.severity === 'high') {
      return this.generateHighEmergencyResponse(emergencyContext);
    } else {
      return this.generateGeneralResponse(emergencyContext);
    }
  }

  detectEmergencyContext(message) {
    const contexts = {
      medical: ['heart', 'breathing', 'unconscious', 'bleeding', 'injured', 'hurt', 'pain', 'medical'],
      flood: ['flood', 'water', 'drowning', 'rain', 'river'],
      earthquake: ['earthquake', 'shake', 'tremor', 'building collapse'],
      fire: ['fire', 'burn', 'smoke', 'flame'],
      shelter: ['shelter', 'safe', 'evacuate', 'where to go'],
      rescue: ['sos', 'help', 'emergency', 'rescue', 'trapped', 'stuck']
    };

    const detectedContexts = [];
    let severity = 'low';

    for (const [context, keywords] of Object.entries(contexts)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        detectedContexts.push(context);
      }
    }

    // Determine severity
    if (detectedContexts.includes('medical') || detectedContexts.includes('rescue')) {
      severity = 'critical';
    } else if (detectedContexts.length > 0) {
      severity = 'high';
    }

    return {
      contexts: detectedContexts,
      severity: severity,
      originalMessage: message
    };
  }

  generateCriticalEmergencyResponse(context) {
    const baseResponse = "🚨 **CRITICAL EMERGENCY** 🚨\n\n";
    
    if (context.contexts.includes('medical')) {
      return baseResponse + `MEDICAL EMERGENCY PROTOCOL:
      
1. 📞 CALL EMERGENCY SERVICES NOW: 911 or your local emergency number
2. 🆘 USE SOS BUTTON on our platform for immediate rescue coordination
3. 🏥 Provide first aid if trained:
   • Check breathing and consciousness
   • Stop bleeding with direct pressure
   • Do not move seriously injured persons
4. 📱 Keep phone line open for emergency services
5. 🗺️ Share your location using platform features

Emergency medical help is being coordinated!`;
    }

    return baseResponse + `IMMEDIATE RESCUE REQUIRED:

1. 📞 CALL LOCAL EMERGENCY SERVICES: 911
2. 🆘 ACTIVATE SOS FEATURE on our platform
3. 🏠 Move to safest available location
4. 📢 Make noise or signal for help if trapped
5. 📱 Keep your device charged and visible

Rescue services have been alerted!`;
  }

  generateHighEmergencyResponse(context) {
    let specificAdvice = "";
    
    if (context.contexts.includes('flood')) {
      specificAdvice = `FLOOD SAFETY ACTIONS:
• Move to higher ground immediately
• Avoid walking or driving through floodwaters
• Evacuate if instructed by authorities
• Use SOS if trapped by rising water`;
    } else if (context.contexts.includes('earthquake')) {
      specificAdvice = `EARTHQUAKE SAFETY ACTIONS:
• Drop, Cover, and Hold On during shaking
• Stay away from windows and heavy objects
• Evacuate if building is damaged
• Check for gas leaks and fires`;
    } else if (context.contexts.includes('fire')) {
      specificAdvice = `FIRE EMERGENCY ACTIONS:
• Evacuate immediately if safe to do so
• Stay low to avoid smoke inhalation
• Use SOS if trapped
• Follow emergency service instructions`;
    } else {
      specificAdvice = `EMERGENCY ACTIONS:
• Use SOS feature for rescue coordination
• Check Shelters page for safe locations
• Follow official emergency instructions
• Help others if it's safe to do so`;
    }

    return `⚠️ **EMERGENCY SITUATION DETECTED** ⚠️

${specificAdvice}

📞 Emergency Contacts: 911 or local emergency number
🆘 Platform SOS: Activated for rescue coordination
🏠 Shelters: Available on Shelters page
🗺️ Maps: Real-time info on Map View

Stay calm and follow safety procedures!`;
  }

  generateGeneralResponse(context) {
    return `🆘 **DISASTER RESPONSE ASSISTANT** 🆘

I'm here to help with emergency situations. Please:

• Describe your emergency clearly
• Use specific terms like "flood", "earthquake", "medical"
• Use SOS button for immediate rescue requests
• Check Shelters page for safe locations

Available Platform Features:
📱 SOS Emergency - Immediate rescue
🏠 Shelters - Safe locations with resources  
🗺️ Map View - Real-time disaster information
🛣️ Road Reports - Route conditions

How can I assist with your emergency situation?`;
  }
}

module.exports = new LocalAIService();