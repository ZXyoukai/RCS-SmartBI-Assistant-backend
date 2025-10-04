const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Listar logs de acesso do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: req.user.id };
    if (action) whereClause.action = action;
    
    const logs = await prisma.access_logs.findMany({ 
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    
    const total = await prisma.access_logs.count({ where: whereClause });
    
    res.json({
      data: logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar log por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.access_logs.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    if (!log) return res.status(404).json({ error: 'Log não encontrado' });
    res.json(log);
  } catch (error) {
    console.error('Erro ao buscar log:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar log de acesso
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { action, ip_address } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Ação é obrigatória' });
    }
    
    const log = await prisma.access_logs.create({
      data: {
        user_id: req.user.id,
        action: action,
        ip_address: ip_address || req.ip || req.connection.remoteAddress
      }
    });
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Erro ao criar log:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todos os logs (apenas admin)
router.get('/admin/all', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (user_id) whereClause.user_id = Number(user_id);
    if (action) whereClause.action = action;
    
    const logs = await prisma.access_logs.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    const total = await prisma.access_logs.count({ where: whereClause });
    
    res.json({
      data: logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar todos os logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar logs antigos (apenas admin)
router.delete('/admin/cleanup', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const deletedLogs = await prisma.access_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate
        }
      }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedLogs.count} logs removidos (mais antigos que ${days} dias)` 
    });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
