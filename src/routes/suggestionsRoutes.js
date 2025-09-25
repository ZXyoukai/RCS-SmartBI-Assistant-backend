const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar sugestões do usuário
router.get('/', authMiddleware, async (req, res) => {
  const suggestions = await prisma.suggestions.findMany({ where: { user_id: req.user.id } });
  res.json(suggestions);
});

// Criar sugestão
router.post('/', authMiddleware, async (req, res) => {
  const { content, source } = req.body;
  const suggestion = await prisma.suggestions.create({ data: { user_id: req.user.id, content, source } });
  res.status(201).json(suggestion);
});

module.exports = router;
