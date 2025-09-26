require('dotenv').config();
const PORT = process.env.PORT || 3001;
const express = require('express');
const cors = require('cors');
const app = express();
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

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};
// Middleware básico

app.use(cors(corsOptions));
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
app.use('/exdatabase', associatedDatabasesRoutes);
app.use('/exdatabase', exdatabaseExtraRoutes);
app.use('/fallbacks', fallbacksRoutes);


app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});

module.exports = app;
