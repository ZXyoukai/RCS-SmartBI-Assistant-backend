const express = require('express');
const rateLimit = require('express-rate-limit');
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting para conversações
const conversationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 mensagens por minuto
  message: {
    success: false,
    error: 'Limite de mensagens excedido. Aguarde 1 minuto.',
    retryAfter: '1 minute'
  }
});

// Rate limiting para geração de insights
const insightRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 gerações de insight por 5 minutos
  message: {
    success: false,
    error: 'Limite de geração de insights excedido. Aguarde 5 minutos.',
    retryAfter: '5 minutes'
  }
});

// Middleware de validação para mensagens
const validateMessage = (req, res, next) => {
  const { message, sessionId } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Campo "message" é obrigatório e deve ser uma string'
    });
  }
  
  if (message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Mensagem não pode estar vazia'
    });
  }
  
  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'Mensagem muito longa. Máximo 2000 caracteres.'
    });
  }
  
  if (!sessionId || isNaN(sessionId)) {
    return res.status(400).json({
      success: false,
      error: 'Campo "sessionId" é obrigatório e deve ser um número'
    });
  }
  
  next();
};

// Middleware de validação para parâmetros de sessão
const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  
  if (!sessionId || isNaN(sessionId)) {
    return res.status(400).json({
      success: false,
      error: 'ID da sessão inválido'
    });
  }
  
  next();
};

// Aplicar middleware de autenticação
router.use(authMiddleware);

/**
 * @route POST /conversation/start
 * @desc Inicia uma nova sessão de conversa
 * @access Private
 * @body {
 *   contextData?: object,    // Dados de contexto inicial (opcional)
 *   sessionType?: string     // Tipo da sessão (opcional, padrão: general)
 * }
 */
router.post('/start', (req, res, next) => {
  const { contextData, sessionType } = req.body;
  
  // Validação do sessionType
  if (sessionType) {
    const validTypes = ['general', 'nl2sql', 'analytics', 'insights'];
    if (!validTypes.includes(sessionType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de sessão inválido',
        validTypes
      });
    }
  }
  
  // Validação do contextData
  if (contextData && typeof contextData !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'contextData deve ser um objeto'
    });
  }
  
  next();
}, conversationController.startSession);

/**
 * @route POST /conversation/message
 * @desc Envia uma mensagem na conversa
 * @access Private
 * @body {
 *   sessionId: number,       // ID da sessão (obrigatório)
 *   message: string,         // Mensagem do usuário (obrigatório)
 *   language?: string        // Idioma (opcional, padrão: pt-BR)
 * }
 */
router.post('/message',
  conversationRateLimit,
  validateMessage,
  conversationController.sendMessage
);

/**
 * @route POST /conversation/insights
 * @desc Gera insights para o usuário
 * @access Private
 * @body {
 *   analysisType?: string,   // Tipo de análise (padrão: general)
 *   parameters?: object,     // Parâmetros da análise (opcional)
 *   sessionId?: number       // ID da sessão para contexto (opcional)
 * }
 */
router.post('/insights',
  insightRateLimit,
  (req, res, next) => {
    const { analysisType, parameters, sessionId } = req.body;
    
    // Validação do analysisType
    if (analysisType) {
      const validTypes = ['general', 'trend_analysis', 'performance', 'usage_patterns', 'recommendations'];
      if (!validTypes.includes(analysisType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de análise inválido',
          validTypes
        });
      }
    }
    
    // Validação dos parâmetros
    if (parameters && typeof parameters !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros devem ser um objeto'
      });
    }
    
    // Validação do sessionId se fornecido
    if (sessionId && isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'sessionId deve ser um número'
      });
    }
    
    next();
  },
  conversationController.generateInsights
);

/**
 * @route POST /conversation/predict
 * @desc Realiza análise preditiva
 * @access Private
 * @body {
 *   predictionType?: string, // Tipo de predição (padrão: usage_trend)
 *   timeframe?: string,      // Período de análise (padrão: 30d)
 *   parameters?: object      // Parâmetros adicionais (opcional)
 * }
 */
router.post('/predict',
  insightRateLimit,
  (req, res, next) => {
    const { predictionType, timeframe, parameters } = req.body;
    
    // Validação do predictionType
    if (predictionType) {
      const validTypes = ['usage_trend', 'performance_forecast', 'user_behavior', 'system_load'];
      if (!validTypes.includes(predictionType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de predição inválido',
          validTypes
        });
      }
    }
    
    // Validação do timeframe
    if (timeframe) {
      const validTimeframes = ['7d', '30d', '90d', '1y'];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          error: 'Período inválido',
          validTimeframes
        });
      }
    }
    
    // Validação dos parâmetros
    if (parameters && typeof parameters !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros devem ser um objeto'
      });
    }
    
    next();
  },
  conversationController.predictiveAnalysis
);

