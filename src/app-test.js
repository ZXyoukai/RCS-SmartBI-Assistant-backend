require('dotenv').config();
const express = require('express');

const app = express();

// Middleware básico
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Teste das rotas originais uma por uma
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/authRoutes');
  app.use('/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  console.log('Loading user routes...');
  const userRoutes = require('./routes/userRoutes');
  app.use('/users', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
}

try {
  console.log('Loading AI routes...');
  const aiRoutes = require('./routes/aiRoutes');
  app.use('/ai', aiRoutes);
  console.log('✅ AI routes loaded');
} catch (error) {
  console.error('❌ Error loading AI routes:', error.message);
}

try {
  console.log('Loading conversation routes...');
  const conversationRoutes = require('./routes/conversationRoutes');
  app.use('/conversation', conversationRoutes);
  console.log('✅ Conversation routes loaded');
} catch (error) {
  console.error('❌ Error loading conversation routes:', error.message);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
