const userService = require('../services/userService');
const { PrismaClient } = require('@prisma/client');
const { jwtDecode } = require("jwt-decode");
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getUser = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Id obrigatório' });

  try {
    const user = await prisma.users.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const data = { ...req.body };

    if (data.password) {
      const password_hash = await userService.hashPassword(data.password);
      delete data.password;
      data.password_hash = password_hash;
    }

    const user = await userService.updateUser(id, data);
    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(id);
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getUserByToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token obrigatório' });
    }

    const decoded = jwtDecode(token);
    const user = await prisma.users.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário por token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};