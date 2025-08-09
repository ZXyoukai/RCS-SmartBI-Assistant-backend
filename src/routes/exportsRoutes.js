const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/authMiddleware');

// Listar exports do usuário
router.get('/', auth, async (req, res) => {
  const exportsList = await prisma.exports.findMany({ where: { user_id: req.user.id } });
  res.json(exportsList);
});

// Criar novo export
router.post('/', auth, async (req, res) => {
  const { file_type, file_path } = req.body;
  const exp = await prisma.exports.create({ data: { user_id: req.user.id, file_type, file_path } });
  res.status(201).json(exp);
});

module.exports = router;
