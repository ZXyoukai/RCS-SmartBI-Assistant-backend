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

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/ai', aiRoutes);
app.use('/conversation', conversationRoutes);
app.use('/queries', queryRoutes);
app.use('/results', resultsRoutes)
app.use('/history', historyRoutes);
app.use('/exports', exportsRoutes);
app.use('/suggestions', suggestionsRoutes);
app.use('/access-logs', accessLogsRoutes);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
