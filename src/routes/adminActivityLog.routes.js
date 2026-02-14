const express = require('express');
const router = express.Router();
const adminActivityLogController = require('../controllers/adminActivityLog.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Create activity log (can be called by any authenticated admin)
router.post('/', authMiddleware, adminActivityLogController.createActivityLog);

// Get current admin's activity logs
router.get('/my-logs', authMiddleware, adminActivityLogController.getMyActivityLogs);

// Get all activity logs (Super Admin only)
router.get('/all', authMiddleware, roleMiddleware(['superadmin']), adminActivityLogController.getAllActivityLogs);

// Get activity logs by admin ID (Super Admin only)
router.get('/admin/:adminId', authMiddleware, roleMiddleware(['superadmin']), adminActivityLogController.getActivityLogsByAdmin);

module.exports = router;
