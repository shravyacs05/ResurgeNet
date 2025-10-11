// backend/services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Using mock mode.');
      this.mockMode = true;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Try different model names - Gemini frequently updates these
      const modelNames = [
        "gemini-1.5-flash-latest",  // Most common
        "gemini-1.5-flash",         // Alternative
        "gemini-1.0-pro",           // Fallback
        "gemini-pro"                // Legacy
      ];

      let model;
      let successfulModel = null;

      // Try to initialize with each model name
      for (const modelName of modelNames) {
        try {
          model = this.genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          });
          successfulModel = modelName;
          console.log(`✅ Gemini AI initialized successfully with model: ${modelName}`);
          break;
        } catch (modelError) {
          console.log(`❌ Model ${modelName} failed: ${modelError.message}`);
          continue;
        }
      }

      if (!successfulModel) {
        throw new Error('All model names failed');
      }

      this.model = model;
      this.mockMode = false;
      
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error.message);
      this.mockMode = true;
    }
  }

  // System prompt for disaster response context
  getSystemPrompt() {
    return `You are an emergency disaster response assistant for PVGHACK platform. Your role is to provide accurate, helpful, and timely information during natural disasters like floods, earthquakes, wildfires, etc.

CRITICAL: You are talking to someone in a real emergency. Lives may be at risk.

IMPORTANT GUIDELINES:
- Provide clear, actionable emergency advice FIRST
- Be empathetic but direct - people are scared
- Focus on immediate life-saving actions
- Direct users to SOS feature for rescue requests
- Mention platform features (Shelters, Map) when relevant
- For medical emergencies, prioritize professional help
- Keep responses concise but informative

PLATFORM FEATURES:
- SOS Emergency Button: For immediate rescue
- Shelters Page: Safe zones with resources  
- Map View: Real-time disaster information
- Road Reports: Route information

Always prioritize saving lives and providing clear instructions.`;
  }

  async sendMessage(userMessage, chatHistory = []) {
    // If in mock mode or no API key, use enhanced mock responses
    if (this.mockMode || !this.apiKey) {
      console.log('Using enhanced mock response for:', userMessage);
      return this.getEnhancedMockResponse(userMessage);
    }

    try {
      console.log('🤖 Calling Gemini AI with message:', userMessage);
      
      // Simple prompt without complex history
      const prompt = `${this.getSystemPrompt()}

User message: ${userMessage}

Provide emergency assistance:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini AI response successful');
      return text;

    } catch (error) {
      console.error('❌ Error calling Gemini API:', error.message);
      // Use enhanced emergency responses
      return this.getEnhancedMockResponse(userMessage);
    }
  }

  getEnhancedMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Comprehensive emergency response mapping
    const emergencyResponses = {
      // Medical emergencies
      'faint': "🚨 **MEDICAL EMERGENCY - UNCONSCIOUS PERSON**\n\nIMMEDIATE ACTIONS:\n1. Check if breathing - call emergency services if not breathing\n2. Place in recovery position if breathing\n3. Do NOT give food or water\n4. Loosen tight clothing\n5. Stay with the person\n6. Use SOS feature to alert rescue teams\n\n⚠️ This is serious - professional help is essential!",
      
      'accident': "🚨 **ACCIDENT EMERGENCY**\n\nIMMEDIATE ACTIONS:\n1. Check for danger to yourself first\n2. Call emergency services immediately\n3. Do NOT move injured person unless in danger\n4. Control bleeding with direct pressure\n5. Keep person warm and comfortable\n6. Use SOS to share your location with rescuers\n\n🏥 Help is on the way!",
      
      'unconscious': "🚨 **UNCONSCIOUS PERSON**\n\nCRITICAL STEPS:\n1. Check responsiveness - tap and shout\n2. Call emergency services NOW\n3. Check breathing - if not breathing, start CPR if trained\n4. If breathing, place in recovery position\n5. Monitor until help arrives\n6. Use SOS feature for rapid response\n\n🚑 Emergency services dispatched!",
      
      'bleed': "🚨 **BLEEDING EMERGENCY**\n\nIMMEDIATE CARE:\n1. Apply direct pressure with clean cloth\n2. Elevate injured area above heart\n3. Do NOT remove soaked bandages\n4. Call emergency services for heavy bleeding\n5. Keep person calm and lying down\n6. Use SOS to get medical help quickly",
      
      'breath': "🚨 **BREATHING DIFFICULTY**\n\nURGENT ACTIONS:\n1. Call emergency services immediately\n2. Help person sit upright\n3. Loosen tight clothing\n4. Do NOT give food or drink\n5. Stay calm and reassure them\n6. Use SOS for emergency medical response\n\n💨 Help is coming!",

      // Natural disasters
      'flood': "💧 **FLOOD SAFETY**\n\nDURING FLOODS:\n• Move to higher ground immediately\n• Avoid walking/driving through floodwaters\n• Do not touch electrical equipment\n• Evacuate when instructed\n• Listen to emergency alerts\n\nUse SOS if trapped by rising water!",
      
      'earthquake': "🌍 **EARTHQUAKE SAFETY**\n\nIF SHAKING:\n• DROP to the ground\n• COVER under sturdy furniture\n• HOLD ON until shaking stops\n• Stay away from windows\n• If outdoors, move to open area\n\nUse SOS if trapped or injured!",
      
      'fire': "🔥 **FIRE EMERGENCY**\n\nIMMEDIATE ACTIONS:\n• Evacuate immediately if safe\n• Close doors behind you\n• Stay low to avoid smoke\n• Feel doors before opening\n• Use SOS if trapped\n• Go to nearest shelter\n\n🚒 Fire rescue alerted!",

      // General emergencies
      'sos': "🚨 **EMERGENCY ASSISTANCE**\n\nI understand this is an emergency:\n1. Go to SOS page and press emergency button\n2. Your location shared with rescue teams\n3. Stay in safe location if possible\n4. Keep phone accessible for updates\n\nHelp is being dispatched to your location!",
      
      'shelter': "🏠 **SHELTER INFORMATION**\n\nEmergency shelters provide:\n• Safe accommodation\n• Food and water\n• Medical assistance\n• Basic supplies\n\nCheck Shelters page for nearest location!",
      
      'medical': "🏥 **MEDICAL ASSISTANCE**\n\nFor medical emergencies:\n• Use SOS feature for immediate help\n• Describe medical situation clearly\n• Do not move seriously injured\n• Keep emergency contacts ready\n\nMedical help directed to your location!"
    };

    // Find the best matching response
    for (const [keyword, response] of Object.entries(emergencyResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Default emergency response
    return "🚨 **EMERGENCY ASSISTANCE**\n\nI can help with:\n• Medical emergencies\n• Natural disasters\n• Shelter locations\n• Rescue requests\n\nUse SOS for immediate help or ask about specific emergencies!";
  }
}

// Create singleton instance
const geminiService = new GeminiService();
module.exports = geminiService;