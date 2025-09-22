require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Adicionar as outras rotas da API
try {
  console.log('Loading query routes...');
  const queryRoutes = require('./routes/queryRoutes');
  app.use('/queries', queryRoutes);
  console.log('✅ Query routes loaded');
} catch (error) {
  console.error('❌ Error loading query routes:', error.message);
}

try {
  console.log('Loading results routes...');
  const resultsRoutes = require('./routes/resultsRoutes');
  app.use('/results', resultsRoutes);
  console.log('✅ Results routes loaded');
} catch (error) {
  console.error('❌ Error loading results routes:', error.message);
}

try {
  console.log('Loading history routes...');
  const historyRoutes = require('./routes/historyRoutes');
  app.use('/history', historyRoutes);
  console.log('✅ History routes loaded');
} catch (error) {
  console.error('❌ Error loading history routes:', error.message);
}

try {
  console.log('Loading exports routes...');
  const exportsRoutes = require('./routes/exportsRoutes');
  app.use('/exports', exportsRoutes);
  console.log('✅ Exports routes loaded');
} catch (error) {
  console.error('❌ Error loading exports routes:', error.message);
}

try {
  console.log('Loading suggestions routes...');
  const suggestionsRoutes = require('./routes/suggestionsRoutes');
  app.use('/suggestions', suggestionsRoutes);
  console.log('✅ Suggestions routes loaded');
} catch (error) {
  console.error('❌ Error loading suggestions routes:', error.message);
}

try {
  console.log('Loading access logs routes...');
  const accessLogsRoutes = require('./routes/accessLogsRoutes');
  app.use('/access-logs', accessLogsRoutes);
  console.log('✅ Access logs routes loaded');
} catch (error) {
  console.error('❌ Error loading access logs routes:', error.message);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
