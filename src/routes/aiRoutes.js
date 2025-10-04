const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting específico para IA - mais restritivo
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela de tempo
  message: {
    success: false,
    error: 'Muitas requisições para IA. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para conversões - mais restritivo ainda
const conversionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // máximo 5 conversões por minuto
  message: {
    success: false,
    error: 'Limite de conversões excedido. Aguarde 1 minuto.',
    retryAfter: '1 minute'
  }
});

// Middleware para validação de entrada
const validateNL2SQLInput = (req, res, next) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Campo "query" é obrigatório e deve ser uma string'
    });
  }
  
  if (query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Consulta não pode estar vazia'
    });
  }
  
  if (query.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Consulta muito longa. Máximo 1000 caracteres.'
    });
  }
  
  next();
};

const validateSQL2NLInput = (req, res, next) => {
  const { sqlQuery } = req.body;
  
  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Campo "sqlQuery" é obrigatório e deve ser uma string'
    });
  }
  
  if (sqlQuery.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Consulta SQL não pode estar vazia'
    });
  }
  
  next();
};

// Aplicar middleware de autenticação e rate limiting em todas as rotas
router.use(authMiddleware);
router.use(aiRateLimit);

/**
 * @route POST /ai/nl2sql
 * @desc Converte linguagem natural para SQL
 * @access Private
 * @body {
 *   query: string,           // Consulta em linguagem natural (obrigatório)
 *   sessionId?: number,      // ID da sessão (opcional)
 *   language?: string        // Idioma (opcional, padrão: pt-BR)
 * }
 */
router.post('/nl2sql', 
  conversionRateLimit,
  validateNL2SQLInput,
  aiController.convertNLToSQL
);

/**
 * @route POST /ai/sql2nl
 * @desc Converte SQL para linguagem natural
 * @access Private
 * @body {
 *   sqlQuery: string,        // Consulta SQL (obrigatório)
 *   sessionId?: number,      // ID da sessão (opcional)
 *   language?: string        // Idioma (opcional, padrão: pt-BR)
 * }
 */
router.post('/sql2nl',
  conversionRateLimit,
  validateSQL2NLInput,
  aiController.convertSQLToNL
);

/**
 * @route POST /ai/generate-mermaid
 * @desc Gera visualização Mermaid otimizada a partir de dados
 * @access Private
 * @body {
 *   queryData: object,       // Dados da consulta com rows e columns (obrigatório)
 *   sessionId?: number,      // ID da sessão (opcional)
 *   databaseId?: number      // ID do banco de dados (opcional)
 * }
 */
router.post('/generate-mermaid',
  conversionRateLimit,
  (req, res, next) => {
    const { queryData } = req.body;
    
    if (!queryData) {
      return res.status(400).json({
        success: false,
        error: 'queryData é obrigatório'
      });
    }

    if (!queryData.rows || !Array.isArray(queryData.rows)) {
      return res.status(400).json({
        success: false,
        error: 'queryData.rows deve ser um array'
      });
    }

    if (!queryData.columns || !Array.isArray(queryData.columns)) {
      return res.status(400).json({
        success: false,
        error: 'queryData.columns deve ser um array'
      });
    }

    next();
  },
  aiController.generateMermaidVisualization
);

router.get('/iaIterations/:id', aiController.getAIInteractions);
router.get('/iaIterations/', aiController.getAllAIInteractions);
/**
 * @route POST /ai/validate-sql
 * @desc Valida uma consulta SQL
 * @access Private
 * @body {
 *   sqlQuery: string         // Consulta SQL para validar
 * }
 */
router.post('/validate-sql',
  validateSQL2NLInput,
  aiController.validateSQL
);


/**
 * @route GET /ai/history
 * @desc Obtém histórico de interações com IA
 * @access Private
 * @query {
 *   page?: number,           // Página (padrão: 1)
 *   limit?: number,          // Itens por página (padrão: 20, máx: 100)
 *   interactionType?: string, // Filtro por tipo
 *   sessionId?: number,      // Filtro por sessão
 *   startDate?: string,      // Data início (ISO)
 *   endDate?: string         // Data fim (ISO)
 * }
 */
