const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar interações do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, session_id, interaction_type, execution_status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: req.user.id };
    if (session_id) whereClause.session_id = Number(session_id);
    if (interaction_type) whereClause.interaction_type = interaction_type;
    if (execution_status) whereClause.execution_status = execution_status;
    
    const interactions = await prisma.ai_interactions.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        session: {
          select: {
            id: true,
            session_token: true,
            status: true
          }
        },
        _count: {
          select: { insights: true }
        }
      }
    });
    
    const total = await prisma.ai_interactions.count({ where: whereClause });
    
    res.json({
      data: interactions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar interação por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const interaction = await prisma.ai_interactions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        session: true,
        insights: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!interaction) return res.status(404).json({ error: 'Interação não encontrada' });
    res.json(interaction);
  } catch (error) {
    console.error('Erro ao buscar interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova interação
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      session_id, 
      interaction_type, 
      input_text, 
      input_language = 'pt-BR',
      processed_query,
      ai_response,
      execution_status = 'pending',
      execution_time_ms,
      confidence_score,
      error_message,
      fallback_used = false,
      version = '1.0',
      metadata
    } = req.body;
    
    if (!session_id || !interaction_type || !input_text) {
      return res.status(400).json({ 
        error: 'Session ID, tipo de interação e texto de entrada são obrigatórios' 
      });
    }
    
    // Verificar se a sessão pertence ao usuário
    const session = await prisma.ai_chat_sessions.findFirst({
      where: { id: Number(session_id), user_id: req.user.id }
    });
    
    if (!session) {
      return res.status(400).json({ error: 'Sessão não encontrada ou não pertence ao usuário' });
    }
    
    const interaction = await prisma.ai_interactions.create({
      data: {
        session_id: Number(session_id),
        user_id: req.user.id,
        interaction_type,
        input_text,
        input_language,
        processed_query,
        ai_response,
        execution_status,
        execution_time_ms,
        confidence_score,
        error_message,
        fallback_used,
        version,
        metadata
      },
      include: {
        session: {
          select: {
            id: true,
            session_token: true,
            status: true
          }
        }
      }
    });
    
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Erro ao criar interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar interação
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { 
      processed_query,
      ai_response,
      execution_status,
      execution_time_ms,
      confidence_score,
      error_message,
      fallback_used,
      metadata
    } = req.body;
    
    const updateData = {};
    if (processed_query !== undefined) updateData.processed_query = processed_query;
    if (ai_response !== undefined) updateData.ai_response = ai_response;
    if (execution_status !== undefined) updateData.execution_status = execution_status;
    if (execution_time_ms !== undefined) updateData.execution_time_ms = execution_time_ms;
    if (confidence_score !== undefined) updateData.confidence_score = confidence_score;
    if (error_message !== undefined) updateData.error_message = error_message;
    if (fallback_used !== undefined) updateData.fallback_used = fallback_used;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    const interaction = await prisma.ai_interactions.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (interaction.count === 0) {
      return res.status(404).json({ error: 'Interação não encontrada' });
    }
    
    const updatedInteraction = await prisma.ai_interactions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        session: {
          select: {
            id: true,
            session_token: true,
            status: true
          }
        }
      }
    });
    
    res.json(updatedInteraction);
  } catch (error) {
    console.error('Erro ao atualizar interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar interação
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedInteraction = await prisma.ai_interactions.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (deletedInteraction.count === 0) {
      return res.status(404).json({ error: 'Interação não encontrada' });
    }
    
    res.json({ success: true, message: 'Interação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar interações por sessão
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar se a sessão pertence ao usuário
    const session = await prisma.ai_chat_sessions.findFirst({
      where: { id: Number(sessionId), user_id: req.user.id }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada ou não pertence ao usuário' });
    }
    
    const interactions = await prisma.ai_interactions.findMany({
      where: { session_id: Number(sessionId) },
      orderBy: { created_at: 'asc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        insights: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    const total = await prisma.ai_interactions.count({ 
      where: { session_id: Number(sessionId) } 
    });
    
    res.json({
      data: interactions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar interações da sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
