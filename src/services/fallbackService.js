const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FallbackService {
  constructor() {
    this.fallbackTemplates = {
      // Fallbacks para NL-to-SQL
      nl2sql_low_confidence: [
        "Não tenho certeza sobre como converter '{query}' em SQL. Poderia reformular a pergunta de forma mais específica?",
        "Sua consulta '{query}' não ficou clara para mim. Tente especificar quais dados você quer ver e de qual tabela.",
        "Estou com dificuldade para entender '{query}'. Que tal tentar algo como 'Mostre todos os usuários' ou 'Busque pedidos de hoje'?"
      ],
      nl2sql_no_understanding: [
        "Não consegui compreender sua consulta '{query}'. Algumas sugestões:\n- Use palavras-chave como 'mostrar', 'buscar', 'listar'\n- Especifique qual informação você quer ver\n- Mencione filtros como datas ou critérios",
        "Desculpe, não entendi '{query}'. Posso ajudar com consultas como:\n- 'Mostrar todos os usuários criados hoje'\n- 'Buscar consultas com erro'\n- 'Listar histórico do usuário X'",
        "'{query}' não está claro para mim. Tente ser mais específico sobre:\n- Que dados você quer ver?\n- De qual período?\n- Há algum filtro específico?"
      ],
      nl2sql_error: [
        "Ocorreu um erro ao processar '{query}'. Nosso sistema está temporariamente indisponível. Tente novamente em alguns momentos.",
        "Não foi possível processar sua consulta '{query}' no momento. Verifique sua conexão e tente novamente.",
        "Sistema de conversão temporariamente indisponível para '{query}'. Nossa equipe foi notificada."
      ],
      
      // Fallbacks para SQL-to-NL
      sql2nl_error: [
        "Não consegui explicar esta consulta SQL. Verifique se a sintaxe está correta.",
        "A consulta SQL fornecida contém erros ou não é compatível com nosso sistema.",
        "Sistema de explicação SQL temporariamente indisponível. Tente novamente mais tarde."
      ],
      
      // Fallbacks para conversação
      conversation_error: [
        "Desculpe, não consegui processar sua mensagem no momento. Tente reformular ou aguarde alguns instantes.",
        "Estou com dificuldades para entender. Poderia ser mais específico sobre o que você precisa?",
        "Sistema de conversa temporariamente indisponível. Nossa equipe foi notificada e está trabalhando na solução."
      ],
      conversation_timeout: [
        "Sua solicitação está demorando mais que o esperado. Tente uma pergunta mais simples ou aguarde alguns momentos.",
        "O tempo limite foi excedido. Tente dividir sua pergunta em partes menores.",
        "Sistema sobrecarregado. Tente novamente em alguns minutos."
      ],
      
      // Fallbacks para insights
      insight_generation_error: [
        "Não foi possível gerar insights no momento. Verifique se você tem dados suficientes para análise.",
        "Sistema de insights temporariamente indisponível. Tente novamente mais tarde.",
        "Não há dados suficientes para gerar insights significativos. Continue usando o sistema para acumular mais dados."
      ],
      
      // Fallbacks para análise preditiva
      prediction_error: [
        "Não foi possível realizar a análise preditiva. Dados insuficientes ou sistema temporariamente indisponível.",
        "Para análises preditivas precisas, são necessários mais dados históricos. Continue usando o sistema.",
        "Sistema de predição temporariamente indisponível. Nossa equipe foi notificada."
      ]
    };

    this.escalationLevels = {
      1: 'Baixa - Sugestão automática',
      2: 'Média - Orientação adicional',
      3: 'Alta - Possível problema do usuário',
      4: 'Crítica - Problema do sistema',
      5: 'Urgente - Falha crítica'
    };
  }

  /**
   * Inicializa fallbacks padrão no banco de dados
   */
  async initializeDefaultFallbacks() {
    try {
      console.log('Inicializando fallbacks padrão...');

      for (const [fallbackType, templates] of Object.entries(this.fallbackTemplates)) {
        for (let i = 0; i < templates.length; i++) {
          await prisma.ai_fallbacks.upsert({
            where: {
              trigger_pattern: `${fallbackType}_${i + 1}`
            },
            update: {
              response_template: templates[i],
              is_active: true
            },
            create: {
              trigger_pattern: `${fallbackType}_${i + 1}`,
              fallback_type: fallbackType,
              response_template: templates[i],
              escalation_level: this.getEscalationLevel(fallbackType),
              is_active: true,
              usage_count: 0
            }
          });
        }
      }

      console.log('Fallbacks padrão inicializados com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar fallbacks:', error);
    }
  }

  /**
   * Obtém um fallback baseado no tipo e contexto
   * @param {string} fallbackType - Tipo do fallback
   * @param {string} originalInput - Entrada original que causou o fallback
   * @param {Object} context - Contexto adicional
   * @returns {Object} Fallback selecionado
   */
  async getFallback(fallbackType, originalInput = '', context = {}) {
    try {
      // Busca fallbacks ativos do tipo especificado
      const fallbacks = await prisma.ai_fallbacks.findMany({
        where: {
          fallback_type: fallbackType,
          is_active: true
        },
        orderBy: {
          usage_count: 'asc' // Prioriza os menos usados para distribuir o uso
        }
      });

      if (fallbacks.length === 0) {
        return this.getDefaultFallback(fallbackType, originalInput);
      }

      // Seleciona um fallback (round-robin baseado no uso)
      const selectedFallback = fallbacks[0];

      // Incrementa contador de uso
      await prisma.ai_fallbacks.update({
        where: { id: selectedFallback.id },
        data: { 
          usage_count: { increment: 1 },
          updated_at: new Date()
        }
      });

      // Processa template com variáveis
      const processedMessage = this.processTemplate(
        selectedFallback.response_template, 
        { query: originalInput, ...context }
      );

      return {
        id: selectedFallback.id,
        message: processedMessage,
        escalationLevel: selectedFallback.escalation_level,
        type: fallbackType,
        suggestions: this.generateSuggestions(fallbackType, originalInput),
        shouldEscalate: selectedFallback.escalation_level >= 4
      };

    } catch (error) {
      console.error('Erro ao buscar fallback:', error);
      return this.getDefaultFallback(fallbackType, originalInput);
    }
  }

  /**
   * Registra uso de fallback para análise
   * @param {string} fallbackType - Tipo do fallback
   * @param {string} originalInput - Entrada original
   * @param {number} userId - ID do usuário
   * @param {Object} context - Contexto adicional
   */
  async logFallbackUsage(fallbackType, originalInput, userId, context = {}) {
    try {
      // Aqui poderia ser uma tabela separada de logs de fallback
      // Por agora, vamos usar uma entrada de log simples
      console.log('Fallback Usage:', {
        type: fallbackType,
        input: originalInput?.substring(0, 100),
        userId,
        timestamp: new Date().toISOString(),
        context
      });

      // Poderia salvar em uma tabela de analytics para análise posterior
    } catch (error) {
      console.error('Erro ao logar uso de fallback:', error);
    }
  }

  /**
   * Gera sugestões baseadas no tipo de fallback
   * @param {string} fallbackType - Tipo do fallback
   * @param {string} originalInput - Entrada original
   * @returns {Array} Lista de sugestões
   */
  generateSuggestions(fallbackType, originalInput) {
    const suggestions = [];

    switch (fallbackType) {
      case 'nl2sql_low_confidence':
      case 'nl2sql_no_understanding':
        suggestions.push(
          'Tente usar verbos como "mostrar", "buscar", "listar"',
          'Especifique qual tabela ou dados você quer ver',
          'Adicione filtros como datas ou critérios específicos',
          'Exemplo: "Mostrar todos os usuários criados esta semana"'
        );
        break;

      case 'conversation_error':
        suggestions.push(
          'Tente reformular sua pergunta de forma mais clara',
          'Seja mais específico sobre o que você precisa',
          'Divida perguntas complexas em partes menores',
          'Verifique se há erros de digitação'
        );
        break;

      case 'insight_generation_error':
        suggestions.push(
          'Use o sistema por mais tempo para acumular dados',
          'Tente tipos de análise mais simples primeiro',
          'Verifique se você tem permissões adequadas',
          'Entre em contato com o suporte se o problema persistir'
        );
        break;

      default:
        suggestions.push(
          'Tente novamente em alguns instantes',
          'Verifique sua conexão com a internet',
          'Entre em contato com o suporte se necessário'
        );
    }

    return suggestions;
  }

  /**
   * Determina nível de escalação baseado no tipo
   * @param {string} fallbackType - Tipo do fallback
   * @returns {number} Nível de escalação (1-5)
   */
  getEscalationLevel(fallbackType) {
    const escalationMap = {
      'nl2sql_low_confidence': 2,
      'nl2sql_no_understanding': 1,
      'nl2sql_error': 4,
      'sql2nl_error': 3,
      'conversation_error': 3,
      'conversation_timeout': 4,
      'insight_generation_error': 3,
      'prediction_error': 3
    };

    return escalationMap[fallbackType] || 3;
  }

  /**
   * Processa template substituindo variáveis
   * @param {string} template - Template com variáveis
   * @param {Object} variables - Variáveis para substituição
   * @returns {string} Template processado
   */
  processTemplate(template, variables) {
    let processed = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, value || '');
    }

    return processed;
  }

  /**
   * Retorna fallback padrão quando não há no banco
   * @param {string} fallbackType - Tipo do fallback
   * @param {string} originalInput - Entrada original
   * @returns {Object} Fallback padrão
   */
  getDefaultFallback(fallbackType, originalInput) {
    const defaultMessages = {
      'nl2sql_error': 'Não foi possível processar sua consulta no momento. Tente novamente mais tarde.',
      'sql2nl_error': 'Não consegui explicar esta consulta SQL. Verifique a sintaxe.',
      'conversation_error': 'Desculpe, não consegui processar sua mensagem. Tente reformular.',
      'insight_generation_error': 'Não foi possível gerar insights no momento.',
      'prediction_error': 'Análise preditiva temporariamente indisponível.'
    };

    return {
      id: null,
      message: defaultMessages[fallbackType] || 'Ocorreu um erro inesperado. Tente novamente.',
      escalationLevel: 5,
      type: fallbackType,
      suggestions: ['Tente novamente mais tarde', 'Entre em contato com o suporte'],
      shouldEscalate: true
    };
  }

  /**
   * Atualiza templates de fallback
   * @param {number} fallbackId - ID do fallback
   * @param {string} newTemplate - Novo template
   * @returns {Object} Resultado da atualização
   */
  async updateFallbackTemplate(fallbackId, newTemplate) {
    try {
      const updated = await prisma.ai_fallbacks.update({
        where: { id: fallbackId },
        data: { 
          response_template: newTemplate,
          updated_at: new Date()
        }
      });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      console.error('Erro ao atualizar fallback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desativa um fallback
   * @param {number} fallbackId - ID do fallback
   * @returns {Object} Resultado da operação
   */
  async deactivateFallback(fallbackId) {
    try {
      await prisma.ai_fallbacks.update({
        where: { id: fallbackId },
        data: { 
          is_active: false,
          updated_at: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao desativar fallback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém estatísticas de uso de fallbacks
   * @param {string} period - Período para análise
   * @returns {Object} Estatísticas
   */
  async getFallbackStats(period = '30d') {
    try {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await prisma.ai_fallbacks.findMany({
        where: {
          updated_at: { gte: startDate }
        },
        select: {
          fallback_type: true,
          usage_count: true,
          escalation_level: true,
          is_active: true
        }
      });

      const summary = stats.reduce((acc, fallback) => {
        if (!acc[fallback.fallback_type]) {
          acc[fallback.fallback_type] = {
            totalUsage: 0,
            count: 0,
            avgEscalation: 0,
            active: 0
          };
        }

        acc[fallback.fallback_type].totalUsage += fallback.usage_count;
        acc[fallback.fallback_type].count += 1;
        acc[fallback.fallback_type].avgEscalation += fallback.escalation_level;
        if (fallback.is_active) acc[fallback.fallback_type].active += 1;

        return acc;
      }, {});

      // Calcula médias
      Object.keys(summary).forEach(type => {
        summary[type].avgEscalation = 
          Math.round(summary[type].avgEscalation / summary[type].count * 100) / 100;
      });

      return {
        success: true,
        data: {
          period,
          summary,
          totalFallbacks: stats.length,
          activeFallbacks: stats.filter(f => f.is_active).length
        }
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas de fallback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica se deve usar fallback baseado na confiança
   * @param {number} confidenceScore - Score de confiança (0-1)
   * @param {string} interactionType - Tipo de interação
   * @returns {boolean} Se deve usar fallback
   */
  shouldUseFallback(confidenceScore, interactionType) {
    const thresholds = {
      'nl2sql': 0.4,
      'sql2nl': 0.5,
      'conversation': 0.3,
      'insight_generation': 0.6,
      'prediction': 0.7
    };

    const threshold = thresholds[interactionType] || 0.5;
    return confidenceScore < threshold;
  }

  /**
   * Determina tipo de fallback baseado no contexto
   * @param {string} interactionType - Tipo de interação
   * @param {Object} error - Erro ocorrido (se houver)
   * @param {number} confidenceScore - Score de confiança
   * @returns {string} Tipo de fallback apropriado
   */
  determineFallbackType(interactionType, error = null, confidenceScore = 0) {
    if (error) {
      if (error.code === 'TIMEOUT') {
        return `${interactionType}_timeout`;
      }
      return `${interactionType}_error`;
    }

    if (confidenceScore < 0.2) {
      return `${interactionType}_no_understanding`;
    } else if (confidenceScore < 0.4) {
      return `${interactionType}_low_confidence`;
    }

    return `${interactionType}_error`;
  }
}

module.exports = FallbackService;
