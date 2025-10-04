const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Listar sessões de chat do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: req.user.id };
    if (status) whereClause.status = status;
    
    const sessions = await prisma.ai_chat_sessions.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        _count: {
          select: { interactions: true }
        }
      }
    });
    
    const total = await prisma.ai_chat_sessions.count({ where: whereClause });
    
    res.json({
      data: sessions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar sessões de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar sessão por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await prisma.ai_chat_sessions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        interactions: {
          orderBy: { created_at: 'asc' },
          take: 50 // Limitar as interações para não sobrecarregar
        },
        _count: {
          select: { interactions: true }
        }
      }
    });
    
    if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.json(session);
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova sessão de chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { context_data } = req.body;
    
    const session = await prisma.ai_chat_sessions.create({
      data: {
        user_id: req.user.id,
        session_token: uuidv4(),
        status: 'active',
        context_data: context_data || null
      }
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar sessão
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, context_data } = req.body;
    
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (context_data !== undefined) updateData.context_data = context_data;
    
    const session = await prisma.ai_chat_sessions.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (session.count === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    
    const updatedSession = await prisma.ai_chat_sessions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar sessão
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedSession = await prisma.ai_chat_sessions.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (deletedSession.count === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    
    res.json({ success: true, message: 'Sessão removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Arquivar sessão
router.post('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const session = await prisma.ai_chat_sessions.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: { status: 'archived' }
    });
    
    if (session.count === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    
    const updatedSession = await prisma.ai_chat_sessions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Erro ao arquivar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
