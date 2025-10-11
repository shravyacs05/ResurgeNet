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

    // Validate disaster type
    const validTypes = ['flood', 'earthquake', 'fire', 'cyclone', 'landslide'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid disaster type',
        validTypes: validTypes
      });
    }

    console.log(`📰 Fetching ${type} disaster news...`);
    const news = await newsService.getNewsByDisasterType(
      type.toLowerCase(),
      parseInt(limit)
    );

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
    const news = await newsService.getDisasterNews(1);
    const status = newsService.getServiceStatus();

    res.json({
      success: true,
      data: {
        service: 'News API',
        status: 'operational',
        provider: 'NewsAPI.org',
        articlesAvailable: news.length > 0,
        serviceStatus: status,
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

// GET /api/news/debug-news - Debug endpoint to test API
router.get('/debug-news', async (req, res) => {
  try {
    console.log('🔧 Debug mode: Testing NewsAPI...');

    // Test API connectivity
    const apiTest = await newsService.testAPI();
    console.log('🔧 API Test Result:', apiTest);

    // Get actual news with detailed logging
    console.log('🔧 Fetching 5 articles...');
    const news = await newsService.getDisasterNews(5);
    console.log(`🔧 Retrieved ${news.length} articles`);

    res.json({
      apiTest,
      newsCount: news.length,
      news: news,
      serviceStatus: newsService.getServiceStatus(),
      timestamp: new Date().toISOString(),
      environment: {
        hasApiKey: !!process.env.NEWS_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('🔧 Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/news/refresh - Manually trigger refresh
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual refresh triggered...');
    const news = await newsService.getDisasterNews(10);

    res.json({
      success: true,
      data: {
        message: 'News refreshed successfully',
        count: news.length,
        news: news,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Refresh error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to refresh news',
      details: error.message
    });
  }
});

// GET /api/news/categories - Get available categories
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'all', name: 'All Disasters', icon: '🌪️' },
    { id: 'flood', name: 'Floods', icon: '🌊' },
    { id: 'earthquake', name: 'Earthquakes', icon: '🌍' },
    { id: 'fire', name: 'Fires', icon: '🔥' },
    { id: 'cyclone', name: 'Cyclones', icon: '🌀' },
    { id: 'landslide', name: 'Landslides', icon: '⛰️' }
  ];

  res.json({
    success: true,
    data: {
      categories: categories,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;