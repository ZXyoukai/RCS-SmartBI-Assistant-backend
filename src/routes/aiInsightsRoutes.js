const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');
const { randomInt } = require('crypto');
const { default: axios } = require('axios');

// Listar insights do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      insight_type,
      confidence_level,
      status,
      active_only = true
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };
    if (insight_type) whereClause.insight_type = insight_type;
    if (confidence_level) whereClause.confidence_level = confidence_level;
    if (status) whereClause.status = status;
    if (active_only === 'true') whereClause.status = 'active';

    // Filtrar insights não expirados se não especificado
    if (!status) {
      whereClause.OR = [
        { expires_at: null },
        { expires_at: { gte: new Date() } }
      ];
    }

    const insights = await prisma.ai_insights.findMany({
      where: whereClause,
      orderBy: [
        { impact_score: 'desc' },
        { created_at: 'desc' }
      ],
      skip: offset,
      take: parseInt(limit),
      include: {
        interaction: {
          select: {
            id: true,
            interaction_type: true,
            input_text: true,
            created_at: true,
            session: {
              select: {
                id: true,
                session_token: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.ai_insights.count({ where: whereClause });

    res.json({
      data: insights,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar insights:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar insight por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const insight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        interaction: {
          include: {
            session: {
              select: {
                id: true,
                session_token: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!insight) return res.status(404).json({ error: 'Insight não encontrado' });
    res.json(insight);
  } catch (error) {
    console.error('Erro ao buscar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo insight
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      database_id,
      session_token,
      status = 'active'
    } = req.body;

    if (!database_id) {
      return res.status(400).json({
        error: 'Database ID é obrigatório'
      });
    }

    const insight_type = "Database Analysis";
    const title = insight_type + ' General';
    const confidence_level = "high";
    const impact_score = randomInt(70, 100);
    
    const database = await prisma.associated_databases.findFirst({
      where: { id: Number(database_id) }
    });
    
    if (!database) {
      return res.status(404).json({ error: 'Banco de dados não encontrado' });
    }

    if (database.type !== 'postgresql' && database.type !== 'postgres' && database.type !== 'PostgreSQL' && database.type !== 'Postgres') {
      return res.status(400).json({ error: 'Apenas bancos PostgreSQL são suportados no momento para insights.' });
    }

    // 1. Criar ou buscar sessão
    let session;
    if (session_token) {
      session = await prisma.ai_chat_sessions.findFirst({
        where: { session_token, user_id: req.user.id }
      });
    }

    if (!session) {
      session = await prisma.ai_chat_sessions.create({
        data: {
          user_id: req.user.id,
          session_token: session_token || `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'active'
        }
      });
    }

    // 2. Registrar início da interação
    const startTime = Date.now();
    const interaction = await prisma.ai_interactions.create({
      data: {
        session_id: session.id,
        user_id: req.user.id,
        interaction_type: 'insight',
        input_text: `Análise geral do banco: ${database.name}`,
        execution_status: 'pending'
      }
    });

    const data_analysis = "data_" + database.type;
    let response;
    
    try {
      if (!database.url) {
        throw new Error('URL de conexão do banco ausente');
      }

      const data = {
        database_url: database.url,
      };

      response = await axios.post(
        `${process.env.INSIGHTS_API}/analyze-database`,
        data,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      // 3. Atualizar interação com erro
      const executionTime = Date.now() - startTime;
      await prisma.ai_interactions.update({
        where: { id: interaction.id },
        data: {
          execution_status: 'error',
          error_message: error.response?.data?.message || error.message,
          execution_time_ms: executionTime
        }
      });

      console.error('Erro ao chamar API de insights:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Erro interno do servidor ao gerar insights' });
    }
    // 4. Calcular tempo de execução
    const executionTime = Date.now() - startTime;

    // 5. Atualizar interação com sucesso
    await prisma.ai_interactions.update({
      where: { id: interaction.id },
      data: {
        execution_status: 'success',
        ai_response: { gemini_response: response.data.gemini_response },
        execution_time_ms: executionTime
      }
    });

    // 6. Criar insight
    const insight = await prisma.ai_insights.create({
      data: {
        interaction_id: interaction.id,
        user_id: req.user.id,
        insight_type,
        downloadlink: `${process.env.INSIGHTS_API}/${response.data.pdf_path}`,
        title,
        description: response.data.gemini_response,
        data_analysis,
        confidence_level,
        impact_score,
        status,
        expires_at: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      insight,
      file_name: response.data.pdf_filename,
      session: {
        id: session.id,
        session_token: session.session_token
      },
      interaction: {
        id: interaction.id,
        execution_time: executionTime,
        type: 'insight'
      }
    });
  } catch (error) {
    console.error('Erro ao criar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/specific', authMiddleware, async (req, res) => {
  try {
    const {
      database_id,
      insight_type,
      session_token,
      status = 'active'
    } = req.body;

    if (!database_id || !insight_type) {
      return res.status(400).json({
        error: 'Database ID e tipo de insight são obrigatórios'
      });
    }

    const title = insight_type + ' Insight';
    const confidence_level = "high";
    const impact_score = randomInt(70, 100);
    
    const database = await prisma.associated_databases.findFirst({
      where: { id: Number(database_id) }
    });
    
    if (!database) {
      return res.status(404).json({ error: 'Banco de dados não encontrado' });
    }

    if (database.type !== 'postgresql' && database.type !== 'postgres' && database.type !== 'PostgreSQL' && database.type !== 'Postgres') {
      return res.status(400).json({ error: 'Apenas bancos PostgreSQL são suportados no momento para insights.' });
    }

    // 1. Criar ou buscar sessão
    let session;
    if (session_token) {
      session = await prisma.ai_chat_sessions.findFirst({
        where: { session_token, user_id: req.user.id }
      });
    }

    if (!session) {
      session = await prisma.ai_chat_sessions.create({
        data: {
          user_id: req.user.id,
          session_token: session_token || `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'active'
        }
      });
    }

    // 2. Registrar início da interação
    const startTime = Date.now();
    const interaction = await prisma.ai_interactions.create({
      data: {
        session_id: session.id,
        user_id: req.user.id,
        interaction_type: 'insight',
        input_text: `${insight_type} para o banco: ${database.name}`,
        execution_status: 'pending'
      }
    });

    const data_analysis = "data_" + database.type;
    let response;
    
    try {
      if (!database.url) {
        throw new Error('URL de conexão do banco ausente');
      }

      const data = {
        database_url: database.url,
        insight_request: insight_type
      };

      response = await axios.post(
        `${process.env.INSIGHTS_API}/analyze-database`,
        data,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 segundos de timeout
        }
      );

    } catch (error) {
      // 3. Atualizar interação com erro
      const executionTime = Date.now() - startTime;
      await prisma.ai_interactions.update({
        where: { id: interaction.id },
        data: {
          execution_status: 'error',
          error_message: error.response?.data?.message || error.message,
          execution_time_ms: executionTime
        }
      });

      console.error('Erro ao chamar API de insights:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Erro interno do servidor ao gerar insights' });
    }

    // 4. Calcular tempo de execução
    const executionTime = Date.now() - startTime;

    // 5. Validar resposta
    if (!response || !response.data.gemini_response) {
      await prisma.ai_interactions.update({
        where: { id: interaction.id },
        data: {
          execution_status: 'error',
          error_message: 'Resposta inválida da API de insights',
          execution_time_ms: executionTime
        }
      });
      return res.status(500).json({ error: 'Resposta inválida da API de insights' });
    }

    // 6. Atualizar interação com sucesso
    await prisma.ai_interactions.update({
      where: { id: interaction.id },
      data: {
        execution_status: 'success',
        ai_response: { gemini_response: response.data.gemini_response },
        execution_time_ms: executionTime
      }
    });
    // 7. Criar insight
    const insight = await prisma.ai_insights.create({
      data: {
        interaction_id: interaction.id,
        user_id: req.user.id,
        insight_type,
        title,
        description: response.data.gemini_response,
        data_analysis,
        confidence_level,
        impact_score,
        status,
        expires_at: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      insight,
      session: {
        id: session.id,
        session_token: session.session_token
      },
      interaction: {
        id: interaction.id,
        execution_time: executionTime,
        type: 'insight'
      }
    });
  } catch (error) {
    console.error('Erro ao criar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar insight
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      data_analysis,
      confidence_level,
      impact_score,
      status,
      expires_at
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (data_analysis !== undefined) updateData.data_analysis = data_analysis;
    if (confidence_level !== undefined) updateData.confidence_level = confidence_level;
    if (impact_score !== undefined) updateData.impact_score = impact_score;
    if (status !== undefined) updateData.status = status;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;

    const insight = await prisma.ai_insights.updateMany({
      where: { id: Number(req.params.id) },
      data: updateData
    });

    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }

    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id) },
      include: {
        interaction: {
          select: {
            id: true,
            interaction_type: true,
            input_text: true
          }
        }
      }
    });

    res.json(updatedInsight);
  } catch (error) {
    console.error('Erro ao atualizar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar insight
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedInsight = await prisma.ai_insights.deleteMany({
      where: { id: Number(req.params.id) }
    });

    if (deletedInsight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }

    res.json({ success: true, message: 'Insight removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Arquivar insight
router.post('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const insight = await prisma.ai_insights.updateMany({
      where: { id: Number(req.params.id) },
      data: { status: 'archived' }
    });

    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }

    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id) }
    });

    res.json(updatedInsight);
  } catch (error) {
    console.error('Erro ao arquivar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dispensar insight
router.post('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const insight = await prisma.ai_insights.updateMany({
      where: { id: Number(req.params.id) },
      data: { status: 'dismissed' }
    });

    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }

    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id) }
    });

    res.json(updatedInsight);
  } catch (error) {
    console.error('Erro ao dispensar insight:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar insights por interação
router.get('/interaction/:interactionId', authMiddleware, async (req, res) => {
  try {
    const { interactionId } = req.params;

    // Verificar se a interação pertence ao usuário
    const interaction = await prisma.ai_interactions.findFirst({
      where: { id: Number(interactionId), user_id: req.user.id }
    });

    if (!interaction) {
      return res.status(404).json({ error: 'Interação não encontrada ou não pertence ao usuário' });
    }

    const insights = await prisma.ai_insights.findMany({
      where: { interaction_id: Number(interactionId) },
      orderBy: { created_at: 'desc' }
    });

    res.json(insights);
  } catch (error) {
    console.error('Erro ao buscar insights da interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar insights expirados
router.delete('/cleanup/expired', authMiddleware, async (req, res) => {
  try {
    const deletedInsights = await prisma.ai_insights.deleteMany({
      where: {
        user_id: req.user.id,
        expires_at: {
          lt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: `${deletedInsights.count} insights expirados removidos`
    });
  } catch (error) {
    console.error('Erro ao limpar insights expirados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
