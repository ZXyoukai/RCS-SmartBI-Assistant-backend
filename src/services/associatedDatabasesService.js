const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDatabase(data) {
  return prisma.associated_databases.create({ data });
}

async function listDatabases() {
  return prisma.associated_databases.findMany();
}

async function getDatabase(id) {
  return prisma.associated_databases.findUnique({ where: { id: Number(id) } });
}

module.exports = {
  createDatabase,
  listDatabases,
  getDatabase
};
