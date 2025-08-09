const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/authMiddleware');

// Listar todas as queries do usuário autenticado
router.get('/', auth, async (req, res) => {
  const queries = await prisma.queries.findMany({ where: { user_id: req.user.id } });
  res.json(queries);
});

// Criar nova query
router.post('/', auth, async (req, res) => {
  const { question_text } = req.body;
  const query = await prisma.queries.create({ data: { user_id: req.user.id, question_text } });
  res.status(201).json(query);
});

// Buscar query por ID (apenas do próprio usuário)
router.get('/:id', auth, async (req, res) => {
  const query = await prisma.queries.findFirst({ where: { id: Number(req.params.id), user_id: req.user.id } });
  if (!query) return res.status(404).json({ error: 'Query não encontrada' });
  res.json(query);
});

// Deletar query (apenas do próprio usuário)
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.queries.delete({ where: { id: Number(req.params.id), user_id: req.user.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Query não encontrada' });
  }
});

module.exports = router;
