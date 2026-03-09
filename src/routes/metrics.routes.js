const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { logWebVital, listWebVitals } = require('../controllers/metrics.controller');

const router = express.Router();

// Public endpoint for client vitals ingestion.
router.post('/web-vitals', logWebVital);
// Restricted read endpoint for monitoring dashboards.
router.get('/web-vitals', authMiddleware, roleMiddleware(['superadmin']), listWebVitals);

module.exports = router;
