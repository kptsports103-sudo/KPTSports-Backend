const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/', achievementController.getAchievements);
router.post('/', authMiddleware, roleMiddleware(['admin']), achievementController.createAchievement);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), achievementController.updateAchievement);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), achievementController.deleteAchievement);

module.exports = router;