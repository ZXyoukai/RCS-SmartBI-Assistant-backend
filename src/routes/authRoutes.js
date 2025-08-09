const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Registro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados obrigatórios' });
  try {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({ data: { name, email, password_hash } });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Dados obrigatórios' });
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

module.exports = router;
