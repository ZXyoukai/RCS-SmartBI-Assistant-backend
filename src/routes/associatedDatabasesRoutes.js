const express = require('express');
const router = express.Router();
const controller = require('../controllers/associatedDatabasesController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin']), controller.createDatabase);
router.get('/', authMiddleware, controller.listDatabases);
router.get('/:id', authMiddleware, controller.getDatabase);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), controller.updateDatabase);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), controller.deleteDatabase);

module.exports = router;