/**
 * @route GET /conversation/insights
 * @desc Obtém insights do usuário
 * @access Private
 * @query {
 *   page?: number,           // Página (padrão: 1)
 *   limit?: number,          // Itens por página (padrão: 10, máx: 50)
 *   insightType?: string,    // Filtro por tipo
 *   confidenceLevel?: string, // Filtro por nível de confiança
 *   startDate?: string,      // Data início (ISO)
 *   endDate?: string         // Data fim (ISO)
 * }
 */
router.get('/insights',
  (req, res, next) => {
    const { limit, insightType, confidenceLevel } = req.query;
    
    // Validação do limit
    if (limit && (isNaN(limit) || parseInt(limit) > 50)) {
      return res.status(400).json({
        success: false,
        error: 'Limite máximo de 50 itens por página'
      });
    }
    
    // Validação do insightType
    if (insightType) {
      const validTypes = ['trend_analysis', 'recommendation', 'pattern_detection', 'prediction'];
      if (!validTypes.includes(insightType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de insight inválido',
          validTypes
        });
      }
    }
    
    // Validação do confidenceLevel
    if (confidenceLevel) {
      const validLevels = ['high', 'medium', 'low'];
      if (!validLevels.includes(confidenceLevel)) {
        return res.status(400).json({
          success: false,
          error: 'Nível de confiança inválido',
          validLevels
        });
      }
    }
    
    next();
  },
  conversationController.getUserInsights
);

/**
 * @route PUT /conversation/insights/:insightId/status
 * @desc Atualiza status de um insight
 * @access Private
 * @param insightId - ID do insight
 * @body {
 *   status: string           // Novo status (active, archived, dismissed)
 * }
 */
router.put('/insights/:insightId/status',
  (req, res, next) => {
    const { insightId } = req.params;
    const { status } = req.body;
    
    if (!insightId || isNaN(insightId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do insight inválido'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status é obrigatório'
      });
    }
    
    const validStatuses = ['active', 'archived', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validStatuses
      });
    }
    
    next();
  },
  conversationController.updateInsightStatus
);

/**
 * @route GET /conversation/sessions
 * @desc Lista sessões ativas do usuário
 * @access Private
 * @query {
 *   status?: string          // Status das sessões (padrão: active)
 * }
 */
router.get('/sessions',
  (req, res, next) => {
    const { status } = req.query;
    
    if (status) {
      const validStatuses = ['active', 'completed', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido',
          validStatuses
        });
      }
    }
    
    next();
  },
  conversationController.getActiveSessions
);

/**
 * @route GET /conversation/:sessionId/history
 * @desc Obtém histórico de uma conversa
 * @access Private
 * @param sessionId - ID da sessão
 * @query {
 *   limit?: number           // Limite de mensagens (padrão: 50, máx: 100)
 * }
 */
router.get('/:sessionId/history',
  validateSessionId,
  (req, res, next) => {
    const { limit } = req.query;
    
    if (limit && (isNaN(limit) || parseInt(limit) > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Limite máximo de 100 mensagens'
      });
    }
    
    next();
  },
  conversationController.getConversationHistory
);

/**
 * @route PUT /conversation/:sessionId/end
 * @desc Encerra uma sessão de conversa
 * @access Private
 * @param sessionId - ID da sessão
 */
router.put('/:sessionId/end',
  validateSessionId,
  conversationController.endSession
);

// Middleware de tratamento de erros específico para rotas de conversa
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de conversa:', error);
  
  // Erros de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: error.details?.map(d => d.message) || [error.message]
    });
  }
  
  // Erros de rate limiting
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Muitas requisições',
      retryAfter: error.retryAfter
    });
  }
  
  // Erros de timeout da IA
  if (error.code === 'AI_TIMEOUT') {
    return res.status(503).json({
      success: false,
      error: 'Serviço de IA indisponível',
      message: 'Tente novamente em alguns instantes'
    });
  }
  
  // Erros de quota da API
  if (error.code === 'QUOTA_EXCEEDED') {
    return res.status(429).json({
      success: false,
      error: 'Quota da API excedida',
      message: 'Limite de uso da IA atingido'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

module.exports = router;
