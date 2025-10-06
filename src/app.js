require('dotenv').config();
const PORT = process.env.PORT || 3001;
const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const queryRoutes = require('./routes/queryRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const exportsRoutes = require('./routes/exportsRoutes');
const suggestionsRoutes = require('./routes/suggestionsRoutes');
const accessLogsRoutes = require('./routes/accessLogsRoutes');
const associatedDatabasesRoutes = require('./routes/associatedDatabasesRoutes');
const exdatabaseExtraRoutes = require('./routes/exdatabaseExtraRoutes');
const fallbacksRoutes = require('./routes/fallbacksRoutes');
const aiChatSessionsRoutes = require('./routes/aiChatSessionsRoutes');
const aiInteractionsRoutes = require('./routes/aiInteractionsRoutes');
const aiInsightsRoutes = require('./routes/aiInsightsRoutes');
const aiResponseCacheRoutes = require('./routes/aiResponseCacheRoutes');

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/ai', aiRoutes);
app.use('/conversation', conversationRoutes);
app.use('/queries', queryRoutes);
app.use('/results', resultsRoutes);
app.use('/history', historyRoutes);
app.use('/exports', exportsRoutes);
app.use('/suggestions', suggestionsRoutes);
app.use('/access-logs', accessLogsRoutes);
app.use('/databases', associatedDatabasesRoutes);
app.use('/databases/extra', exdatabaseExtraRoutes);
app.use('/fallbacks', fallbacksRoutes);
app.use('/ai/chat-sessions', aiChatSessionsRoutes);
app.use('/ai/interactions', aiInteractionsRoutes);
app.use('/ai/insights', aiInsightsRoutes);
app.use('/ai/cache', aiResponseCacheRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});


// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
  });
}

module.exports = app;
