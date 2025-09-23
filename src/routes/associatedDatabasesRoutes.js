const express = require('express');
const router = express.Router();
const controller = require('../controllers/associatedDatabasesController');

router.post('/', controller.createDatabase);
router.get('/', controller.listDatabases);
router.get('/:id', controller.getDatabase);

module.exports = router;
