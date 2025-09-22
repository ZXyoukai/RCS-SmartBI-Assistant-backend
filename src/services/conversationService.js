const AIService = require('./aiService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ConversationService extends AIService {
  constructor() {
    super();
  }

  /**
   * Inicia uma nova sessão de chat
   * @param {number} userId - ID do usuário
   * @param {Object} contextData - Dados de contexto inicial
   * @returns {Object} Dados da sessão criada
   */
  async startChatSession(userId, contextData = {}) {
    try {
      const sessionToken = this.generateSessionToken();
      
      const session = await prisma.ai_chat_sessions.create({
        data: {
          user_id: userId,
          session_token: sessionToken,
          status: 'active',
          context_data: contextData
        }
      });

      return {
        success: true,
        sessionId: session.id,
        sessionToken: session.session_token,
        message: 'Sessão de chat iniciada com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao iniciar sessão de chat:', error);
      return {
        success: false,
        error: 'Erro ao iniciar sessão de chat',
        details: error.message
      };
    }
  }

  /**
   * Processa uma conversa com IA
   * @param {number} sessionId - ID da sessão
   * @param {string} userMessage - Mensagem do usuário
   * @param {number} userId - ID do usuário
   * @returns {Object} Resposta da conversa
   */
  async processConversation(sessionId, userMessage, userId) {
    try {
      // Verifica se a sessão está ativa
      const session = await prisma.ai_chat_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!session || session.status !== 'active') {
        return {
          success: false,
          error: 'Sessão inválida ou expirada'
        };
      }

      // Constrói contexto da conversa
      const conversationContext = await this.buildConversationContext(sessionId);
      
      // Determina o tipo de interação baseado no conteúdo
      const interactionType = this.determineInteractionType(userMessage);
      
      // Constrói prompt baseado no tipo
      const prompt = this.buildConversationPrompt(userMessage, conversationContext, interactionType);

      // Chama IA
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'conversation',
        userId,
        sessionId
      });

      if (!aiResponse.success) {
        return this.handleConversationError(aiResponse, userMessage, userId, sessionId);
      }

      // Processa resposta
      const processedResponse = this.processConversationResponse(aiResponse.response, interactionType);
      const confidenceScore = this.calculateConversationConfidence(processedResponse, userMessage);

      // Salva interação no banco
      const interaction = await this.saveInteraction({
        sessionId,
        userId,
        inputText: userMessage,
        interactionType,
        aiResponse,
        confidenceScore,
        executionTime: aiResponse.executionTime
      });

      // Gera insights se aplicável
      if (this.shouldGenerateInsights(interactionType, processedResponse)) {
        await this.generateInsights(interaction.id, userId, processedResponse);
      }

      return {
        success: true,
        response: processedResponse.content,
        confidence: confidenceScore,
        interactionType,
        suggestions: processedResponse.suggestions || [],
        insights: processedResponse.insights || [],
        executionTime: aiResponse.executionTime,
        interactionId: interaction.id
      };

    } catch (error) {
      console.error('Erro no processamento da conversa:', error);
      return this.handleConversationError({ error: error.message }, userMessage, userId, sessionId);
    }
  }

  /**
   * Gera insights baseados nos dados do usuário
   * @param {number} userId - ID do usuário
   * @param {string} analysisType - Tipo de análise
   * @param {Object} parameters - Parâmetros da análise
   * @returns {Object} Insights gerados
   */
  async generateInsights(interactionId, userId, analysisType = 'general', parameters = {}) {
    try {
      // Busca dados históricos do usuário
      const userData = await this.getUserAnalyticsData(userId);
      
      // Constrói prompt para insights
      const prompt = this.buildInsightsPrompt(userData, analysisType, parameters);
      
      // Chama IA para análise
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'insight_generation',
        userId,
        analysisType
      });

      if (!aiResponse.success) {
        return { success: false, error: 'Erro ao gerar insights' };
      }

      // Processa insights
      const insights = this.parseInsightsResponse(aiResponse.response);
      
      // Salva insights no banco
      const savedInsights = await Promise.all(
        insights.map(insight => this.saveInsight({
          interactionId,
          userId,
          ...insight
        }))
      );

      return {
        success: true,
        insights: savedInsights,
        executionTime: aiResponse.executionTime
      };

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return {
        success: false,
        error: 'Erro ao gerar insights',
        details: error.message
      };
    }
  }

  /**
   * Realiza análise preditiva
   * @param {number} userId - ID do usuário
   * @param {string} predictionType - Tipo de predição
   * @param {Object} parameters - Parâmetros da predição
   * @returns {Object} Análise preditiva
   */
  async generatePredictiveAnalysis(userId, predictionType, parameters = {}) {
    try {
      // Busca dados históricos relevantes
      const historicalData = await this.getHistoricalDataForPrediction(userId, predictionType);
      
      // Constrói prompt para análise preditiva
      const prompt = this.buildPredictivePrompt(historicalData, predictionType, parameters);
      
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'predictive_analysis',
        userId,
        predictionType
      });

      if (!aiResponse.success) {
        return { success: false, error: 'Erro na análise preditiva' };
      }

      const analysis = this.parsePredictiveResponse(aiResponse.response);
      
      return {
        success: true,
        prediction: analysis.prediction,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        recommendations: analysis.recommendations,
        executionTime: aiResponse.executionTime
      };

    } catch (error) {
      console.error('Erro na análise preditiva:', error);
      return {
        success: false,
        error: 'Erro na análise preditiva',
        details: error.message
      };
    }
  }

  /**
   * Determina o tipo de interação baseado na mensagem
   * @param {string} message - Mensagem do usuário
   * @returns {string} Tipo de interação
   */
  determineInteractionType(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sql') || lowerMessage.includes('consulta') || lowerMessage.includes('select')) {
      return 'nl2sql_conversation';
    }
    
    if (lowerMessage.includes('insight') || lowerMessage.includes('análise') || lowerMessage.includes('tendência')) {
      return 'insight_request';
    }
    
    if (lowerMessage.includes('previsão') || lowerMessage.includes('predição') || lowerMessage.includes('futuro')) {
      return 'prediction_request';
    }
    
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('como') || lowerMessage.includes('explicar')) {
      return 'help_request';
    }
    
    return 'general_conversation';
  }

  /**
   * Constrói prompt para conversação
   * @param {string} message - Mensagem do usuário
   * @param {string} context - Contexto da conversa
   * @param {string} type - Tipo de interação
   * @returns {string} Prompt formatado
   */
  buildConversationPrompt(message, context, type) {
    const basePrompt = `
Você é um assistente especializado em Business Intelligence e análise de dados.

${context}

Baseado no tipo de interação: ${type}

INSTRUÇÕES:
1. Responda de forma clara e útil
2. Se for sobre SQL, oriente o usuário sobre como formular a consulta
3. Se for sobre insights, ofereça análises relevantes
4. Se for sobre predições, seja cauteloso e explique limitações
5. Mantenha tom profissional mas amigável
6. Sugira próximos passos quando apropriado

MENSAGEM DO USUÁRIO: "${message}"

RESPOSTA:`;

    return basePrompt;
  }

  /**
   * Constrói prompt para geração de insights
   * @param {Object} userData - Dados do usuário
   * @param {string} analysisType - Tipo de análise
   * @param {Object} parameters - Parâmetros
   * @returns {string} Prompt formatado
   */
  buildInsightsPrompt(userData, analysisType, parameters) {
    return `
Você é um especialista em análise de dados e Business Intelligence.

DADOS DO USUÁRIO:
- Total de consultas: ${userData.totalQueries}
- Consultas bem-sucedidas: ${userData.successfulQueries}
- Taxa de sucesso: ${userData.successRate}%
- Tempo médio de execução: ${userData.avgExecutionTime}ms
- Tipos de consulta mais comuns: ${userData.commonQueryTypes.join(', ')}
- Atividade nos últimos 30 dias: ${userData.recentActivity}

TIPO DE ANÁLISE: ${analysisType}

INSTRUÇÕES:
1. Analise os padrões nos dados
2. Identifique tendências e oportunidades de melhoria
3. Forneça recomendações acionáveis
4. Classifique insights por impacto (alto, médio, baixo)
5. Retorne no formato JSON:
{
  "insights": [
    {
      "type": "trend_analysis|recommendation|pattern_detection",
      "title": "Título do insight",
      "description": "Descrição detalhada",
      "impact_score": 0.8,
      "confidence_level": "high|medium|low",
      "recommendations": ["rec1", "rec2"]
    }
  ]
}

ANÁLISE:`;
  }

  /**
   * Processa resposta da conversa
   * @param {string} response - Resposta da IA
   * @param {string} type - Tipo de interação
   * @returns {Object} Resposta processada
   */
  processConversationResponse(response, type) {
    return {
      content: response.trim(),
      type,
      suggestions: this.extractSuggestions(response),
      insights: this.extractInsights(response)
    };
  }

  /**
   * Extrai sugestões da resposta
   * @param {string} response - Resposta da IA
   * @returns {Array} Lista de sugestões
   */
  extractSuggestions(response) {
    const suggestions = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Sugestão:') || line.includes('Recomendo:') || line.includes('Tente:')) {
        suggestions.push(line.replace(/^.*?(Sugestão:|Recomendo:|Tente:)\s*/i, '').trim());
      }
    });
    
    return suggestions;
  }

  /**
   * Extrai insights da resposta
   * @param {string} response - Resposta da IA
   * @returns {Array} Lista de insights
   */
  extractInsights(response) {
    const insights = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Insight:') || line.includes('Observação:')) {
        insights.push(line.replace(/^.*?(Insight:|Observação:)\s*/i, '').trim());
      }
    });
    
    return insights;
  }

  /**
   * Calcula confiança da conversa
   * @param {Object} response - Resposta processada
   * @param {string} originalMessage - Mensagem original
   * @returns {number} Score de confiança
   */
  calculateConversationConfidence(response, originalMessage) {
    let confidence = 0.6; // Base
    
    if (response.content.length > 50) confidence += 0.1;
    if (response.suggestions.length > 0) confidence += 0.1;
    if (response.insights.length > 0) confidence += 0.1;
    if (!response.content.includes('desculpe') && !response.content.includes('não sei')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Salva interação no banco
   * @param {Object} data - Dados da interação
   * @returns {Object} Interação salva
   */
  async saveInteraction(data) {
    return await prisma.ai_interactions.create({
      data: {
        session_id: data.sessionId,
        user_id: data.userId,
        interaction_type: data.interactionType,
        input_text: data.inputText,
        ai_response: data.aiResponse,
        execution_status: data.aiResponse.success ? 'success' : 'error',
        execution_time_ms: data.executionTime,
        confidence_score: data.confidenceScore,
        version: '1.0'
      }
    });
  }

  /**
   * Salva insight no banco
   * @param {Object} data - Dados do insight
   * @returns {Object} Insight salvo
   */
  async saveInsight(data) {
    return await prisma.ai_insights.create({
      data: {
        interaction_id: data.interactionId,
        user_id: data.userId,
        insight_type: data.type,
        title: data.title,
        description: data.description,
        data_analysis: data.data_analysis || {},
        confidence_level: data.confidence_level,
        impact_score: data.impact_score
      }
    });
  }

  /**
   * Gera token único para sessão
   * @returns {string} Token da sessão
   */
  generateSessionToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `chat_${timestamp}_${random}`;
  }

  /**
   * Busca dados analytics do usuário
   * @param {number} userId - ID do usuário
   * @returns {Object} Dados analytics
   */
  async getUserAnalyticsData(userId) {
    try {
      const [totalQueries, successfulQueries, avgExecutionTime, recentActivity] = await Promise.all([
        prisma.ai_interactions.count({
          where: { user_id: userId }
        }),
        prisma.ai_interactions.count({
          where: { user_id: userId, execution_status: 'success' }
        }),
        prisma.ai_interactions.aggregate({
          where: { user_id: userId },
          _avg: { execution_time_ms: true }
        }),
        prisma.ai_interactions.count({
          where: {
            user_id: userId,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
            }
          }
        })
      ]);

      const commonQueryTypes = await prisma.ai_interactions.groupBy({
        by: ['interaction_type'],
        where: { user_id: userId },
        _count: true,
        orderBy: { _count: { interaction_type: 'desc' } },
        take: 3
      });

      return {
        totalQueries,
        successfulQueries,
        successRate: totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0,
        avgExecutionTime: Math.round(avgExecutionTime._avg.execution_time_ms || 0),
        commonQueryTypes: commonQueryTypes.map(ct => ct.interaction_type),
        recentActivity
      };
    } catch (error) {
      console.error('Erro ao buscar dados analytics:', error);
      return {
        totalQueries: 0,
        successfulQueries: 0,
        successRate: 0,
        avgExecutionTime: 0,
        commonQueryTypes: [],
        recentActivity: 0
      };
    }
  }

  /**
   * Verifica se deve gerar insights
   * @param {string} interactionType - Tipo de interação
   * @param {Object} response - Resposta processada
   * @returns {boolean} Se deve gerar insights
   */
  shouldGenerateInsights(interactionType, response) {
    return interactionType === 'insight_request' || 
           (response.content.length > 100 && response.suggestions.length > 0);
  }

  /**
   * Trata erros de conversa
   * @param {Object} aiResponse - Resposta com erro
   * @param {string} message - Mensagem original
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resposta de erro
   */
  async handleConversationError(aiResponse, message, userId, sessionId) {
    const fallbackResponse = await this.getFallbackResponse('conversation_error', message);
    
    return {
      success: false,
      response: fallbackResponse.message,
      confidence: 0,
      error: aiResponse.error,
      fallbackUsed: true,
      escalationLevel: fallbackResponse.escalationLevel
    };
  }

  /**
   * Processa resposta de insights
   * @param {string} response - Resposta da IA
   * @returns {Array} Lista de insights
   */
  parseInsightsResponse(response) {
    try {
      const cleanResponse = response.trim().replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanResponse);
      return parsed.insights || [];
    } catch (error) {
      console.error('Erro ao processar insights:', error);
      return [{
        type: 'general',
        title: 'Análise Geral',
        description: response.substring(0, 200),
        impact_score: 0.5,
        confidence_level: 'medium',
        recommendations: []
      }];
    }
  }

  /**
   * Busca dados históricos para análise preditiva
   * @param {number} userId - ID do usuário
   * @param {string} predictionType - Tipo de predição
   * @returns {Object} Dados históricos
   */
  async getHistoricalDataForPrediction(userId, predictionType) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Buscar interações dos últimos 30 dias
      const interactions = await prisma.ai_interactions.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { created_at: 'desc' },
        take: 100,
        select: {
          interaction_type: true,
          execution_status: true,
          confidence_score: true,
          execution_time_ms: true,
          created_at: true
        }
      });

      // Buscar insights gerados
      const insights = await prisma.ai_insights.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          insight_type: true,
          confidence_level: true,
          impact_score: true,
          status: true,
          created_at: true
        }
      });

      return {
        interactions,
        insights,
        period: '30_days',
        predictionType,
        summary: {
          totalInteractions: interactions.length,
          avgConfidence: interactions.reduce((acc, int) => acc + (int.confidence_score || 0), 0) / interactions.length || 0,
          avgExecutionTime: interactions.reduce((acc, int) => acc + (int.execution_time_ms || 0), 0) / interactions.length || 0,
          successRate: (interactions.filter(int => int.execution_status === 'success').length / interactions.length) * 100 || 0
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return {
        interactions: [],
        insights: [],
        period: '30_days',
        predictionType,
        summary: { totalInteractions: 0, avgConfidence: 0, avgExecutionTime: 0, successRate: 0 }
      };
    }
  }

  /**
   * Constrói prompt para análise preditiva
   * @param {Object} historicalData - Dados históricos
   * @param {string} predictionType - Tipo de predição
   * @param {Object} parameters - Parâmetros
   * @returns {string} Prompt formatado
   */
  buildPredictivePrompt(historicalData, predictionType, parameters) {
    const { summary, interactions, insights } = historicalData;
    
    return `ANÁLISE PREDITIVA - ${predictionType.toUpperCase()}

DADOS HISTÓRICOS (Últimos 30 dias):
- Total de interações: ${summary.totalInteractions}
- Taxa de sucesso: ${summary.successRate.toFixed(1)}%
- Confiança média: ${summary.avgConfidence.toFixed(2)}
- Tempo médio de execução: ${summary.avgExecutionTime.toFixed(0)}ms
- Insights gerados: ${insights.length}

PADRÕES IDENTIFICADOS:
${this.analyzePatterns(interactions, insights)}

TIPO DE PREDIÇÃO: ${predictionType}
PARÂMETROS: ${JSON.stringify(parameters, null, 2)}

INSTRUÇÕES:
1. Analise os padrões históricos de comportamento
2. Identifique tendências e sazonalidades
3. Considere fatores externos que podem influenciar
4. Forneça predições específicas e mensuráveis
5. Inclua intervalos de confiança
6. Sugira ações preventivas ou otimizações

FORMATO DE RESPOSTA (JSON):
{
  "prediction": {
    "trend": "increasing|decreasing|stable",
    "expectedChange": "percentual ou valor específico",
    "timeframe": "período da predição",
    "peakPeriods": ["período1", "período2"],
    "riskFactors": ["fator1", "fator2"]
  },
  "confidence": 0.85,
  "reasoning": "explicação detalhada da lógica",
  "recommendations": ["recomendação1", "recomendação2", "recomendação3"]
}

ANÁLISE:`;
  }

  /**
   * Analisa padrões nos dados históricos
   * @param {Array} interactions - Lista de interações
   * @param {Array} insights - Lista de insights
   * @returns {string} Análise dos padrões
   */
  analyzePatterns(interactions, insights) {
    if (interactions.length === 0) return 'Dados insuficientes para análise de padrões.';

    const weeklyPattern = this.analyzeWeeklyPattern(interactions);
    const typeDistribution = this.analyzeTypeDistribution(interactions);
    const successTrend = this.analyzeSuccessTrend(interactions);

    return `
- Padrão semanal: ${weeklyPattern}
- Distribuição por tipo: ${typeDistribution}
- Tendência de sucesso: ${successTrend}
- Insights ativos: ${insights.filter(i => i.status === 'active').length}
`;
  }

  /**
   * Analisa padrão semanal de uso
   */
  analyzeWeeklyPattern(interactions) {
    const dayCount = {};
    interactions.forEach(int => {
      const day = new Date(int.created_at).getDay();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const maxDay = Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `Pico em ${dayNames[maxDay]}`;
  }

  /**
   * Analisa distribuição por tipo de interação
   */
  analyzeTypeDistribution(interactions) {
    const typeCount = {};
    interactions.forEach(int => {
      typeCount[int.interaction_type] = (typeCount[int.interaction_type] || 0) + 1;
    });

    const mostCommon = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b);
    return `Mais comum: ${mostCommon}`;
  }

  /**
   * Analisa tendência de sucesso
   */
  analyzeSuccessTrend(interactions) {
    const recent = interactions.slice(0, 10);
    const older = interactions.slice(-10);

    const recentSuccess = recent.filter(i => i.execution_status === 'success').length / recent.length;
    const olderSuccess = older.filter(i => i.execution_status === 'success').length / older.length;

    if (recentSuccess > olderSuccess) return 'Melhorando';
    if (recentSuccess < olderSuccess) return 'Declinando';
    return 'Estável';
  }

  /**
   * Processa resposta da análise preditiva
   * @param {string} response - Resposta da IA
   * @returns {Object} Análise processada
   */
  parsePredictiveResponse(response) {
    try {
      const cleanResponse = response.trim().replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanResponse);
      
      return {
        prediction: parsed.prediction || {
          trend: 'stable',
          expectedChange: 'sem mudanças significativas',
          timeframe: 'próximos 30 dias',
          peakPeriods: [],
          riskFactors: []
        },
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Análise baseada em dados históricos limitados',
        recommendations: parsed.recommendations || ['Monitore métricas regularmente', 'Colete mais dados para análises futuras']
      };
    } catch (error) {
      console.error('Erro ao processar resposta preditiva:', error);
      return {
        prediction: {
          trend: 'stable',
          expectedChange: 'análise inconclusiva',
          timeframe: 'dados insuficientes',
          peakPeriods: [],
          riskFactors: ['dados insuficientes para análise']
        },
        confidence: 0.3,
        reasoning: 'Erro no processamento da resposta de IA',
        recommendations: ['Tente novamente mais tarde', 'Verifique a qualidade dos dados históricos']
      };
    }
  }
}

module.exports = ConversationService;
