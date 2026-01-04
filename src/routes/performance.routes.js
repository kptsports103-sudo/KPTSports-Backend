const express = require('express');
const { getPerformances, savePerformances } = require('../controllers/performance.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, getPerformances);
router.post('/', auth, savePerformances);

module.exports = router;