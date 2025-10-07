const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

exports.getAllUsers = async () => {
  try {
    return await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_active: true
      }
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
};

exports.createUser = async (data) => {
  try {
    return await prisma.users.create({ 
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_active: true
      }
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

exports.updateUser = async (id, data) => {
  try {
    return await prisma.users.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_active: true
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

exports.deleteUser = async (id) => {
  try {
    return await prisma.users.delete({
      where: { id }
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw error;
  }
};

exports.getUserById = async (id) => {
  try {
    return await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_active: true
      }
    });
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    throw error;
  }
};

exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};