const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Listar fallbacks
router.get('/', async (req, res) => {
  const fallbacks = await prisma.ai_fallbacks.findMany();
  res.json(fallbacks);
});
// Criar fallback
router.post('/', roleMiddleware(['admin']), async (req, res) => {
  const { trigger_pattern, fallback_type, response_template, escalation_level } = req.body;
  if (!trigger_pattern || !fallback_type || !response_template) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }
  const fallback = await prisma.ai_fallbacks.create({ data: { trigger_pattern, fallback_type, response_template, escalation_level } });
  res.status(201).json(fallback);
});
// Atualizar fallback
router.put('/:id', roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { response_template, escalation_level, is_active } = req.body;
  const fallback = await prisma.ai_fallbacks.update({ where: { id: Number(id) }, data: { response_template, escalation_level, is_active } });
  res.json(fallback);
});
// Deletar fallback
router.delete('/:id', roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  await prisma.ai_fallbacks.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

module.exports = router;
