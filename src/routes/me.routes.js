const express = require('express');
const router = express.Router();
const meController = require('../controllers/me.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, meController.getMe);

module.exports = router;