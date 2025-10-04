const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Função auxiliar para gerar hash
const generateHash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

// Buscar resposta no cache (apenas GET para otimização)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { input_text, interaction_type } = req.query;
    
    if (!input_text || !interaction_type) {
      return res.status(400).json({ 
        error: 'Texto de entrada e tipo de interação são obrigatórios' 
      });
    }
    
    const inputHash = generateHash(input_text + interaction_type);
    
    const cachedResponse = await prisma.ai_response_cache.findUnique({
      where: { 
        input_hash: inputHash,
        expires_at: {
          gte: new Date()
        }
      }
    });
    
    if (cachedResponse) {
      // Incrementar hit count
      await prisma.ai_response_cache.update({
        where: { id: cachedResponse.id },
        data: { 
          hit_count: { increment: 1 },
          updated_at: new Date()
        }
      });
      
      res.json({
        cached: true,
        data: cachedResponse.response_data,
        hit_count: cachedResponse.hit_count + 1
      });
    } else {
      res.json({
        cached: false,
        message: 'Resposta não encontrada no cache'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar no cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar entradas do cache (admin apenas)
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, interaction_type } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      expires_at: {
        gte: new Date()
      }
    };
    if (interaction_type) whereClause.interaction_type = interaction_type;
    
    const cacheEntries = await prisma.ai_response_cache.findMany({
      where: whereClause,
      orderBy: [
        { hit_count: 'desc' },
        { updated_at: 'desc' }
      ],
      skip: offset,
      take: parseInt(limit)
    });
    
    const total = await prisma.ai_response_cache.count({ where: whereClause });
    
    res.json({
      data: cacheEntries,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar entrada do cache por ID (admin apenas)
router.get('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const cacheEntry = await prisma.ai_response_cache.findUnique({
      where: { id: Number(req.params.id) }
    });
    
    if (!cacheEntry) return res.status(404).json({ error: 'Entrada do cache não encontrada' });
    res.json(cacheEntry);
  } catch (error) {
    console.error('Erro ao buscar entrada do cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar entrada no cache
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      input_text,
      response_data,
      interaction_type,
      expires_at
    } = req.body;
    
    if (!input_text || !response_data || !interaction_type) {
      return res.status(400).json({ 
        error: 'Texto de entrada, dados de resposta e tipo de interação são obrigatórios' 
      });
    }
    
    const inputHash = generateHash(input_text + interaction_type);
    
    // Verificar se já existe uma entrada com este hash
    const existingEntry = await prisma.ai_response_cache.findUnique({
      where: { input_hash: inputHash }
    });
    
    if (existingEntry) {
      // Atualizar entrada existente
      const updatedEntry = await prisma.ai_response_cache.update({
        where: { input_hash: inputHash },
        data: {
          response_data,
          expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h por padrão
          hit_count: { increment: 1 },
          updated_at: new Date()
        }
      });
      
      return res.json(updatedEntry);
    }
    
    // Criar nova entrada
    const cacheEntry = await prisma.ai_response_cache.create({
      data: {
        input_hash: inputHash,
        input_text,
        response_data,
        interaction_type,
        expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h por padrão
      }
    });
    
    res.status(201).json(cacheEntry);
  } catch (error) {
    console.error('Erro ao criar entrada no cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar entrada do cache (admin apenas)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { response_data, expires_at } = req.body;
    
    const updateData = {};
    if (response_data !== undefined) updateData.response_data = response_data;
    if (expires_at !== undefined) updateData.expires_at = new Date(expires_at);
    
    const cacheEntry = await prisma.ai_response_cache.update({
      where: { id: Number(req.params.id) },
      data: updateData
    });
    
    res.json(cacheEntry);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Entrada do cache não encontrada' });
    }
    console.error('Erro ao atualizar cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar entrada do cache (admin apenas)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    await prisma.ai_response_cache.delete({
      where: { id: Number(req.params.id) }
    });
    
    res.json({ success: true, message: 'Entrada do cache removida com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Entrada do cache não encontrada' });
    }
    console.error('Erro ao deletar cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar cache expirado (admin apenas)
router.delete('/cleanup/expired', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const deletedEntries = await prisma.ai_response_cache.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedEntries.count} entradas expiradas removidas do cache` 
    });
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todo o cache (admin apenas)
router.delete('/cleanup/all', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const deletedEntries = await prisma.ai_response_cache.deleteMany({});
    
    res.json({ 
      success: true, 
      message: `${deletedEntries.count} entradas removidas do cache` 
    });
  } catch (error) {
    console.error('Erro ao limpar todo o cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas do cache (admin apenas)
router.get('/stats/summary', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const totalEntries = await prisma.ai_response_cache.count();
    const expiredEntries = await prisma.ai_response_cache.count({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
    const activeEntries = totalEntries - expiredEntries;
    
    const topHitEntries = await prisma.ai_response_cache.findMany({
      orderBy: { hit_count: 'desc' },
      take: 5,
      select: {
        input_text: true,
        interaction_type: true,
        hit_count: true,
        created_at: true
      }
    });
    
    const typeStats = await prisma.ai_response_cache.groupBy({
      by: ['interaction_type'],
      _count: {
        _all: true
      },
      _sum: {
        hit_count: true
      }
    });
    
    res.json({
      total_entries: totalEntries,
      active_entries: activeEntries,
      expired_entries: expiredEntries,
      top_hit_entries: topHitEntries,
      type_statistics: typeStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
