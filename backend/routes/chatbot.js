// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

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

    // Call Gemini service
    const response = await geminiService.sendMessage(message, chatHistory);

    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// GET /api/chat/health - Check chatbot service health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Chatbot API',
      status: 'operational',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;