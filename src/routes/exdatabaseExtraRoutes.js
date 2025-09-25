const express = require('express');
const router = express.Router();
const prisma = require('../controllers/associatedDatabasesController');
const externalDbService = require('../services/externalDbService');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Middleware de autenticação
router.use(authMiddleware);

// Testar conexão
router.post('/:id/test', roleMiddleware(['admin']), async (req, res) => {
  try {
    const db = await prisma.getDatabase({ params: { id: req.params.id } }, res);
    if (!db || !db.url) return res.status(400).json({ error: 'Banco não encontrado ou sem URL.' });
    await externalDbService.testConnection(db.url);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Executar query read-only
router.post('/:id/execute', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { query } = req.body;
    const db = await prisma.getDatabase({ params: { id: req.params.id } }, res);
    if (!db || !db.url) return res.status(400).json({ error: 'Banco não encontrado ou sem URL.' });
    const rows = await externalDbService.executeReadOnlyQuery(db.url, query);
    res.json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retornar schema cadastrado
router.get('/:id/schema', async (req, res) => {
  try {
    const db = await prisma.getDatabase({ params: { id: req.params.id } }, res);
    if (!db) return res.status(404).json({ error: 'Banco não encontrado.' });
    res.json({ schema: db.schema });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
