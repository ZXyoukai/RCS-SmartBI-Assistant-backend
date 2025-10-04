const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar todos os resultados de uma query do usuário
router.get('/query/:queryId', authMiddleware, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar se a query pertence ao usuário
    const query = await prisma.queries.findFirst({
      where: { id: Number(queryId), user_id: req.user.id }
    });
    
    if (!query) {
      return res.status(404).json({ error: 'Query não encontrada ou não pertence ao usuário' });
    }
    
    const results = await prisma.results.findMany({ 
      where: { query_id: Number(queryId) },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            user_id: true
          }
        }
      }
    });
    
    const total = await prisma.results.count({ where: { query_id: Number(queryId) } });
    
    res.json({
      data: results,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar resultado por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await prisma.results.findUnique({ 
      where: { id: Number(req.params.id) },
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            user_id: true
          }
        }
      }
    });
    
    if (!result) return res.status(404).json({ error: 'Resultado não encontrado' });
    
    // Verificar se o resultado pertence ao usuário através da query
    if (result.query.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar resultado
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { query_id, result_type, content } = req.body;
    
    if (!query_id) {
      return res.status(400).json({ error: 'ID da query é obrigatório' });
    }
    
    // Verificar se a query pertence ao usuário
    const query = await prisma.queries.findFirst({
      where: { id: Number(query_id), user_id: req.user.id }
    });
    
    if (!query) {
      return res.status(400).json({ error: 'Query não encontrada ou não pertence ao usuário' });
    }
    
    const result = await prisma.results.create({
      data: {
        query_id: Number(query_id),
        result_type: result_type || 'data',
        content: content || null
      },
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            user_id: true
          }
        }
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar resultado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar resultado
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { result_type, content } = req.body;
    
    // Primeiro verificar se o resultado existe e pertence ao usuário
    const existingResult = await prisma.results.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        query: {
          select: {
            user_id: true
          }
        }
      }
    });
    
    if (!existingResult) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }
    
    if (existingResult.query.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const updateData = {};
    if (result_type !== undefined) updateData.result_type = result_type;
    if (content !== undefined) updateData.content = content;
    
    const result = await prisma.results.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            user_id: true
          }
        }
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar resultado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar resultado
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Primeiro verificar se o resultado existe e pertence ao usuário
    const existingResult = await prisma.results.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        query: {
          select: {
            user_id: true
          }
        }
      }
    });
    
    if (!existingResult) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }
    
    if (existingResult.query.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await prisma.results.delete({
      where: { id: Number(req.params.id) }
    });
    
    res.json({ success: true, message: 'Resultado removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar resultado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todos os resultados do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, result_type } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      query: {
        user_id: req.user.id
      }
    };
    
    if (result_type) {
      whereClause.result_type = result_type;
    }
    
    const results = await prisma.results.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        query: {
          select: {
            id: true,
            question_text: true,
            user_id: true
          }
        }
      }
    });
    
    const total = await prisma.results.count({ where: whereClause });
    
    res.json({
      data: results,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resultados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
