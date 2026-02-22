const express = require('express');
const {
  createUser,
  getUsers,
  verifyOTP,
  resendOTP,
  deleteUser,
  createToken,
  resolveToken,
  sendOTPOnboarding,
  verifyOTPOnboarding,
  createUserOnboarding,
  verifyPhoneOTP,
  verifyPhoneOTPWithLogin
} = require('../controllers/iam.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { normalizeRole } = require('../utils/roles');

const router = express.Router();

const exactRoleMiddleware = (roles = []) => (req, res, next) => {
  const userRole = normalizeRole(req.user?.role);
  if (!userRole || !roles.includes(userRole)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
};

// GET /api/iam/users - Get all users (admin and creator only)
router.get('/users', authMiddleware, exactRoleMiddleware(['admin', 'creator']), getUsers);

// POST /api/iam/users - Create new user (superadmin only)
router.post('/users', authMiddleware, roleMiddleware(['superadmin']), createUser);

// DELETE /api/iam/users/:userId - Delete user (creator only)
router.delete('/users/:userId', authMiddleware, exactRoleMiddleware(['creator']), deleteUser);

// POST /api/iam/verify-otp - Verify OTP for user activation
router.post('/verify-otp', authMiddleware, roleMiddleware(['superadmin']), verifyOTP);

// POST /api/iam/resend-otp - Resend OTP to user
router.post('/resend-otp', authMiddleware, roleMiddleware(['superadmin']), resendOTP);

// === TOKEN-BASED ONBOARDING SYSTEM ===

// POST /api/iam/create-token - Create invite token (superadmin only)
router.post('/create-token', authMiddleware, roleMiddleware(['superadmin']), createToken);

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

// POST /api/iam/verify-phone-otp-login - Verify phone OTP with login (public)
router.post('/verify-phone-otp-login', verifyPhoneOTPWithLogin);

module.exports = router;
