const express = require("express");
const router = express.Router();
const mlService= require("../services/mlServices")
const DisasterMessage = require("../models/DisasterMessage");

// Middleware to check ML service health
const checkMLService = async (req, res, next) => {
  try {
    const health = await mlService.checkHealth();
    if (!health.model_loaded) {
      return res.status(503).json({ error: "ML model not loaded" });
    }
    next();
  } catch (error) {
    return res.status(503).json({ error: "ML service unavailable" });
  }
};

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const health = await mlService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

// Predict single message
router.post("/predict", checkMLService, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prediction = await mlService.predictMessage(message);

    // Save to database (optional)
    try {
      const disasterMessage = new DisasterMessage({
        message: prediction.message,
        predictions: prediction.predictions,
      });
      await disasterMessage.save();
    } catch (dbError) {
      console.error("Failed to save to database:", dbError);
      // Continue without failing the request
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Interactive prediction (like the notebook)
router.post('/predict_interactive', checkMLService, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await mlService.predictInteractive(message);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Predict batch of messages
router.post("/predict/batch", checkMLService, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    if (messages.length > 100) {
      return res
        .status(400)
        .json({ error: "Maximum 100 messages allowed per batch" });
    }

    const predictions = await mlService.predictBatch(messages);

    // Save batch to database (optional)
    try {
      const savePromises = predictions.results.map((result) => {
        const disasterMessage = new DisasterMessage({
          message: result.message,
          predictions: result.predictions,
        });
        return disasterMessage.save();
      });
      await Promise.all(savePromises);
    } catch (dbError) {
      console.error("Failed to save batch to database:", dbError);
      // Continue without failing the request
    }

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available categories
router.get("/categories", checkMLService, async (req, res) => {
  try {
    const categories = await mlService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message history from database
router.get("/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await DisasterMessage.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await DisasterMessage.countDocuments();

    res.json({
      messages,
      total,
      limit,
      skip,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get("/statistics", async (req, res) => {
  try {
    const totalMessages = await DisasterMessage.countDocuments();

    // Get category frequency
    const messages = await DisasterMessage.find();
    const categoryFrequency = {};

    messages.forEach((msg) => {
      msg.activeCategories.forEach((category) => {
        categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
      });
    });

    res.json({
      totalMessages,
      categoryFrequency,
      lastUpdated: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a message from history
router.delete("/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await DisasterMessage.findByIdAndDelete(id);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
