const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/authMiddleware');

// Listar logs de acesso do usuário
router.get('/', authMiddleware, async (req, res) => {
  const logs = await prisma.access_logs.findMany({ where: { user_id: req.user.id } });
  res.json(logs);
});

module.exports = router;
