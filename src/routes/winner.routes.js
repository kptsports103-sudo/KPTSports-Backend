const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const winnerController = require('../controllers/winner.controller');

const router = express.Router();

router.get('/', winnerController.getWinners);
router.post('/', authMiddleware, roleMiddleware(['creator']), winnerController.createWinner);
router.put('/:id', authMiddleware, roleMiddleware(['creator']), winnerController.updateWinner);
router.delete('/:id', authMiddleware, roleMiddleware(['creator']), winnerController.deleteWinner);

module.exports = router;
