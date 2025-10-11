import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your disaster relief assistant. How can I help you today?", 
      sender: 'bot' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick actions for common queries
  const quickActions = [
    { label: '🚨 Emergency SOS', query: 'How do I send SOS?' },
    { label: '🏠 Find Shelter', query: 'Where are the shelters?' },
    { label: '💧 Flood Safety', query: 'What to do during floods?' },
    { label: '🌍 Earthquake Safety', query: 'Earthquake safety tips' },
    { label: '🔥 Fire Safety', query: 'Wildfire safety procedures' },
    { label: '🏥 Medical Help', query: 'Need medical assistance' }
  ];

  const handleQuickAction = (query) => {
    setInputMessage(query);
    handleSendMessage(null, query);
  };

  const handleSendMessage = (e, quickQuery = null) => {
    if (e) e.preventDefault();
    
    const messageText = quickQuery || inputMessage;
    if (messageText.trim() === '') return;

    // Add user message
    const userMessage = { 
      id: Date.now(), 
      text: messageText, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    if (!quickQuery) setInputMessage('');

    // Show typing indicator
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(messageText.toLowerCase());
      const botMessage = { 
        id: Date.now() + 1, 
        text: botResponse, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput) => {
    if (userInput.includes('sos') || userInput.includes('emergency')) {
      return "🚨 EMERGENCY PROCEDURE:\n• Go to the SOS page immediately\n• Press the emergency button\n• Your location will be shared with rescue teams\n• Stay calm and wait for instructions\n• Keep your phone accessible";
    
    } else if (userInput.includes('shelter') || userInput.includes('safe')) {
      return "🏠 SHELTER INFORMATION:\n• Check the 'Shelters' page for real-time locations\n• Shelters provide food, water, and medical aid\n• Bring essential medications and documents\n• Pets may have separate accommodations\n• Follow shelter staff instructions";
    
    } else if (userInput.includes('flood')) {
      return "💧 FLOOD SAFETY:\n• Move to higher ground immediately\n• Avoid walking/driving through floodwaters\n• Do not touch electrical equipment in water\n• Evacuate when instructed by authorities\n• Listen to emergency alerts on radio/TV";
    
    } else if (userInput.includes('earthquake')) {
      return "🌍 EARTHQUAKE SAFETY:\n• DROP to the ground\n• COVER under sturdy furniture\n• HOLD ON until shaking stops\n• Stay away from windows and exterior walls\n• If outdoors, move to open area away from buildings";
    
    } else if (userInput.includes('fire') || userInput.includes('wildfire')) {
      return "🔥 WILDFIRE SAFETY:\n• Evacuate immediately if ordered\n• Close all windows, vents, and doors\n• Wear protective clothing (cotton/wool)\n• Breathe through moist cloth to filter air\n• Move to areas without vegetation";
    
    } else if (userInput.includes('medical') || userInput.includes('first aid') || userInput.includes('hurt')) {
      return "🏥 MEDICAL ASSISTANCE:\n• Use SOS feature for medical emergencies\n• Apply direct pressure to stop bleeding\n• Keep injured person warm and comfortable\n• Don't move seriously injured people\n• Seek professional medical help immediately";
    
    } else if (userInput.includes('food') || userInput.includes('water') || userInput.includes('resource')) {
      return "🍞 RESOURCE AVAILABILITY:\n• Emergency resources at designated shelters\n• Check 'Resources' page for distribution points\n• Ration available supplies\n• Boil water if safety is uncertain\n• Follow official guidance for resource collection";
    
    } else if (userInput.includes('road') || userInput.includes('blocked') || userInput.includes('route')) {
      return "🛣️ ROAD INFORMATION:\n• Report blocked roads using 'Report Incident' feature\n• Check the map for real-time route updates\n• Follow detour signs and official instructions\n• Avoid disaster-affected areas\n• Emergency vehicles have priority";
    
    } else if (userInput.includes('hello') || userInput.includes('hi') || userInput.includes('hey')) {
      return "Hello! I'm your disaster relief assistant. I can help with emergency procedures, shelter locations, safety tips, and resource information. How can I assist you today?";
    
    } else if (userInput.includes('thank')) {
      return "You're welcome! Stay safe and don't hesitate to ask if you need more help. Remember to check official channels for the latest updates.";
    
    } else {
      return "I'm here to help with disaster-related information. You can ask me about:\n• Emergency procedures and SOS\n• Shelter locations and safety\n• Flood, earthquake, or fire safety\n• Medical assistance\n• Resource availability\n• Road conditions and reports\n\nUse the quick buttons below for common questions!";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 z-50 transition-all duration-300 hover:scale-110"
          aria-label="Open chat assistant"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col border border-gray-600">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Disaster Relief Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}
                  >
                    {message.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions - Show only at beginning */}
            {messages.length <= 2 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400 text-center">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.query)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors text-left break-words"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about safety, shelters, resources..."
                className="flex-1 rounded-md border-gray-600 bg-gray-700 text-white text-sm placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 px-3 py-2"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || inputMessage.trim() === ''}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;