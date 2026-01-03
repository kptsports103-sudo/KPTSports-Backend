const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/', resultController.getResults);
router.post('/', authMiddleware, roleMiddleware(['admin']), resultController.createResult);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), resultController.updateResult);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), resultController.deleteResult);

module.exports = router;