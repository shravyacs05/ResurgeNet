require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Connect to MongoDB
connectDB();

const app = express();
const disasterRoutes = require("./routes/disasterRoutes");
const sosRoutes = require('./routes/sosRoutes'); 
const RoadReport = require('./routes/RoadReport');
const chatbotRoutes = require('./routes/chatbot');
const newsRoutes = require('./routes/newsRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/api/profile", require("./routes/profile"));
app.use('/api/shelters', require('./routes/shelters'));
app.use("/api/disaster", disasterRoutes);
app.use('/api/sos', sosRoutes); 
app.use('/api/road-reports', RoadReport);
app.use('/api/chat', chatbotRoutes);
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Profile service is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Profile service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
