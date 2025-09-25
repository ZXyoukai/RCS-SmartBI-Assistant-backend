const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar histórico do usuário
router.get('/', authMiddleware, async (req, res) => {
  const history = await prisma.history.findMany({ where: { user_id: req.user.id } });
  res.json(history);
});

// Buscar histórico por ID
router.get('/:id', authMiddleware, async (req, res) => {
  const item = await prisma.history.findFirst({ where: { id: Number(req.params.id), user_id: req.user.id } });
  if (!item) return res.status(404).json({ error: 'Histórico não encontrado' });
  res.json(item);
});

module.exports = router;
