const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar sugestões do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, source } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: req.user.id };
    if (source) whereClause.source = source;
    
    const suggestions = await prisma.suggestions.findMany({ 
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    
    const total = await prisma.suggestions.count({ where: whereClause });
    
    res.json({
      data: suggestions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar sugestão por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const suggestion = await prisma.suggestions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    if (!suggestion) return res.status(404).json({ error: 'Sugestão não encontrada' });
    res.json(suggestion);
  } catch (error) {
    console.error('Erro ao buscar sugestão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar sugestão
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, source } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da sugestão é obrigatório' });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Conteúdo da sugestão muito longo (máximo 1000 caracteres)' });
    }
    
    const suggestion = await prisma.suggestions.create({ 
      data: { 
        user_id: req.user.id, 
        content: content.trim(), 
        source: source || 'user' 
      } 
    });
    
    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Erro ao criar sugestão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar sugestão
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, source } = req.body;
    
    const updateData = {};
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Conteúdo da sugestão é obrigatório' });
      }
      if (content.length > 1000) {
        return res.status(400).json({ error: 'Conteúdo da sugestão muito longo (máximo 1000 caracteres)' });
      }
      updateData.content = content.trim();
    }
    if (source !== undefined) updateData.source = source;
    
    const suggestion = await prisma.suggestions.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (suggestion.count === 0) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }
    
    const updatedSuggestion = await prisma.suggestions.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    res.json(updatedSuggestion);
  } catch (error) {
    console.error('Erro ao atualizar sugestão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar sugestão
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedSuggestion = await prisma.suggestions.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (deletedSuggestion.count === 0) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }
    
    res.json({ success: true, message: 'Sugestão removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sugestão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todas as sugestões do usuário
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const deletedSuggestions = await prisma.suggestions.deleteMany({
      where: { user_id: req.user.id }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedSuggestions.count} sugestões removidas com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao limpar sugestões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
