const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar todas as queries do usuário autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const queries = await prisma.queries.findMany({ 
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        _count: {
          select: { 
            results: true,
            history: true
          }
        }
      }
    });
    
    const total = await prisma.queries.count({ where: { user_id: req.user.id } });
    
    res.json({
      data: queries,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar queries:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar query por ID (apenas do próprio usuário)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const query = await prisma.queries.findFirst({ 
      where: { id: Number(req.params.id), user_id: req.user.id },
      include: {
        results: {
          orderBy: { created_at: 'desc' }
        },
        history: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!query) return res.status(404).json({ error: 'Query não encontrada' });
    res.json(query);
  } catch (error) {
    console.error('Erro ao buscar query:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova query
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { question_text } = req.body;
    
    if (!question_text || question_text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto da pergunta é obrigatório' });
    }
    
    if (question_text.length > 2000) {
      return res.status(400).json({ error: 'Texto da pergunta muito longo (máximo 2000 caracteres)' });
    }
    
    const query = await prisma.queries.create({ 
      data: { 
        user_id: req.user.id, 
        question_text: question_text.trim() 
      } 
    });
    
    res.status(201).json(query);
  } catch (error) {
    console.error('Erro ao criar query:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar query
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { question_text } = req.body;
    
    if (!question_text || question_text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto da pergunta é obrigatório' });
    }
    
    if (question_text.length > 2000) {
      return res.status(400).json({ error: 'Texto da pergunta muito longo (máximo 2000 caracteres)' });
    }
    
    const query = await prisma.queries.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: { question_text: question_text.trim() }
    });
    
    if (query.count === 0) {
      return res.status(404).json({ error: 'Query não encontrada' });
    }
    
    const updatedQuery = await prisma.queries.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    res.json(updatedQuery);
  } catch (error) {
    console.error('Erro ao atualizar query:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar query (apenas do próprio usuário)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedQuery = await prisma.queries.deleteMany({ 
      where: { id: Number(req.params.id), user_id: req.user.id } 
    });
    
    if (deletedQuery.count === 0) {
      return res.status(404).json({ error: 'Query não encontrada' });
    }
    
    res.json({ success: true, message: 'Query removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar query:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
