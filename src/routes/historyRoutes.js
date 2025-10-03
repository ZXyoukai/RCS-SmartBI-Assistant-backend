const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar histórico do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const history = await prisma.history.findMany({ 
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            created_at: true
          }
        }
      }
    });
    
    const total = await prisma.history.count({ where: { user_id: req.user.id } });
    
    res.json({
      data: history,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar histórico por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.history.findFirst({ 
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        query: true
      }
    });
    if (!item) return res.status(404).json({ error: 'Histórico não encontrado' });
    res.json(item);
  } catch (error) {
    console.error('Erro ao buscar item do histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar item no histórico
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { query_id, success, execution_time } = req.body;
    
    if (query_id && typeof query_id === 'number') {
      // Verificar se a query pertence ao usuário
      const query = await prisma.queries.findFirst({
        where: { id: query_id, user_id: req.user.id }
      });
      if (!query) {
        return res.status(400).json({ error: 'Query não encontrada ou não pertence ao usuário' });
      }
    }
    
    const historyItem = await prisma.history.create({
      data: {
        user_id: req.user.id,
        query_id: query_id || null,
        success: success !== undefined ? success : null,
        execution_time: execution_time !== undefined ? execution_time : null
      },
      include: {
        query: true
      }
    });
    
    res.status(201).json(historyItem);
  } catch (error) {
    console.error('Erro ao criar item do histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar item do histórico
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { success, execution_time } = req.body;
    
    const updateData = {};
    if (success !== undefined) updateData.success = success;
    if (execution_time !== undefined) updateData.execution_time = execution_time;
    
    const historyItem = await prisma.history.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (historyItem.count === 0) {
      return res.status(404).json({ error: 'Histórico não encontrado' });
    }
    
    const updatedItem = await prisma.history.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: { query: true }
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Erro ao atualizar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar item do histórico
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedItem = await prisma.history.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (deletedItem.count === 0) {
      return res.status(404).json({ error: 'Histórico não encontrado' });
    }
    
    res.json({ success: true, message: 'Item do histórico removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todo o histórico do usuário
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const deletedItems = await prisma.history.deleteMany({
      where: { user_id: req.user.id }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedItems.count} itens do histórico removidos com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
