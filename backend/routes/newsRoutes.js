// backend/routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

// GET /api/news/disaster - Get all disaster news
router.get('/disaster', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('📰 Fetching disaster news...');
    const news = await newsService.getDisasterNews(parseInt(limit));

    res.json({
      success: true,
      data: {
        news: news,
        count: news.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ News API error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      details: error.message
    });
  }
});

// GET /api/news/disaster/:type - Get news by disaster type
router.get('/disaster/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 5 } = req.query;
    
    console.log(`📰 Fetching ${type} disaster news...`);
    const news = await newsService.getNewsByDisasterType(type, parseInt(limit));

    res.json({
      success: true,
      data: {
        disasterType: type,
        news: news,
        count: news.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ ${req.params.type} news API error:`, error.message);
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${req.params.type} news`,
      details: error.message
    });
  }
});

// GET /api/news/health - Check news service health
router.get('/health', async (req, res) => {
  try {
    // Test the news service
    const news = await newsService.getDisasterNews(1);
    
    res.json({
      success: true,
      data: {
        service: 'News API',
        status: 'operational',
        provider: 'NewsAPI',
        articlesAvailable: news.length > 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        service: 'News API',
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;