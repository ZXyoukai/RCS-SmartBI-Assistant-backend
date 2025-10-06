const express = require('express');
const router = express.Router();
const controller = require('../controllers/associatedDatabasesController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
// const { uploadMiddleware } = require('../middleware/uploadMiddleware');

// Rotas existentes
router.post('/', authMiddleware, roleMiddleware(['admin']), controller.createDatabase);
router.get('/', authMiddleware, controller.listDatabases);
router.get('/:id', authMiddleware, controller.getDatabase);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), controller.updateDatabase);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), controller.deleteDatabase);

// Novas rotas para upload e conexão
// router.post('/upload', authMiddleware, roleMiddleware(['admin']), uploadMiddleware, controller.uploadFile);
router.post('/test-connection', authMiddleware, roleMiddleware(['admin']), controller.testConnection);
router.post('/connect-database', authMiddleware, roleMiddleware(['admin']), controller.connectDatabase);
router.get('/preview/:id', authMiddleware, controller.previewData);

// Rota para listar tipos suportados
router.get('/info/supported-types', controller.getSupportedTypes);

module.exports = router;
