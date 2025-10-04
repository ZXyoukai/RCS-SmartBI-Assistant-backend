const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

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
      interaction_id,
      insight_type,
      title,
      description,
      data_analysis,
      confidence_level,
      impact_score,
      status = 'active',
      expires_at
    } = req.body;
    
    if (!insight_type || !title || !description || !data_analysis) {
      return res.status(400).json({ 
        error: 'Tipo, título, descrição e análise de dados são obrigatórios' 
      });
    }
    
    // Se interaction_id for fornecido, verificar se pertence ao usuário
    if (interaction_id) {
      const interaction = await prisma.ai_interactions.findFirst({
        where: { id: Number(interaction_id), user_id: req.user.id }
      });
      
      if (!interaction) {
        return res.status(400).json({ error: 'Interação não encontrada ou não pertence ao usuário' });
      }
    }
    
    const insight = await prisma.ai_insights.create({
      data: {
        interaction_id: interaction_id ? Number(interaction_id) : null,
        user_id: req.user.id,
        insight_type,
        title,
        description,
        data_analysis,
        confidence_level,
        impact_score,
        status,
        expires_at: expires_at ? new Date(expires_at) : null
      },
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
    
    res.status(201).json(insight);
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
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }
    
    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
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
      where: { id: Number(req.params.id), user_id: req.user.id }
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
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: { status: 'archived' }
    });
    
    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }
    
    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
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
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: { status: 'dismissed' }
    });
    
    if (insight.count === 0) {
      return res.status(404).json({ error: 'Insight não encontrado' });
    }
    
    const updatedInsight = await prisma.ai_insights.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
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
