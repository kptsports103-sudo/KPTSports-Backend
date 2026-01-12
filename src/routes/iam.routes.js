const express = require('express');
const { createUser, getUsers, verifyOTP, resendOTP, deleteUser } = require('../controllers/iam.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// GET /api/iam/users - Get all users (admin only)
router.get('/users', authMiddleware, roleMiddleware(['admin', 'Super Admin']), getUsers);

// POST /api/iam/users - Create new user (admin only)
router.post('/users', authMiddleware, roleMiddleware(['admin', 'Super Admin']), createUser);

// DELETE /api/iam/users/:userId - Delete user (admin only)
router.delete('/users/:userId', authMiddleware, roleMiddleware(['admin', 'Super Admin']), deleteUser);

// POST /api/iam/verify-otp - Verify OTP for user activation
router.post('/verify-otp', authMiddleware, roleMiddleware(['admin', 'Super Admin']), verifyOTP);

// POST /api/iam/resend-otp - Resend OTP to user
router.post('/resend-otp', authMiddleware, roleMiddleware(['admin', 'Super Admin']), resendOTP);

module.exports = router;