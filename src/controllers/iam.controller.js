const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const { v4: uuid } = require('uuid');

// In-memory token store for onboarding (in production, use database)
const onboardingTokens = {};
const onboardingOTPs = {};

exports.getUsers = async (req, res) => {
  try {
    // Get all users from MongoDB
    const users = await User.find({}).select('-password -otp -otp_expires_at');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  const { email, password, name, phone, role } = req.body;

  try {
    // Validate mobile number format (basic validation for Indian numbers)
    const phoneRegex = /^[5-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number starting with 5-9' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Removed phone number uniqueness check to allow multiple users with same phone

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create new user (unverified)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      otp,
      otp_expires_at: otpExpiresAt,
      is_verified: false,
    });

    await newUser.save();

    // Send OTP via SMS
    await smsService.sendOTP(phone, otp);

    res.json({
      message: 'User created successfully. OTP sent to mobile number for verification.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        is_verified: false,
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ message: error.message || 'Failed to create user' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (!user.otp || !user.otp_expires_at) {
      return res.status(400).json({ message: 'No OTP found for this user' });
    }

    if (new Date() > user.otp_expires_at) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Verify the user
    await User.findByIdAndUpdate(userId, {
      is_verified: true,
      otp: null,
      otp_expires_at: null,
    });

    res.json({
      message: 'Mobile number verified successfully. Account is now active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: true,
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(400).json({ message: error.message || 'Failed to verify OTP' });
  }
};

exports.resendOTP = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with new OTP
    await User.findByIdAndUpdate(userId, {
      otp,
      otp_expires_at: otpExpiresAt,
    });

    // Send OTP via SMS
    await smsService.sendOTP(user.phone, otp);

    res.json({
      message: 'OTP resent successfully to mobile number.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(400).json({ message: error.message || 'Failed to resend OTP' });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow deletion of all users for now

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({ message: error.message || 'Failed to delete user' });
  }
};

// === TOKEN-BASED ONBOARDING SYSTEM ===

exports.createToken = async (req, res) => {
  const { phone, role = "Creator", source = "admin" } = req.body;

  try {
    const token = uuid();
    onboardingTokens[token] = {
      phone: phone || null,
      role,
      source,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      used: false,
      createdAt: new Date()
    };

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/iam/users?token=${token}`;

    res.json({
      message: 'Invitation token created successfully',
      token,
      link: inviteLink,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({ message: 'Failed to create invitation token' });
  }
};

exports.resolveToken = async (req, res) => {
  const { token } = req.query;

  try {
    const tokenData = onboardingTokens[token];

    if (!tokenData || tokenData.used || tokenData.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({
      phone: tokenData.phone,
      role: tokenData.role,
      source: tokenData.source
    });
  } catch (error) {
    console.error('Resolve token error:', error);
    res.status(500).json({ message: 'Failed to resolve token' });
  }
};

exports.sendOTPOnboarding = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    onboardingOTPs[email] = {
      otp,
      expiresAt: otpExpiresAt
    };

    // Send OTP via Email
    await emailService.sendOTP(email, otp);

    res.json({
      message: 'OTP sent successfully to email address',
      expiresIn: '5 minutes'
    });
  } catch (error) {
    console.error('Send OTP onboarding error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOTPOnboarding = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpData = onboardingOTPs[email];

    if (!otpData) {
      return res.status(400).json({ message: 'No OTP found for this email' });
    }

    if (new Date() > otpData.expiresAt) {
      delete onboardingOTPs[email];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP after successful verification
    delete onboardingOTPs[email];

    res.json({
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP onboarding error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

exports.createUserOnboarding = async (req, res) => {
  const { name, phone, email, password, role, token, profileImage } = req.body;

  console.log('Create user request:', { name, phone, email, role, hasToken: !!token });

  try {
    // Check if token is provided (invitation-based) or direct onboarding
    let userRole = role; // Default to provided role

    // Only validate token if it's provided and not empty
    if (token && typeof token === 'string' && token.trim() !== '') {
      console.log('Validating token:', token);
      // Token-based onboarding - validate token
      const tokenData = onboardingTokens[token];
      if (!tokenData || tokenData.used || tokenData.expires < Date.now()) {
        console.log('Token validation failed:', { exists: !!tokenData, used: tokenData?.used, expired: tokenData?.expires < Date.now() });
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      userRole = tokenData.role; // Use role from token
      console.log('Token validated, role:', userRole);
    } else {
      console.log('Direct onboarding, using role:', role);
    }

    // Validate mobile number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number starting with 5-9' });
    }

    // Check if user already exists (same email + role combination)
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      role: userRole
    });

    if (existingUser) {
      console.log('User already exists with same email and role:', existingUser.email, existingUser.role);
      return res.status(400).json({
        message: `An account with this email already exists for the role "${userRole}". Please use a different email or select a different role.`
      });
    }

    // Removed phone number uniqueness check to allow multiple users with same phone

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: userRole,
      profileImage: profileImage || null,
      is_verified: true,
      createdAt: new Date()
    });

    await newUser.save();

    // Mark token as used if it was provided
    if (token) {
      const tokenData = onboardingTokens[token];
      if (tokenData) {
        tokenData.used = true;
      }
    }

    res.json({
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        is_verified: true
      }
    });
  } catch (error) {
    console.error('Create user onboarding error:', error);
    res.status(500).json({ message: error.message || 'Failed to create account' });
  }
};