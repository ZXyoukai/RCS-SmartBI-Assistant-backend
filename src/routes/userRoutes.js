const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require("../middleware/authMiddleware")

router.get('/', auth ,userController.getAllUsers);
router.get('/:id', userController.getUser);
router.get('/allowed', userController.getAllUsers);
router.post('/', userController.createUser);

module.exports = router;