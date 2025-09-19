const Joi = require('joi');

// Schemas de validação para diferentes tipos de requisição

const nl2sqlSchema = Joi.object({
  query: Joi.string()
    .required()
    .min(3)
    .max(1000)
    .trim()
    .messages({
      'string.base': 'Consulta deve ser uma string',
      'string.empty': 'Consulta não pode estar vazia',
      'string.min': 'Consulta deve ter pelo menos 3 caracteres',
      'string.max': 'Consulta não pode ter mais de 1000 caracteres',
      'any.required': 'Consulta é obrigatória'
    }),
  sessionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'sessionId deve ser um número',
      'number.integer': 'sessionId deve ser um número inteiro',
      'number.positive': 'sessionId deve ser positivo'
    }),
  language: Joi.string()
    .valid('pt-BR', 'en-US', 'es-ES')
    .default('pt-BR')
    .optional()
    .messages({
      'any.only': 'Idioma deve ser pt-BR, en-US ou es-ES'
    })
});

const sql2nlSchema = Joi.object({
  sqlQuery: Joi.string()
    .required()
    .min(10)
    .max(5000)
    .trim()
    .pattern(/\b(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i)
    .messages({
      'string.base': 'Consulta SQL deve ser uma string',
      'string.empty': 'Consulta SQL não pode estar vazia',
      'string.min': 'Consulta SQL deve ter pelo menos 10 caracteres',
      'string.max': 'Consulta SQL não pode ter mais de 5000 caracteres',
      'string.pattern.base': 'Consulta SQL deve conter comandos válidos',
      'any.required': 'Consulta SQL é obrigatória'
    }),
  sessionId: Joi.number()
    .integer()
    .positive()
    .optional(),
  language: Joi.string()
    .valid('pt-BR', 'en-US', 'es-ES')
    .default('pt-BR')
    .optional()
});

const conversationMessageSchema = Joi.object({
  sessionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'sessionId deve ser um número',
      'number.integer': 'sessionId deve ser um número inteiro',
      'number.positive': 'sessionId deve ser positivo',
      'any.required': 'sessionId é obrigatório'
    }),
  message: Joi.string()
    .required()
    .min(1)
    .max(2000)
    .trim()
    .messages({
      'string.base': 'Mensagem deve ser uma string',
      'string.empty': 'Mensagem não pode estar vazia',
      'string.min': 'Mensagem deve ter pelo menos 1 caractere',
      'string.max': 'Mensagem não pode ter mais de 2000 caracteres',
      'any.required': 'Mensagem é obrigatória'
    }),
  language: Joi.string()
    .valid('pt-BR', 'en-US', 'es-ES')
    .default('pt-BR')
    .optional()
});

const startSessionSchema = Joi.object({
  contextData: Joi.object()
    .optional()
    .default({}),
  sessionType: Joi.string()
    .valid('general', 'nl2sql', 'analytics', 'insights')
    .default('general')
    .optional()
    .messages({
      'any.only': 'Tipo de sessão deve ser: general, nl2sql, analytics ou insights'
    })
});

const insightsSchema = Joi.object({
  analysisType: Joi.string()
    .valid('general', 'trend_analysis', 'performance', 'usage_patterns', 'recommendations')
    .default('general')
    .optional()
    .messages({
      'any.only': 'Tipo de análise inválido'
    }),
  parameters: Joi.object()
    .optional()
    .default({}),
  sessionId: Joi.number()
    .integer()
    .positive()
    .optional()
});

const predictiveAnalysisSchema = Joi.object({
  predictionType: Joi.string()
    .valid('usage_trend', 'performance_forecast', 'user_behavior', 'system_load')
    .default('usage_trend')
    .optional()
    .messages({
      'any.only': 'Tipo de predição inválido'
    }),
  timeframe: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d')
    .optional()
    .messages({
      'any.only': 'Período deve ser: 7d, 30d, 90d ou 1y'
    }),
  parameters: Joi.object()
    .optional()
    .default({})
});

// Middleware de validação genérico
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: errorDetails
      });
    }

    // Substitui req.body pelos dados validados e transformados
    req.body = value;
    next();
  };
};

// Middleware de validação para parâmetros de query
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Parâmetros de consulta inválidos',
        details: errorDetails
      });
    }

    req.query = value;
    next();
  };
};

// Schema para parâmetros de paginação
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'confidence_score', 'execution_time')
    .default('created_at')
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

// Schema para filtros de data
const dateFilterSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'startDate deve estar no formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)'
    }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'endDate deve estar no formato ISO',
      'date.min': 'endDate deve ser posterior a startDate'
    })
});

// Middleware de sanitização para prevenir ataques
const sanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove caracteres perigosos
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitiza body, query e params
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// Middleware de validação específica para SQL
const validateSQLSecurity = (req, res, next) => {
  const { sqlQuery } = req.body;
  
  if (!sqlQuery) return next();

  // Lista de comandos perigosos
  const dangerousCommands = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
    'EXEC', 'EXECUTE', 'SP_', 'XP_', 'BULK', 'OPENROWSET', 'OPENQUERY'
  ];

  const upperSQL = sqlQuery.toUpperCase();
  const hasDangerousCommand = dangerousCommands.some(cmd => upperSQL.includes(cmd));

  if (hasDangerousCommand) {
    return res.status(403).json({
      success: false,
      error: 'Consulta SQL contém comandos não permitidos',
      message: 'Apenas consultas SELECT são permitidas para garantir a segurança dos dados'
    });
  }

  // Verifica por padrões de SQL Injection
  const sqlInjectionPatterns = [
    /(\s|^)(union|and|or)\s+select/i,
    /(\s|^)select\s+.+\s+from\s+.+\s+where\s+.+\s+(and|or)\s+.+=/i,
    /'(\s)*(or|and)(\s)*'/i,
    /(\s|^)(exec|execute)(\s)+/i
  ];

  const hasSQLInjection = sqlInjectionPatterns.some(pattern => pattern.test(sqlQuery));

  if (hasSQLInjection) {
    return res.status(403).json({
      success: false,
      error: 'Consulta SQL suspeita detectada',
      message: 'A consulta foi bloqueada por medidas de segurança'
    });
  }

  next();
};

// Middleware de logging para requisições de IA
const logAIRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // Log da requisição
  console.log(`[AI REQUEST] ${new Date().toISOString()} - ${req.method} ${req.path}`, {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? { ...req.body, query: req.body.query?.substring(0, 100) + '...' } : undefined
  });

  // Override do res.json para logar a resposta
  const originalJson = res.json;
  res.json = function(data) {
    const executionTime = Date.now() - startTime;
    
    console.log(`[AI RESPONSE] ${new Date().toISOString()} - ${req.method} ${req.path}`, {
      userId: req.user?.id,
      status: res.statusCode,
      executionTime,
      success: data.success,
      error: data.error
    });

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  // Validadores específicos
  validateNL2SQL: validate(nl2sqlSchema),
  validateSQL2NL: validate(sql2nlSchema),
  validateConversationMessage: validate(conversationMessageSchema),
  validateStartSession: validate(startSessionSchema),
  validateInsights: validate(insightsSchema),
  validatePredictiveAnalysis: validate(predictiveAnalysisSchema),
  
  // Validadores de query params
  validatePagination: validateQueryParams(paginationSchema.concat(dateFilterSchema)),
  
  // Middlewares utilitários
  sanitize,
  validateSQLSecurity,
  logAIRequest,
  
  // Função validate genérica
  validate,
  validateQueryParams
};
