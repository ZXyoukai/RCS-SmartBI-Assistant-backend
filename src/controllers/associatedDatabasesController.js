const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async createDatabase(req, res) {
    try {
      const { name, url, schema, description } = req.body;
      if (!schema || !name) {
        return res.status(400).json({ error: 'Schema e nome são obrigatórios.' });
      }
      // Validação simples do schema: deve ser um JSON válido com pelo menos uma tabela
      let schemaObj;
      try {
        schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
        if (!schemaObj || typeof schemaObj !== 'object' || !Object.keys(schemaObj).length) {
          return res.status(400).json({ error: 'Schema deve ser um objeto JSON com ao menos uma tabela.' });
        }
      } catch (e) {
        return res.status(400).json({ error: 'Schema inválido. Deve ser JSON.' });
      }
      const db = await prisma.associated_databases.create({
        data: { name, url, schema: JSON.stringify(schemaObj), description }
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
