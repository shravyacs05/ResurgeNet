// frontend/src/pages/Chatbox.jsx
import React, { useState, useRef, useEffect } from 'react';
import chatApiService from '../services/chatApiService';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI disaster relief assistant. I can help with emergency guidance, shelter information, safety procedures, and resource locations. How can I assist you today?", 
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    const online = await chatApiService.checkHealth();
    setIsOnline(online);
    if (!online) {
      setError('Chat service is temporarily unavailable. Using emergency mode.');
    }
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick actions for common emergency queries
  const quickActions = [
    { label: '🚨 Emergency SOS Help', query: 'I need emergency rescue immediately' },
    { label: '🏠 Find Nearest Shelter', query: 'Where is the closest emergency shelter?' },
    { label: '💧 Flood Safety Guide', query: 'What should I do during a flood?' },
    { label: '🌍 Earthquake Procedures', query: 'Earthquake safety instructions' },
    { label: '🔥 Wildfire Evacuation', query: 'Wildfire safety and evacuation' },
    { label: '🏥 Medical Emergency', query: 'I need medical assistance' },
    { label: '🛣️ Road Conditions', query: 'Check road conditions and closures' },
    { label: '📦 Resource Availability', query: 'Where can I find food and water?' }
  ];

  const handleQuickAction = async (query) => {
    setInputMessage(query);
    await handleSendMessage(null, query);
  };

  const handleSendMessage = async (e, quickQuery = null) => {
    if (e) e.preventDefault();
    
    const messageText = quickQuery || inputMessage;
    if (messageText.trim() === '') return;

    // Clear any previous errors
    setError(null);

    // Add user message to chat
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

    try {
      // Call backend API service
      const botResponse = await chatApiService.sendMessage(messageText, messages);
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: botResponse, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Chat API error:', error);
      setError(error.message || 'Failed to get response from server');
      
      // Fallback to emergency responses
      const fallbackResponse = getEmergencyFallbackResponse(messageText);
      const errorMessage = { 
        id: Date.now() + 1, 
        text: fallbackResponse, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsTyping(false);
    }
  };

  // Emergency fallback responses when backend is down
  const getEmergencyFallbackResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sos') || lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return "🚨 **EMERGENCY MODE**\n\nI'm currently in emergency fallback mode. For immediate help:\n\n1. Use the SOS button on the main platform\n2. Call local emergency services\n3. Move to a safe location\n4. Follow official emergency alerts\n\nYour safety is our priority!";
    
    } else if (lowerMessage.includes('shelter')) {
      return "🏠 **SHELTER INFORMATION**\n\nIn emergency mode, please:\n• Check the Shelters page on our platform\n• Follow local emergency broadcasts\n• Move to designated safe zones\n• Help others if it's safe to do so";
    
    } else if (lowerMessage.includes('flood')) {
      return "💧 **FLOOD SAFETY**\n\nDuring floods:\n• Move to higher ground immediately\n• Avoid floodwaters - they may be contaminated\n• Do not drive through flooded areas\n• Follow evacuation orders\n• Stay tuned to emergency alerts";
    
    } else {
      return "⚠️ **EMERGENCY MODE**\n\nI'm currently operating with limited functionality. For the best assistance:\n\n• Use platform features directly (SOS, Shelters, Map)\n• Follow official emergency instructions\n• Check multiple information sources\n• Help will be available soon\n\nStay safe!";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        id: 1, 
        text: "Hello! I'm your AI disaster relief assistant. How can I help you today?", 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setError(null);
  };

  const retryConnection = async () => {
    await checkBackendConnection();
    setError(null);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 z-50 transition-all duration-300 hover:scale-110"
          aria-label="Open emergency chat assistant"
        >
          <div className="relative">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
            }`}></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col border border-gray-600">
          {/* Header */}
          <div className="bg-red-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
              }`}></div>
              <div>
                <h3 className="font-semibold text-sm">AI Emergency Assistant</h3>
                <p className="text-xs opacity-80">
                  {isOnline ? 'Connected to AI' : 'Emergency Mode'}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={clearChat}
                className="text-white hover:text-gray-200 transition-colors p-1"
                aria-label="Clear chat"
                title="Clear conversation"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors p-1"
                aria-label="Close chat"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-900">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-xs mb-3 flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={retryConnection}
                  className="text-red-300 hover:text-white text-xs underline"
                >
                  Retry
                </button>
              </div>
            )}
            
            {!isOnline && (
              <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-3 py-2 rounded text-xs mb-3">
                ⚠️ Using emergency mode - some features limited
              </div>
            )}
            
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.text}
                    </div>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-3 py-2">
                    <div className="flex space-x-1 items-center">
                      <span className="text-xs mr-2">
                        {isOnline ? 'AI is thinking' : 'Processing...'}
                      </span>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400 text-center">Quick emergency actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.query)}
                      disabled={isTyping}
                      className="text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white p-2 rounded transition-colors text-left break-words disabled:cursor-not-allowed"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your emergency or ask for help..."
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
            <div className="text-xs text-gray-400 mt-1 text-center">
              Press Enter to send • {isOnline ? 'AI-powered' : 'Emergency mode'}
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;