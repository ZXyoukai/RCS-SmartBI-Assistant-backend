const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar todos os resultados de uma query do usuário
router.get('/query/:queryId', authMiddleware, async (req, res) => {
  const results = await prisma.results.findMany({ where: { query_id: Number(req.params.queryId) } });
  res.json(results);
});

// Buscar resultado por ID
router.get('/:id', authMiddleware, async (req, res) => {
  const result = await prisma.results.findUnique({ where: { id: Number(req.params.id) } });
  if (!result) return res.status(404).json({ error: 'Resultado não encontrado' });
  res.json(result);
});

module.exports = router;
