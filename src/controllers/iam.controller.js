const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const cloudinary = require('../config/cloudinary');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');

// In-memory token store for onboarding (in production, use database)
const onboardingTokens = {};
const onboardingOTPs = {};

const getUsers = async (req, res) => {
  try {
    // Get all users from MongoDB
    const users = await User.find({}).select('-password -otp -otp_expires_at');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
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

const verifyOTP = async (req, res) => {
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

const resendOTP = async (req, res) => {
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

const deleteUser = async (req, res) => {
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

const createToken = async (req, res) => {
  const { phone, role = "Creator", source = "admin" } = req.body;

  try {
    const token = randomUUID();
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

const resolveToken = async (req, res) => {
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

const sendOTPOnboarding = async (req, res) => {
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

const verifyOTPOnboarding = async (req, res) => {
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

const verifyPhoneOTP = async (req, res) => {
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
      message: 'Phone number verified successfully. Account is now active.',
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
    console.error('Phone OTP verification error:', error);
    res.status(400).json({ message: error.message || 'Failed to verify OTP' });
  }
};

const verifyPhoneOTPWithLogin = async (req, res) => {
  const { userId, otp } = req.body;

  console.log('=== PHONE OTP VERIFICATION BACKEND DEBUG ===');
  console.log('Request body:', { userId, otp });

  try {
    const user = await User.findById(userId);
    console.log('Found user:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User details:', { id: user._id, email: user.email, role: user.role, is_verified: user.is_verified });
    }
    
    if (!user) {
      console.log('ERROR: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      console.log('ERROR: User already verified');
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (!user.otp || !user.otp_expires_at) {
      console.log('ERROR: No OTP found');
      return res.status(400).json({ message: 'No OTP found for this user' });
    }

    console.log('Stored OTP:', user.otp);
    console.log('Provided OTP:', otp);
    console.log('OTP expires at:', user.otp_expires_at);
    console.log('Current time:', new Date());

    if (new Date() > user.otp_expires_at) {
      console.log('ERROR: OTP expired');
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.otp !== otp) {
      console.log('ERROR: Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    console.log('OTP verification successful, updating user...');

    // Verify the user and clear OTP
    await User.findByIdAndUpdate(userId, {
      is_verified: true,
      otp: null,
      otp_expires_at: null,
    });

    console.log('User updated successfully');

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated');

    const responseData = {
      message: 'Phone number verified successfully. Account is now active.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        is_verified: true,
      }
    };

    console.log('Sending response:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('=== PHONE OTP VERIFICATION ERROR ===');
    console.error('Error:', error);
    res.status(400).json({ message: error.message || 'Failed to verify OTP' });
  }
};

const createUserOnboarding = async (req, res) => {
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

    // Validate mobile number format (Indian numbers starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number starting with 6-9' });
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

    // Upload profile image to Cloudinary if provided
    let profileImageUrl = null;
    if (profileImage) {
      try {
        console.log('Uploading profile image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(profileImage, {
          folder: 'user-profiles',
          public_id: `user-${email}-${Date.now()}`,
          transformation: [
            { width: 200, height: 200, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        profileImageUrl = uploadResult.secure_url;
        console.log('✅ Profile image uploaded to Cloudinary:', profileImageUrl);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError.message);
        console.error('Full error:', uploadError);
        // Return error instead of continuing without image
        return res.status(500).json({
          message: `Profile image upload failed: ${uploadError.message}. Please check Cloudinary configuration.`
        });
      }
    } else {
      console.log('No profile image provided');
    }

    // Require phone verification for all roles
    const requiresPhoneVerification = true;

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: userRole,
      profileImage: profileImageUrl,
      is_verified: !requiresPhoneVerification, // Verified for non-creator, unverified for creator
      createdAt: new Date()
    });

    // Generate OTP for phone verification if required
    if (requiresPhoneVerification) {
      const otp = otpService.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      newUser.otp = otp;
      newUser.otp_expires_at = otpExpiresAt;
    }

    await newUser.save();

    // Send OTP via SMS if required
    if (requiresPhoneVerification) {
      await smsService.sendOTP(phone, newUser.otp);
    }

    // Mark token as used if it was provided
    if (token) {
      const tokenData = onboardingTokens[token];
      if (tokenData) {
        tokenData.used = true;
      }
    }

    res.json({
      message: requiresPhoneVerification
        ? 'Account created successfully. Please verify your phone number with the OTP sent to your mobile.'
        : 'Account created and verified successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        profileImage: newUser.profileImage,
        is_verified: newUser.is_verified
      },
      requiresPhoneVerification
    });
  } catch (error) {
    console.error('Create user onboarding error:', error);
    res.status(500).json({ message: error.message || 'Failed to create account' });
  }
};

// Export all functions for CommonJS
module.exports = {
  getUsers,
  createUser,
  verifyOTP,
  resendOTP,
  deleteUser,
  createToken,
  resolveToken,
  sendOTPOnboarding,
  verifyOTPOnboarding,
  createUserOnboarding,
  verifyPhoneOTP,
  verifyPhoneOTPWithLogin,
  createAdminUser
};