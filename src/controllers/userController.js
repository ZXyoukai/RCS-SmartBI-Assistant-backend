const userService = require('../services/userService');
const { PrismaClient } = require('@prisma/client');
const { jwtDecode } = require("jwt-decode");
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

exports.getUser = async (req, res ) => {
  let user;
  const id = req.params.id;
  if (!id) return res.status(401).json({ error: 'Id obrigatório' });
  try {
    user = await prisma.users.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.status(200).json(user);
  } catch (error) {
    if (!user) return res.status(404).json({ error: 'erro ao buscar Usuario' });
      res.json(user);
  }
}

exports.createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
};



exports.getUserByToken = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: 'Token obrigatório' });

  try {
    const decoded = jwtDecode(token).split('.');
    console.log("decoded:", decoded);
    const id = decoded; // ou decoded.id, dependendo de como seu token é estruturado

    if (!id) return res.status(401).json({ error: 'Token inválido: ID ausente' });

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};