const express = require('express');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const queryRoutes = require('./routes/queryRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const exportsRoutes = require('./routes/exportsRoutes');
const suggestionsRoutes = require('./routes/suggestionsRoutes');
const accessLogsRoutes = require('./routes/accessLogsRoutes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/queries', queryRoutes);
app.use('/results', resultsRoutes);
app.use('/history', historyRoutes);
app.use('/exports', exportsRoutes);
app.use('/suggestions', suggestionsRoutes);
app.use('/access-logs', accessLogsRoutes);

module.exports = app;