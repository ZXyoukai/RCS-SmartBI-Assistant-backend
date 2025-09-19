const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const queryRoutes = require('./routes/queryRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const exportsRoutes = require('./routes/exportsRoutes');
const suggestionsRoutes = require('./routes/suggestionsRoutes');
const accessLogsRoutes = require('./routes/accessLogsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP por janela
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartBI Assistant API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      ai: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Rotas da API
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/queries', queryRoutes);
app.use('/results', resultsRoutes);
app.use('/history', historyRoutes);
app.use('/exports', exportsRoutes);
app.use('/suggestions', suggestionsRoutes);
app.use('/access-logs', accessLogsRoutes);

// Novas rotas de IA
app.use('/ai', aiRoutes);
app.use('/conversation', conversationRoutes);

// Endpoint de informações da API
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SmartBI Assistant API',
      version: '1.0.0',
      description: 'API para assistente de Business Intelligence com IA',
      features: [
        'Conversão NL-to-SQL',
        'Conversão SQL-to-NL',
        'Chat conversacional com IA',
        'Geração de insights',
        'Análise preditiva',
        'Sistema de fallback inteligente'
      ],
      endpoints: {
        ai: [
          'POST /ai/nl2sql - Converte linguagem natural para SQL',
          'POST /ai/sql2nl - Converte SQL para linguagem natural',
          'POST /ai/validate-sql - Valida consultas SQL',
          'GET /ai/history - Histórico de interações',
          'GET /ai/metrics - Métricas de performance',
          'DELETE /ai/cache - Limpa cache de respostas'
        ],
        conversation: [
          'POST /conversation/start - Inicia sessão de chat',
          'POST /conversation/message - Envia mensagem',
          'POST /conversation/insights - Gera insights',
          'POST /conversation/predict - Análise preditiva',
          'GET /conversation/insights - Lista insights',
          'GET /conversation/sessions - Lista sessões',
          'GET /conversation/:id/history - Histórico da conversa',
          'PUT /conversation/:id/end - Encerra sessão'
        ]
      }
    }
  });
});

// Middleware de tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    availableRoutes: [
      '/health - Status da API',
      '/api/info - Informações da API',
      '/auth/* - Autenticação',
      '/users/* - Usuários',
      '/ai/* - Funcionalidades de IA',
      '/conversation/* - Chat e conversação'
    ]
  });
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro global capturado:', error);

  // Erros de validação JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }

  // Erro de payload muito grande
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Payload muito grande',
      message: 'O tamanho da requisição excede o limite permitido'
    });
  }

  // Erros do Prisma (banco de dados)
  if (error.code?.startsWith('P')) {
    console.error('Erro do Prisma:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro de banco de dados',
      message: 'Ocorreu um erro interno. Nossa equipe foi notificada.'
    });
  }

  // Erros de timeout
  if (error.code === 'ETIMEDOUT' || error.code === 'TIMEOUT') {
    return res.status(504).json({
      success: false,
      error: 'Timeout',
      message: 'A operação demorou mais que o esperado. Tente novamente.'
    });
  }

  // Erro genérico
  const statusCode = error.status || error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Algo deu errado. Nossa equipe foi notificada.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;