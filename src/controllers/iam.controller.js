const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const otpService = require('../services/otp.service');
const smsService = require('../services/sms.service');

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

    // Check if phone number already exists
    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }

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

    // Prevent deletion of admin users for safety
    if (user.role === 'admin' || user.role === 'Super Admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({ message: error.message || 'Failed to delete user' });
  }
};