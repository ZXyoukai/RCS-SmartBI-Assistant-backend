const ConversationService = require('../services/conversationService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const conversationService = new ConversationService();

class ConversationController {
  /**
   * Inicia uma nova sessão de conversa
   */
  async startSession(req, res) {
    try {
      const userId = req.user.id;
      const { contextData = {}, sessionType = 'general' } = req.body;

      const enrichedContext = {
        ...contextData,
        sessionType,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        startTime: new Date().toISOString()
      };

      const result = await conversationService.startChatSession(userId, enrichedContext);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        data: {
          sessionId: result.sessionId,
          sessionToken: result.sessionToken,
          message: 'Sessão de conversa iniciada com sucesso!',
          instructions: 'Você pode fazer perguntas sobre dados, solicitar conversões NL-to-SQL, ou pedir insights e análises.'
        }
      });

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processa uma mensagem na conversa
   */
  async sendMessage(req, res) {
    try {
      const { sessionId, message, language = 'pt-BR' } = req.body;
      const userId = req.user.id;

      // Validações
      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          error: 'sessionId e message são obrigatórios'
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
          error: 'Mensagem muito longa (máximo 2000 caracteres)'
        });
      }

      // Verifica se a sessão pertence ao usuário
      const session = await prisma.ai_chat_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada ou inativa'
        });
      }

      // Processa a conversa
      const result = await conversationService.processConversation(sessionId, message, userId);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Atualiza timestamp da sessão
      await prisma.ai_chat_sessions.update({
        where: { id: sessionId },
        data: { updated_at: new Date() }
      });

      res.json({
        success: true,
        data: {
          response: result.response,
          interactionType: result.interactionType,
          confidence: result.confidence,
          suggestions: result.suggestions,
          insights: result.insights,
          executionTime: result.executionTime,
          interactionId: result.interactionId,
          sessionId,
          metadata: {
            messageLength: message.length,
            responseLength: result.response.length,
            language
          }
        }
      });

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera insights para o usuário
   */
  async generateInsights(req, res) {
    try {
      const userId = req.user.id;
      const { 
        analysisType = 'general',
        parameters = {},
        sessionId 
      } = req.body;

      const validAnalysisTypes = [
        'general', 'trend_analysis', 'performance', 
        'usage_patterns', 'recommendations'
      ];

      if (!validAnalysisTypes.includes(analysisType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de análise inválido',
          validTypes: validAnalysisTypes
        });
      }

      // Se há sessionId, usar para contexto
      let interactionId = null;
      if (sessionId) {
        const session = await prisma.ai_chat_sessions.findFirst({
          where: {
            id: sessionId,
            user_id: userId
          }
        });

        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Sessão não encontrada'
          });
        }
      }

      const result = await conversationService.generateInsights(
        interactionId, 
        userId, 
        analysisType, 
        parameters
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        data: {
          insights: result.insights,
          analysisType,
          executionTime: result.executionTime,
          generatedAt: new Date().toISOString(),
          parameters
        }
      });

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Realiza análise preditiva
   */
  async predictiveAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const { 
        predictionType = 'usage_trend',
        timeframe = '30d',
        parameters = {}
      } = req.body;

      const validPredictionTypes = [
        'usage_trend', 'performance_forecast', 
        'user_behavior', 'system_load'
      ];

      if (!validPredictionTypes.includes(predictionType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de predição inválido',
          validTypes: validPredictionTypes
        });
      }

      const enrichedParameters = {
        ...parameters,
        timeframe,
        userId,
        requestTime: new Date().toISOString()
      };

      const result = await conversationService.generatePredictiveAnalysis(
        userId, 
        predictionType, 
        enrichedParameters
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        data: {
          prediction: result.prediction,
          confidence: result.confidence,
          reasoning: result.reasoning,
          recommendations: result.recommendations,
          predictionType,
          timeframe,
          executionTime: result.executionTime,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Erro na análise preditiva:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém insights do usuário
   */
  async getUserInsights(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 10, 
        insightType, 
        confidenceLevel,
        startDate,
        endDate 
      } = req.query;

      const skip = (page - 1) * limit;
      const where = { user_id: userId };

      // Filtros opcionais
      if (insightType) {
        where.insight_type = insightType;
      }

      if (confidenceLevel) {
        where.confidence_level = confidenceLevel;
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
      }

      // Busca insights
      const [insights, total] = await Promise.all([
        prisma.ai_insights.findMany({
          where,
          include: {
            interaction: {
              select: {
                interaction_type: true,
                input_text: true,
                created_at: true
              }
            }
          },
          orderBy: [
            { impact_score: 'desc' },
            { created_at: 'desc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.ai_insights.count({ where })
      ]);

      // Estatísticas dos insights
      const stats = await prisma.ai_insights.groupBy({
        by: ['insight_type', 'confidence_level'],
        where: { user_id: userId },
        _count: true,
        _avg: { impact_score: true }
      });

      res.json({
        success: true,
        data: {
          insights: insights.map(insight => ({
            id: insight.id,
            type: insight.insight_type,
            title: insight.title,
            description: insight.description,
            confidenceLevel: insight.confidence_level,
            impactScore: insight.impact_score,
            status: insight.status,
            createdAt: insight.created_at,
            interaction: insight.interaction
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          stats: {
            byType: stats.reduce((acc, stat) => {
              if (!acc[stat.insight_type]) {
                acc[stat.insight_type] = {
                  count: 0,
                  avgImpact: 0,
                  byConfidence: {}
                };
              }
              acc[stat.insight_type].count += stat._count;
              acc[stat.insight_type].avgImpact = Number(stat._avg.impact_score?.toFixed(2) || 0);
              acc[stat.insight_type].byConfidence[stat.confidence_level] = stat._count;
              return acc;
            }, {})
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém histórico de conversas
   */
  async getConversationHistory(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;

      // Verifica se a sessão pertence ao usuário
      const session = await prisma.ai_chat_sessions.findFirst({
        where: {
          id: parseInt(sessionId),
          user_id: userId
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }

      // Busca histórico da conversa
      const interactions = await prisma.ai_interactions.findMany({
        where: { session_id: parseInt(sessionId) },
        orderBy: { created_at: 'asc' },
        take: parseInt(limit),
        select: {
          id: true,
          interaction_type: true,
          input_text: true,
          ai_response: true,
          execution_status: true,
          confidence_score: true,
          execution_time_ms: true,
          fallback_used: true,
          created_at: true
        }
      });

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            token: session.session_token,
            status: session.status,
            contextData: session.context_data,
            createdAt: session.created_at,
            updatedAt: session.updated_at
          },
          interactions: interactions.map(interaction => ({
            id: interaction.id,
            type: interaction.interaction_type,
            userMessage: interaction.input_text,
            aiResponse: interaction.ai_response?.response || 'Resposta não disponível',
            status: interaction.execution_status,
            confidence: interaction.confidence_score,
            executionTime: interaction.execution_time_ms,
            fallbackUsed: interaction.fallback_used,
            timestamp: interaction.created_at
          })),
          totalInteractions: interactions.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar histórico da conversa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista sessões ativas do usuário
   */
  async getActiveSessions(req, res) {
    try {
      const userId = req.user.id;
      const { status = 'active' } = req.query;

      const sessions = await prisma.ai_chat_sessions.findMany({
        where: {
          user_id: userId,
          status
        },
        include: {
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        take: 20
      });

      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            id: session.id,
            token: session.session_token,
            status: session.status,
            contextData: session.context_data,
            interactionCount: session._count.interactions,
            createdAt: session.created_at,
            updatedAt: session.updated_at
          }))
        }
      });

    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Encerra uma sessão de conversa
   */
  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Verifica se a sessão pertence ao usuário
      const session = await prisma.ai_chat_sessions.findFirst({
        where: {
          id: parseInt(sessionId),
          user_id: userId
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }

      // Atualiza status da sessão
      await prisma.ai_chat_sessions.update({
        where: { id: parseInt(sessionId) },
        data: { 
          status: 'completed',
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          message: 'Sessão encerrada com sucesso',
          sessionId: parseInt(sessionId)
        }
      });

    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza status de um insight
   */
  async updateInsightStatus(req, res) {
    try {
      const { insightId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const validStatuses = ['active', 'archived', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido',
          validStatuses
        });
      }

      // Verifica se o insight pertence ao usuário
      const insight = await prisma.ai_insights.findFirst({
        where: {
          id: parseInt(insightId),
          user_id: userId
        }
      });

      if (!insight) {
        return res.status(404).json({
          success: false,
          error: 'Insight não encontrado'
        });
      }

      // Atualiza status
      const updatedInsight = await prisma.ai_insights.update({
        where: { id: parseInt(insightId) },
        data: { status }
      });

      res.json({
        success: true,
        data: {
          id: updatedInsight.id,
          status: updatedInsight.status,
          message: `Status do insight atualizado para ${status}`
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar insight:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new ConversationController();
