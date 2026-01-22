const express = require('express');
const { createUser, getUsers, verifyOTP, resendOTP, deleteUser, createToken, resolveToken, sendOTPOnboarding, verifyOTPOnboarding, createUserOnboarding, verifyPhoneOTP } = require('../controllers/iam.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// GET /api/iam/users - Get all users (admin only)
router.get('/users', authMiddleware, roleMiddleware(['admin', 'superadmin']), getUsers);

// POST /api/iam/users - Create new user (admin only)
router.post('/users', authMiddleware, roleMiddleware(['admin', 'superadmin']), createUser);

// DELETE /api/iam/users/:userId - Delete user (admin only)
router.delete('/users/:userId', authMiddleware, roleMiddleware(['admin', 'superadmin']), deleteUser);

// POST /api/iam/verify-otp - Verify OTP for user activation
router.post('/verify-otp', authMiddleware, roleMiddleware(['admin', 'superadmin']), verifyOTP);

// POST /api/iam/resend-otp - Resend OTP to user
router.post('/resend-otp', authMiddleware, roleMiddleware(['admin', 'superadmin']), resendOTP);

// === TOKEN-BASED ONBOARDING SYSTEM ===

// POST /api/iam/create-token - Create invite token (admin only)
router.post('/create-token', authMiddleware, roleMiddleware(['admin', 'superadmin']), createToken);

// GET /api/iam/resolve-token - Resolve token to get phone/role (public)
router.get('/resolve-token', resolveToken);

// POST /api/iam/send-otp - Send OTP for onboarding (public)
router.post('/send-otp', sendOTPOnboarding);

// POST /api/iam/verify-otp - Verify OTP for onboarding (public)
router.post('/verify-otp-onboarding', verifyOTPOnboarding);

// POST /api/iam/create-user - Create user from onboarding (public)
router.post('/create-user', createUserOnboarding);

// POST /api/iam/verify-phone-otp - Verify phone OTP for onboarding (public)
router.post('/verify-phone-otp', verifyPhoneOTP);

// POST /api/iam/verify-phone-otp - Verify phone OTP for onboarding (public)
router.post('/verify-phone-otp', verifyPhoneOTP);

module.exports = router;