router.get('/history', (req, res, next) => {
  // Validação de parâmetros de query
  const { limit } = req.query;
  if (limit && (isNaN(limit) || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Limite máximo de 100 itens por página'
    });
  }
  next();
}, aiController.getInteractionHistory);

/**
 * @route GET /ai/metrics
 * @desc Obtém métricas de performance da IA
 * @access Private
 * @query {
 *   period?: string          // Período: 7d, 30d, 90d, 1y (padrão: 30d)
 * }
 */
router.get('/metrics', (req, res, next) => {
  const { period } = req.query;
  const validPeriods = ['7d', '30d', '90d', '1y'];
  
  if (period && !validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      error: 'Período inválido',
      validPeriods
    });
  }
  next();
}, aiController.getAIMetrics);

/**
 * @route DELETE /ai/cache
 * @desc Limpa cache de respostas da IA
 * @access Private (Admin para limpeza completa)
 * @body {
 *   type?: string            // Tipo: expired (padrão) ou all (apenas admin)
 * }
 */
router.delete('/cache', (req, res, next) => {
  const { type = 'expired' } = req.body;
  const validTypes = ['expired', 'all'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo inválido',
      validTypes
    });
  }
  
  // Verificação adicional para tipo 'all'
  if (type === 'all' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Apenas administradores podem limpar todo o cache'
    });
  }
  
  next();
}, aiController.clearCache);

// =====================================================
// ROTAS DE FAVORITOS - Gestão de interações favoritas
// =====================================================

/**
 * @route   PUT /api/ai/favorites/:interactionId
 * @desc    Marca/desmarca uma interação como favorita
 * @access  Private
 * @params  interactionId - ID da interação de IA
 */
router.put('/favorites/:interactionId', (req, res, next) => {
  // Validação básica do ID
  const interactionId = parseInt(req.params.interactionId);
  if (isNaN(interactionId)) {
    return res.status(400).json({
      success: false,
      error: 'ID da interação deve ser um número válido'
    });
  }
  next();
}, aiController.toggleFavoriteInteraction);

/**
 * @route   GET /api/ai/favorites
 * @desc    Lista todas as interações favoritas do usuário
 * @access  Private
 * @query   page, limit, interactionType, sortBy, sortOrder
 */
router.get('/favorites', (req, res, next) => {
  // Validação dos parâmetros de paginação
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros de paginação inválidos (page >= 1, limit 1-100)'
    });
  }
  
  req.query.page = page;
  req.query.limit = limit;
  next();
}, aiController.getFavoriteInteractions);

/**
 * @route   DELETE /api/ai/favorites
 * @desc    Remove múltiplas interações dos favoritos
 * @access  Private
 * @body    { interactionIds: [1, 2, 3] }
 */
router.delete('/favorites', (req, res, next) => {
  const { interactionIds } = req.body;
  
  if (!Array.isArray(interactionIds) || interactionIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Lista de IDs das interações é obrigatória'
    });
  }
  
  // Valida se todos os IDs são números
  const invalidIds = interactionIds.filter(id => isNaN(parseInt(id)));
  if (invalidIds.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Todos os IDs devem ser números válidos'
    });
  }
  
  next();
}, aiController.removeFavorites);

/**
 * @route   GET /api/ai/favorites/stats
 * @desc    Obtém estatísticas das interações favoritas
 * @access  Private
 */
router.get('/favorites/stats', aiController.getFavoriteStats);

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

// Middleware de tratamento de erros específico para rotas de IA
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de IA:', error);
  
  // Erros de validação do Joi (se estiver sendo usado)
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
  
  // Erros de banco de dados
  if (error.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({
      success: false,
      error: 'Conflito de dados'
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
