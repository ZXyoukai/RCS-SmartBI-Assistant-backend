const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs');

// Listar exports do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, file_type } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { user_id: req.user.id };
    if (file_type) whereClause.file_type = file_type;
    
    const exportsList = await prisma.exports.findMany({ 
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    
    const total = await prisma.exports.count({ where: whereClause });
    
    res.json({
      data: exportsList,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar exports:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar export por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exportItem = await prisma.exports.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (!exportItem) return res.status(404).json({ error: 'Export não encontrado' });
    res.json(exportItem);
  } catch (error) {
    console.error('Erro ao buscar export:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo export
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { file_type, file_path } = req.body;
    
    if (!file_type) {
      return res.status(400).json({ error: 'Tipo de arquivo é obrigatório' });
    }
    
    const allowedTypes = ['csv', 'xlsx', 'json', 'pdf'];
    if (!allowedTypes.includes(file_type.toLowerCase())) {
      return res.status(400).json({ 
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}` 
      });
    }
    
    const exp = await prisma.exports.create({ 
      data: { 
        user_id: req.user.id, 
        file_type: file_type.toLowerCase(), 
        file_path: file_path || null 
      } 
    });
    
    res.status(201).json(exp);
  } catch (error) {
    console.error('Erro ao criar export:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar export
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { file_type, file_path } = req.body;
    
    const updateData = {};
    if (file_type !== undefined) {
      const allowedTypes = ['csv', 'xlsx', 'json', 'pdf'];
      if (!allowedTypes.includes(file_type.toLowerCase())) {
        return res.status(400).json({ 
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}` 
        });
      }
      updateData.file_type = file_type.toLowerCase();
    }
    if (file_path !== undefined) updateData.file_path = file_path;
    
    const exportItem = await prisma.exports.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
      data: updateData
    });
    
    if (exportItem.count === 0) {
      return res.status(404).json({ error: 'Export não encontrado' });
    }
    
    const updatedExport = await prisma.exports.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    res.json(updatedExport);
  } catch (error) {
    console.error('Erro ao atualizar export:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar export
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Buscar o export primeiro para verificar se existe arquivo
    const exportItem = await prisma.exports.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (!exportItem) {
      return res.status(404).json({ error: 'Export não encontrado' });
    }
    
    // Deletar arquivo físico se existir
    if (exportItem.file_path && fs.existsSync(exportItem.file_path)) {
      try {
        fs.unlinkSync(exportItem.file_path);
      } catch (fileError) {
        console.warn('Erro ao deletar arquivo físico:', fileError);
      }
    }
    
    // Deletar registro do banco
    await prisma.exports.delete({
      where: { id: Number(req.params.id) }
    });
    
    res.json({ success: true, message: 'Export removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar export:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Download do arquivo de export
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const exportItem = await prisma.exports.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id }
    });
    
    if (!exportItem) {
      return res.status(404).json({ error: 'Export não encontrado' });
    }
    
    if (!exportItem.file_path || !fs.existsSync(exportItem.file_path)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const fileName = path.basename(exportItem.file_path);
    res.download(exportItem.file_path, fileName);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar exports antigos (mais de 30 dias)
router.delete('/cleanup/old', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    // Buscar exports antigos primeiro para deletar arquivos
    const oldExports = await prisma.exports.findMany({
      where: {
        user_id: req.user.id,
        created_at: {
          lt: cutoffDate
        }
      }
    });
    
    // Deletar arquivos físicos
    let filesDeleted = 0;
    for (const exp of oldExports) {
      if (exp.file_path && fs.existsSync(exp.file_path)) {
        try {
          fs.unlinkSync(exp.file_path);
          filesDeleted++;
        } catch (fileError) {
          console.warn('Erro ao deletar arquivo:', fileError);
        }
      }
    }
    
    // Deletar registros do banco
    const deletedExports = await prisma.exports.deleteMany({
      where: {
        user_id: req.user.id,
        created_at: {
          lt: cutoffDate
        }
      }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedExports.count} exports removidos (${filesDeleted} arquivos deletados)` 
    });
  } catch (error) {
    console.error('Erro ao limpar exports antigos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
