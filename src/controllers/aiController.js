const NL2SQLService = require('../services/nl2sqlService');
const MermaidVisualizationService = require('../services/mermaidVisualizationService');
const { PrismaClient } = require('@prisma/client');
const { executeReadOnlyQuery, getSchema } = require('../services/externalDbService');

const prisma = new PrismaClient();
const nl2sqlService = new NL2SQLService();
const mermaidService = new MermaidVisualizationService();

class AIController {
  /**
   * Converte linguagem natural para SQL
   */
  async getAIInteractions(req, res) {
    // const session_id = req.params.session_id;
    const id = req.params.id;
    try {
      
      const interactions = await prisma.ai_interactions.findMany({ where: { session_id: Number(id) } });
      res.json({ success: true, data: interactions });
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getAllAIInteractions(req, res) {
    try {
      
      const interactions = await prisma.ai_interactions.findMany();
      res.json({ success: true, data: interactions });
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async convertNLToSQL(req, res) {
    try {
      const { query, sessionId, language = 'pt-BR', databaseId } = req.body;
      const userId = req.user.id;

      // Validações
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Consulta é obrigatória'
        });
      }

      if (query.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Consulta muito longa (máximo 1000 caracteres)'
        });
      }

      // Verifica ou cria sessão se necessário
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const newSession = await prisma.ai_chat_sessions.create({
          data: {
            user_id: userId,
            session_token: `nl2sql_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            status: 'active',
            context_data: { type: 'nl2sql', language }
          }
        });
        activeSessionId = newSession.id;
      }

      // Seleção do banco
      let dbSchema = null;
      let type = null;
      if (databaseId) {
        const db = await prisma.associated_databases.findUnique({ where: { id: Number(databaseId) } });
        if (!db) return res.status(400).json({ success: false, error: 'Banco selecionado não encontrado.' });
        // if(!db.schema)
        // {
        dbSchema = await getSchema(db.url, db.type);
        console.log('Schema obtido:', dbSchema);
        // }
        // dbSchema = db.schema;
        type = db.type;
      }

      // Processa conversão, passando schema se disponível
      const result = await nl2sqlService.convertNLToSQL(query, userId, activeSessionId, dbSchema, type);

      // Salva interação no banco
      const interaction = await prisma.ai_interactions.create({
        data: {
          session_id: activeSessionId,
          user_id: userId,
          interaction_type: 'nl2sql',
          input_text: query,
          input_language: language,
          processed_query: result.sql,
          ai_response: result,
          execution_status: result.success ? 'success' : (result.fallbackUsed ? 'fallback' : 'error'),
          execution_time_ms: result.executionTime,
          confidence_score: result.confidence,
          fallback_used: result.fallbackUsed || false,
          error_message: result.error,
          metadata: result.metadata
        }
      });

      // Atualiza histórico
      const querie = await prisma.queries.create({
        data: {
          user_id: userId,
          question_text: query,
        }
      });

      await prisma.history.create({
        data: {
          user_id: userId,
          query_id: querie.id, // Pode ser associado a uma query específica se necessário
          success: result.success,
          execution_time: result.executionTime / 1000 // Converte para segundos
        }
      });


      // Executa o SQL gerado se banco selecionado e query for SELECT
      let queryResult = null;
      let visualContent = null;
      
      if (databaseId && result.sql && /^\s*SELECT/i.test(result.sql)) {
        const db = await prisma.associated_databases.findUnique({ where: { id: Number(databaseId) } });
        if (db && db.url) {
          try {
            const rows = await executeReadOnlyQuery(db.url, result.sql);
            // Formatação para tabela
            if (rows && rows.length > 0) {
              queryResult = {
                type: 'table',
                columns: Object.keys(rows[0]),
                rows
              };
              
              // Gera conteúdo visual com o novo serviço Mermaid otimizado
              visualContent = await mermaidService.generateMermaidVisualization(
                queryResult, 
                userId, 
                activeSessionId, 
                dbSchema, 
                type
              );
            } else {
              queryResult = { type: 'table', columns: [], rows: [] };
        visualContent = {
          success: true,
          mermaid: `%%{init: {"theme":"base", "themeVariables": {"primaryColor":"#4CAF50"}}}%%
flowchart TD
    A[📋 Consulta Executada] --> B[Nenhum registro encontrado]
    B --> C[Verifique os critérios]
    C --> D[Ajuste os filtros]
    D --> E[Confirme os dados]
    style A fill:#e8f5e8
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e1f5fe
    style E fill:#f1f8e9`,
          visualizationType: 'flowchart',
          chartTitle: 'Resultado Vazio',
          executionTime: 0
        };
            }
          } catch (err) {
            queryResult = { error: 'Erro ao executar SQL: ' + err.message };
            visualContent = {
              success: false,
              mermaid: `%%{init: {"theme":"base", "themeVariables": {"primaryColor":"#f44336"}}}%%
flowchart TD
    A[⚠️ Erro na Execução] --> B[${err.message.slice(0, 50)}...]
    B --> C[Verificar sintaxe SQL]
    C --> D[Confirmar tabelas]
    D --> E[Verificar permissões]
    style A fill:#ffebee
    style B fill:#ffcdd2
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e8f5e8`,
              visualizationType: 'error',
              chartTitle: 'Erro de Execução',
              executionTime: 0
            };
          }
        }
      } else if (result.sql) {
        // Apenas SQL gerado, sem execução
        visualContent = {
          success: true,
          mermaid: `%%{init: {"theme":"base", "themeVariables": {"primaryColor":"#2196F3"}}}%%
flowchart LR
    A[🔍 Consulta Analisada] --> B[SQL Gerado]
    B --> C[${result.explanation.slice(0, 30)}...]
    C --> D[Selecione um banco]
    D --> E[Execute a consulta]
    style A fill:#e3f2fd
    style B fill:#f1f8e9
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e8f5e8`,
          visualizationType: 'flowchart',
          chartTitle: 'SQL Pronto para Execução',
          executionTime: 0
        };
      }

      res.json({
        success: true,
        data: {
          sql: result.sql,
          explanation: result.explanation,
          visualContent: visualContent || null,
          confidence: result.confidence,
          sessionId: activeSessionId,
          interactionId: interaction.id,
          executionTime: result.executionTime,
          fromCache: result.fromCache || false,
          fallbackUsed: result.fallbackUsed || false,
          queryResult,
          // Metadados adicionais
          metadata: {
            databaseType: type,
            hasVisualization: !!(visualContent && visualContent.success),
            visualizationType: visualContent?.visualizationType,
            chartTitle: visualContent?.chartTitle,
            dataStats: visualContent?.dataStats,
            queryExecuted: !!queryResult && !queryResult.error,
            mermaidGenerated: !!(visualContent && visualContent.mermaid),
            totalDataPoints: visualContent?.metadata?.totalDataPoints || 0
          }
        }
      });

    } catch (error) {
      console.error('Erro no endpoint NL-to-SQL:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Converte SQL para linguagem natural
   */
  async convertSQLToNL(req, res) {
    try {
      const { sqlQuery, sessionId, language = 'pt-BR' } = req.body;
      const userId = req.user.id;

      // Validações
      if (!sqlQuery || sqlQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Consulta SQL é obrigatória'
        });
      }

      // Validação básica de SQL
      const sqlKeywords = ['SELECT', 'FROM', 'INSERT', 'UPDATE', 'DELETE'];
      const hasValidSQL = sqlKeywords.some(keyword => 
        sqlQuery.toUpperCase().includes(keyword)
      );

      if (!hasValidSQL) {
        return res.status(400).json({
          success: false,
          error: 'Consulta SQL não parece válida'
        });
      }

      // Verifica ou cria sessão
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const newSession = await prisma.ai_chat_sessions.create({
          data: {
            user_id: userId,
            session_token: `sql2nl_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            status: 'active',
            context_data: { type: 'sql2nl', language }
          }
        });
        activeSessionId = newSession.id;
      }

      // Processa conversão
      const result = await nl2sqlService.convertSQLToNL(sqlQuery, userId, activeSessionId);

      // Salva interação
      const interaction = await prisma.ai_interactions.create({
        data: {
          session_id: activeSessionId,
          user_id: userId,
          interaction_type: 'sql2nl',
          input_text: sqlQuery,
          input_language: language,
          ai_response: result,
          execution_status: result.success ? 'success' : (result.fallbackUsed ? 'fallback' : 'error'),
          execution_time_ms: result.executionTime,
          confidence_score: result.confidence,
          fallback_used: result.fallbackUsed || false,
          error_message: result.error,
          metadata: result.metadata
        }
      });

      res.json({
        success: true,
        data: {
          explanation: result.explanation,
          confidence: result.confidence,
          sessionId: activeSessionId,
          interactionId: interaction.id,
          executionTime: result.executionTime,
          fromCache: result.fromCache || false,
          fallbackUsed: result.fallbackUsed || false
        }
      });

    } catch (error) {
      console.error('Erro no endpoint SQL-to-NL:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera visualização Mermaid otimizada
   */
  async generateMermaidVisualization(req, res) {
    try {
      const { queryData, sessionId, databaseId } = req.body;
      const userId = req.user.id;

      // Validações
      if (!queryData || !queryData.rows || queryData.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Dados da consulta são obrigatórios'
        });
      }

      // Verifica ou cria sessão se necessário
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const newSession = await prisma.ai_chat_sessions.create({
          data: {
            user_id: userId,
            session_token: `mermaid_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            status: 'active',
            context_data: { type: 'mermaid_visualization' }
          }
        });
        activeSessionId = newSession.id;
      }

      // Obtém schema do banco se fornecido
      let dbSchema = null;
      let dbType = null;
      if (databaseId) {
        const db = await prisma.associated_databases.findUnique({ 
          where: { id: Number(databaseId) } 
        });
        if (db) {
          dbSchema = await getSchema(db.url, db.type);
          dbType = db.type;
        }
      }

      // Gera visualização Mermaid
      const result = await mermaidService.generateMermaidVisualization(
        queryData,
        userId,
        activeSessionId,
        dbSchema,
        dbType
      );

      // Salva interação no banco
      const interaction = await prisma.ai_interactions.create({
        data: {
          session_id: activeSessionId,
          user_id: userId,
          interaction_type: 'mermaid_visualization',
          input_text: JSON.stringify(queryData),
          processed_query: result.mermaid,
          ai_response: result,
          execution_status: result.success ? 'success' : 'error',
          execution_time_ms: result.executionTime,
          confidence_score: result.success ? 0.9 : 0.1,
          metadata: result.metadata
        }
      });

      res.json({
        success: true,
        data: {
          mermaid: result.mermaid,
          visualizationType: result.visualizationType,
          chartTitle: result.chartTitle,
          dataStats: result.dataStats,
          sessionId: activeSessionId,
          interactionId: interaction.id,
          executionTime: result.executionTime,
          fromCache: result.fromCache || false,
          metadata: result.metadata
        }
      });

    } catch (error) {
      console.error('Erro no endpoint de visualização Mermaid:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Valida uma consulta SQL
   */
  async validateSQL(req, res) {
    try {
      const { sqlQuery } = req.body;

      if (!sqlQuery) {
        return res.status(400).json({
          success: false,
          error: 'Consulta SQL é obrigatória'
        });
      }

      // Validações básicas de segurança
      const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
      const hasDangerousKeyword = dangerousKeywords.some(keyword => 
        sqlQuery.toUpperCase().includes(keyword)
      );

      if (hasDangerousKeyword) {
        return res.json({
          success: true,
          data: {
            isValid: false,
            errors: ['Consulta contém operações não permitidas (apenas SELECT é permitido)'],
            warnings: [],
            suggestions: ['Use apenas consultas SELECT para visualizar dados']
          }
        });
      }

      // Validação de sintaxe básica
      const errors = [];
      const warnings = [];
      const suggestions = [];

      if (!sqlQuery.toUpperCase().includes('SELECT')) {
        errors.push('Consulta deve começar com SELECT');
      }

      if (!sqlQuery.toUpperCase().includes('FROM')) {
        errors.push('Consulta deve incluir cláusula FROM');
      }

      if (sqlQuery.includes(';') && sqlQuery.indexOf(';') !== sqlQuery.length - 1) {
        warnings.push('Múltiplas consultas detectadas');
      }

      if (sqlQuery.includes('*')) {
        suggestions.push('Considere especificar colunas específicas ao invés de usar *');
      }

      if (!sqlQuery.includes('LIMIT') && !sqlQuery.includes('TOP')) {
        suggestions.push('Considere adicionar LIMIT para limitar o número de resultados');
      }

      const isValid = errors.length === 0;

      res.json({
        success: true,
        data: {
          isValid,
          errors,
          warnings,
          suggestions,
          query: sqlQuery.trim()
        }
      });

    } catch (error) {
      console.error('Erro na validação SQL:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém histórico de interações com IA
   */
  async getInteractionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        interactionType, 
        sessionId, 
        startDate, 
        endDate 
      } = req.query;

      const skip = (page - 1) * limit;
      const where = { user_id: userId };

      // Filtros opcionais
      if (interactionType) {
        where.interaction_type = interactionType;
      }

      if (sessionId) {
        where.session_id = parseInt(sessionId);
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
      }

      // Busca interações
      const [interactions, total] = await Promise.all([
        prisma.ai_interactions.findMany({
          where,
          include: {
            session: {
              select: {
                session_token: true,
                status: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.ai_interactions.count({ where })
      ]);

      // Estatísticas do usuário
      const stats = await prisma.ai_interactions.groupBy({
        by: ['interaction_type', 'execution_status'],
        where: { user_id: userId },
        _count: true
      });

      res.json({
        success: true,
        data: {
          interactions: interactions.map(interaction => ({
            id: interaction.id,
            type: interaction.interaction_type,
            input: interaction.input_text,
            status: interaction.execution_status,
            confidence: interaction.confidence_score,
            executionTime: interaction.execution_time_ms,
            fallbackUsed: interaction.fallback_used,
            createdAt: interaction.created_at,
            session: interaction.session
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          stats: stats.reduce((acc, stat) => {
            if (!acc[stat.interaction_type]) {
              acc[stat.interaction_type] = {};
            }
            acc[stat.interaction_type][stat.execution_status] = stat._count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém métricas de performance da IA
   */
  async getAIMetrics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      // Calcula data de início baseado no período
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };

      const days = periodDays[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where = {
        user_id: userId,
        created_at: { gte: startDate }
      };

      // Métricas principais
      const [
        totalInteractions,
        successfulInteractions,
        avgExecutionTime,
        avgConfidence,
        fallbackUsage,
        interactionsByType,
        dailyStats
      ] = await Promise.all([
        prisma.ai_interactions.count({ where }),
        prisma.ai_interactions.count({ 
          where: { ...where, execution_status: 'success' }
        }),
        prisma.ai_interactions.aggregate({
          where,
          _avg: { execution_time_ms: true }
        }),
        prisma.ai_interactions.aggregate({
          where: { ...where, execution_status: 'success' },
          _avg: { confidence_score: true }
        }),
        prisma.ai_interactions.count({
          where: { ...where, fallback_used: true }
        }),
        prisma.ai_interactions.groupBy({
          by: ['interaction_type'],
          where,
          _count: true,
          orderBy: { _count: { interaction_type: 'desc' } }
        }),
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as total,
            COUNT(CASE WHEN execution_status = 'success' THEN 1 END) as successful
          FROM ai_interactions 
          WHERE user_id = ${userId} AND created_at >= ${startDate}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `
      ]);

      const successRate = totalInteractions > 0 
        ? Math.round((successfulInteractions / totalInteractions) * 100) 
        : 0;

      const fallbackRate = totalInteractions > 0
        ? Math.round((fallbackUsage / totalInteractions) * 100)
        : 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalInteractions,
            successfulInteractions,
            successRate,
            avgExecutionTime: Math.round(avgExecutionTime._avg.execution_time_ms || 0),
            avgConfidence: Number((avgConfidence._avg.confidence_score || 0).toFixed(2)),
            fallbackUsage,
            fallbackRate
          },
          interactionsByType: interactionsByType.map(item => ({
            type: item.interaction_type,
            count: item._count
          })),
          dailyStats: dailyStats.map(day => ({
            date: day.date,
            total: Number(day.total),
            successful: Number(day.successful),
            successRate: Number(day.total) > 0 
              ? Math.round((Number(day.successful) / Number(day.total)) * 100)
              : 0
          })),
          period
        }
      });

    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Limpa cache de respostas da IA
   */
  async clearCache(req, res) {
    try {
      const { type = 'expired' } = req.body;
      
      let deletedCount = 0;

      if (type === 'expired') {
        // Remove apenas cache expirado
        const result = await prisma.ai_response_cache.deleteMany({
          where: {
            expires_at: { lt: new Date() }
          }
        });
        deletedCount = result.count;
      } else if (type === 'all') {
        // Remove todo o cache (apenas para admins)
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado'
          });
        }
        
        const result = await prisma.ai_response_cache.deleteMany({});
        deletedCount = result.count;
      }

      res.json({
        success: true,
        data: {
          deletedCount,
          type,
          message: `Cache limpo com sucesso. ${deletedCount} registros removidos.`
        }
      });

    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AIController();
