const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async () => {
  return prisma.user.findMany();
};

exports.createUser = async (data) => {
  return prisma.user.create({ data });
};