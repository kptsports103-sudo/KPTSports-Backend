const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const {
  getCloudinaryUsage,
  getCloudinaryStats,
  logMediaActivity,
  predictMediaUsage,
  getMediaHeatmap,
} = require('../controllers/media.controller');

const router = express.Router();

router.post('/log', logMediaActivity);
router.post('/track', logMediaActivity);
router.get('/predict', authMiddleware, predictMediaUsage);
router.get('/usage', authMiddleware, roleMiddleware(['superadmin']), getCloudinaryUsage);
router.get('/stats', authMiddleware, roleMiddleware(['superadmin']), getCloudinaryStats);
router.get('/heatmap', authMiddleware, roleMiddleware(['superadmin']), getMediaHeatmap);

module.exports = router;
