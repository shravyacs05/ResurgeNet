// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const openRouterService = require('../services/openRouterService');

// POST /api/chat/send - Send message to AI chatbot
router.post('/send', async (req, res) => {
  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log('🤖 Chat request:', { message, historyLength: chatHistory.length });

    // Call OpenRouter service
    const response = await openRouterService.sendMessage(message, chatHistory);

    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Chat API error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'AI service temporarily unavailable',
      details: error.message
    });
  }
});

// GET /api/chat/health - Check chatbot service health
router.get('/health', async (req, res) => {
  try {
    // Test the service
    await openRouterService.sendMessage('Test connection');
    
    res.json({
      success: true,
      data: {
        service: 'Chatbot API',
        status: 'operational',
        ai: 'connected',
        provider: 'OpenRouter',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        service: 'Chatbot API', 
        status: 'degraded',
        ai: 'fallback mode',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;