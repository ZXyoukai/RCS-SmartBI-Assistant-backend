const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async createDatabase(req, res) {
    try {
      const { name, url, schema, description } = req.body;
      if (!schema || !name) {
        return res.status(400).json({ error: 'Schema e nome são obrigatórios.' });
      }
      const db = await prisma.associated_databases.create({
        data: { name, url, schema, description }
      });
      res.status(201).json(db);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async listDatabases(req, res) {
    try {
      const dbs = await prisma.associated_databases.findMany();
      res.json(dbs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDatabase(req, res) {
    try {
      const { id } = req.params;
      const db = await prisma.associated_databases.findUnique({ where: { id: Number(id) } });
      if (!db) return res.status(404).json({ error: 'Banco não encontrado.' });
      res.json(db);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
