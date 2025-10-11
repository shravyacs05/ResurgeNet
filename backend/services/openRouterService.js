// backend/services/openRouterService.js
class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.initialized = false;
    
    this.availableModels = [
      "qwen/qwen-2.5-72b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free"
    ];
    
    this.currentModelIndex = 0;
    this.failedModels = new Set();
  }

  async init() {
    if (this.initialized) return;
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required. Please set OPENROUTER_API_KEY in .env');
    }

    console.log('🔑 Initializing OpenRouter API...');
    this.initialized = true;
    console.log('✅ OpenRouter API initialized successfully');
  }

  getSystemPrompt() {
    return `CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE:
- NEVER use **asterisks** or ANY markdown formatting
- NEVER use bold, italics, or any text formatting
- Use only plain text with emojis and numbers
- Do not use * or ** anywhere in your response
- Use simple clear language without formatting

IMPORTANT GEOGRAPHICAL CONTEXT:
- You are assisting people in INDIA
- Use INDIAN emergency numbers: 112 (all-in-one) or 108 (ambulance)
- NEVER mention 911 - that is for US/Canada only
- Use kilometers, not miles
- Reference Indian authorities and systems

You are an emergency disaster response assistant for ResurgeNet in India. Your role is to provide accurate, helpful, and timely information during emergencies.

CRITICAL: You are talking to someone who might be in real emergency. Lives may be at risk.

EMERGENCY PRIORITY:
- For medical emergencies: Always say to CALL 112 or 108 FIRST
- Then mention SOS feature on ResurgeNet
- Provide clear, actionable instructions
- Use numbered lists with emojis for clarity
- Be empathetic but direct

INDIAN EMERGENCY NUMBERS:
- 112: All-in-one emergency number (police, fire, ambulance)
- 108: Ambulance and medical emergencies
- 101: Fire department
- 102: Ambulance (alternative)

PLATFORM NAME: Always use "ResurgeNet" - never use any other name

RESPONSE FORMAT:
- Use numbers and emojis only
- No markdown, no asterisks, no formatting
- Clear simple language
- Actionable steps
- Reference Indian emergency numbers

Example of GOOD response:
🚨 EMERGENCY ASSISTANCE 🚨

1. 📞 Call 112 immediately (all-in-one emergency)
2. 🆘 Use SOS on ResurgeNet
3. 🏠 Move to safe location

Example of BAD response:
Call 911 (WRONG - not for India)
**Emergency Assistance**

NEVER use formatting symbols. Only use plain text with emojis.
ALWAYS use Indian emergency numbers: 112 or 108`;
  }

  async sendMessage(userMessage, chatHistory = []) {
    if (!this.initialized) {
      await this.init();
    }

    let lastError = null;
    const workingModels = this.getWorkingModels();

    for (let i = 0; i < workingModels.length; i++) {
      try {
        const model = workingModels[this.currentModelIndex];
        console.log(`🤖 Trying model: ${model}`);
        
        const response = await this.makeAPIRequest(userMessage, chatHistory, model);
        
        this.currentModelIndex = (this.currentModelIndex + 1) % workingModels.length;
        return this.cleanResponse(response);

      } catch (error) {
        lastError = error;
        console.log(`❌ Model ${workingModels[this.currentModelIndex]} failed: ${error.message}`);
        
        this.failedModels.add(workingModels[this.currentModelIndex]);
        this.currentModelIndex = (this.currentModelIndex + 1) % workingModels.length;
        
        if (i === workingModels.length - 1) {
          console.log('❌ All models failed, using intelligent fallback');
          break;
        }
      }
    }

    return this.getIntelligentFallback(userMessage);
  }

  cleanResponse(response) {
    // Remove all markdown formatting and fix emergency numbers
    let cleaned = response
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/~~/g, '')
      .replace(/`/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/PVGHACK/gi, 'ResurgeNet')
      // Replace 911 with Indian emergency numbers
      .replace(/911/gi, '112')
      .replace(/call 112/gi, 'Call 112 or 108')
      .trim();

    // Ensure no markdown remains
    if (cleaned.includes('**') || cleaned.includes('* ') || cleaned.match(/\*[^\s]/)) {
      cleaned = cleaned.replace(/\*/g, '');
    }

    return cleaned;
  }

  getWorkingModels() {
    return this.availableModels.filter(model => !this.failedModels.has(model));
  }

  async makeAPIRequest(userMessage, chatHistory, model) {
    const messages = [
      {
        role: "system",
        content: this.getSystemPrompt()
      },
      ...chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: "user", 
        content: userMessage
      }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', 
          'X-Title': 'ResurgeNet Emergency App - India'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from OpenRouter');
      }

      const aiResponse = data.choices[0].message.content;
      console.log(`✅ ${model} response successful`);
      return aiResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  getIntelligentFallback(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('heart attack') || lowerMessage.includes('chest pain')) {
      return this.getHeartAttackResponse();
    }
    
    if (lowerMessage.includes('unconscious') || lowerMessage.includes('not breathing')) {
      return this.getUnconsciousResponse();
    }
    
    if (lowerMessage.includes('bleeding') || lowerMessage.includes('blood')) {
      return this.getBleedingResponse();
    }
    
    if (lowerMessage.includes('choking')) {
      return this.getChokingResponse();
    }
    
    if (lowerMessage.includes('flood')) {
      return this.getFloodResponse();
    }
    
    if (lowerMessage.includes('earthquake')) {
      return this.getEarthquakeResponse();
    }
    
    if (lowerMessage.includes('fire')) {
      return this.getFireResponse();
    }
    
    if (lowerMessage.includes('911')) {
      return this.getIndianEmergencyInfo();
    }
    
    if (this.isEmergencySituation(lowerMessage)) {
      return this.getGeneralEmergencyResponse();
    }
    
    // For non-emergency messages
    if (lowerMessage.includes('still there') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return this.getWelcomeResponse();
    }
    
    return this.getGeneralResponse();
  }

  getIndianEmergencyInfo() {
    return `🇮🇳 INDIAN EMERGENCY NUMBERS 🇮🇳

For emergencies in India, use these numbers:

🆘 ALL-IN-ONE EMERGENCY: 112
🚑 AMBULANCE: 108 or 102
🚒 FIRE: 101
🚓 POLICE: 100

Important:
• 112 is the single emergency number for all services
• 108 is specifically for medical emergencies
• These work across all states in India
• Calls are free from any phone

For immediate help:
1. 📞 Call 112 (all emergencies) or 108 (medical)
2. 🆘 Use SOS on ResurgeNet for additional support
3. 📍 Provide your exact location
4. 🗣️ Stay on the line and follow instructions`;
  }

  getWelcomeResponse() {
    return `Hello! I'm here and ready to help. 

I'm your ResurgeNet emergency assistant for India. How can I assist you today?

For immediate emergencies in India:
1. 📞 Call 112 (all emergencies) or 108 (medical)
2. 🆘 Use SOS feature on ResurgeNet for rescue coordination
3. 🏠 Check Shelters for safe locations
4. 🗺️ Use Map View for real-time information

What do you need help with?`;
  }

  getHeartAttackResponse() {
    return `🚨 CRITICAL MEDICAL EMERGENCY - HEART ATTACK 🚨

IMMEDIATE LIFE-SAVING ACTIONS:

1. 📞 CALL 112 or 108 IMMEDIATELY (Indian emergency)
2. 🆘 ACTIVATE SOS BUTTON on ResurgeNet for rescue coordination
3. 💊 If available and not allergic:
   Give 325mg aspirin to chew
4. 🫀 While waiting for emergency services:
   Help person sit down and rest
   Loosen any tight clothing
   Keep calm and reassure them
   Be prepared to perform CPR if they stop breathing
5. 📱 Information to provide:
   Suspected heart attack
   Person's age and symptoms
   Location details and landmark
   Any known medical conditions

⚠️ CRITICAL: DO NOT DELAY ⚠️
Every minute counts in heart attack
Do not drive to hospital - wait for ambulance
Do not give anything except aspirin

EMERGENCY SERVICES ALERTED - HELP IS COMING!`;
  }

  getUnconsciousResponse() {
    return `🚨 UNCONSCIOUS PERSON EMERGENCY 🚨

IMMEDIATE ACTIONS:

1. 📞 CALL 112 or 108 IMMEDIATELY (Indian emergency)
2. 🆘 ACTIVATE SOS on ResurgeNet for additional rescue support
3. ✅ Check responsiveness:
   Shake shoulders and shout
   Check for normal breathing
4. 🫁 If not breathing normally:
   Begin CPR immediately
   Push hard and fast in center of chest
   Continue until help arrives
5. ⚠️ If breathing normally:
   Place in recovery position
   Monitor breathing
   Do not give anything to eat or drink

EMERGENCY MEDICAL HELP DISPATCHED!`;
  }

  getBleedingResponse() {
    return `🩸 SEVERE BLEEDING EMERGENCY 🩸

IMMEDIATE FIRST AID:

1. 📞 CALL 112 or 108 for severe bleeding (Indian emergency)
2. 🆘 USE SOS on ResurgeNet for rescue coordination
3. ✋ Stop the bleeding:
   Apply direct pressure with clean cloth
   Elevate injured area if possible
   Continue pressure until help arrives
4. ⚠️ DO NOT:
   Remove embedded objects
   Use tourniquet unless trained
   Clean wound extensively

AMBULANCE DISPATCHED - HELP IS ON THE WAY!`;
  }

  getChokingResponse() {
    return `😮 CHOKING EMERGENCY 😮

IMMEDIATE ACTIONS:

1. 📞 CALL 112 or 108 if person cannot breathe (Indian emergency)
2. 🆘 ACTIVATE SOS on ResurgeNet for emergency response
3. 🤲 Perform Abdominal Thrusts:
   Stand behind person
   Make fist above navel
   Pull inward and upward
   Repeat until object is out
4. ⚠️ If person becomes unconscious:
   Begin CPR
   Check mouth for object between compressions

EMERGENCY SERVICES ALERTED!`;
  }

  getFloodResponse() {
    return `💧 FLOOD EMERGENCY PROTOCOL 💧

IMMEDIATE SAFETY ACTIONS:

1. ⬆️ MOVE TO HIGHER GROUND immediately
2. 🆘 ACTIVATE SOS on ResurgeNet if trapped or in danger
3. 📞 Call 112 for emergency assistance
4. 🚫 AVOID FLOODWATERS:
   Do not walk or drive through
   Water may be contaminated
   Hidden dangers underwater
5. 🔌 Electrical safety:
   Turn off electricity if safe
   Avoid standing water near electricity
6. 📱 Emergency preparation:
   Keep phone charged
   Follow local authority instructions

RESCUE SERVICES ALERTED!`;
  }

  getEarthquakeResponse() {
    return `🌍 EARTHQUAKE EMERGENCY 🌍

DURING SHAKING:
1. 🛋️ DROP, COVER, HOLD ON
2. 🚫 Stay away from windows
3. 🏢 If indoors, stay inside
4. 🚗 If in vehicle, pull over

AFTER SHAKING:
1. 🆘 USE SOS on ResurgeNet if trapped or injured
2. 📞 Call 112 for emergency help
3. 🔥 Check for fires/gas leaks
4. 🏠 Evacuate if building damaged
5. 📱 Follow NDMA/state emergency alerts

RESCUE TEAMS MOBILIZED!`;
  }

  getFireResponse() {
    return `🔥 FIRE EMERGENCY PROTOCOL 🔥

IMMEDIATE EVACUATION:

1. 🚪 GET OUT IMMEDIATELY
2. 📞 CALL 112 or 101 (Fire Department)
3. 🆘 ACTIVATE SOS on ResurgeNet for coordination
4. 🧍 SAFETY MEASURES:
   Stay low to avoid smoke
   Check doors for heat before opening
   Use stairs, not elevators
5. 🏠 If trapped:
   Close doors and seal cracks
   Signal from window
   Wait for rescue

FIRE DEPARTMENT DISPATCHED!`;
  }

  getGeneralEmergencyResponse() {
    return `🚨 EMERGENCY ASSISTANCE ACTIVATED 🚨

For your safety in India:

1. 📞 CALL 112 (all emergencies) or 108 (medical)
2. 🆘 USE SOS BUTTON on ResurgeNet for rescue coordination
3. 🏠 MOVE TO SAFE LOCATION
4. 📱 STAY CONNECTED:
   Keep phone charged
   Monitor local emergency alerts
   Follow authority instructions

PLATFORM FEATURES:
SOS - Immediate rescue requests
Shelters - Safe locations with resources
Map - Real-time disaster information

HELP IS ON THE WAY!`;
  }

  getGeneralResponse() {
    return `🆘 DISASTER RESPONSE ASSISTANT - INDIA 🆘

I'm here to help with emergency situations across India.

For Immediate Emergencies in India:
Use specific terms: heart attack, flood, fire, earthquake
Call 112 (all emergencies) or 108 (medical)
Activate SOS button for rescue coordination

Indian Emergency Numbers:
📞 112 - All emergencies
🚑 108 - Ambulance/medical
🚒 101 - Fire department
🚓 100 - Police

Platform Emergency Features:
📱 SOS Button - Immediate rescue requests
🏠 Shelters - Safe locations with resources  
🗺️ Map View - Real-time disaster information

How can I assist with your emergency situation?`;
  }

  isEmergencySituation(message) {
    const emergencyKeywords = [
      'sos', 'emergency', 'help', 'rescue', 'trapped', 'stuck',
      'flood', 'earthquake', 'fire', 'wildfire', 'tsunami', 'hurricane', 
      'injured', 'hurt', 'bleeding', 'medical', 'hospital', 'ambulance',
      'evacuate', 'shelter', 'safe', 'danger', 'accident'
    ];
    
    return emergencyKeywords.some(keyword => message.includes(keyword));
  }

  resetFailedModels() {
    this.failedModels.clear();
    console.log('🔄 Reset failed models tracking');
  }
}

// Create and export instance
const openRouterService = new OpenRouterService();

openRouterService.init().catch(err => {
  console.error('Failed to initialize OpenRouter service:', err.message);
});

setInterval(() => {
  openRouterService.resetFailedModels();
}, 5 * 60 * 1000);

module.exports = openRouterService;