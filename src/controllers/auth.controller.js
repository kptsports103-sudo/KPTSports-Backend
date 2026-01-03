const { loginUser, verifyUserOTP } = require('../auth.service');
const clerk = require('../config/clerk');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  console.log('Login attempt:', { email, role });
  try {
    const result = await loginUser(email, password, role);
    console.log('Login result:', result);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await verifyUserOTP(email, otp);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

exports.clerkLogin = async (req, res) => {
  const { token } = req.body;
  try {
    // Verify the Clerk token
    const payload = await clerk.verifyToken(token);
    const clerkUserId = payload.sub;
    const email = payload.email_addresses[0]?.email_address;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in token' });
    }

    // Find or create user
    let user = await User.findOne({ clerkUserId });
    if (!user) {
      // For new users, assign default role as student, or perhaps require role selection
      user = new User({
        clerkUserId,
        email,
        password: '', // No password for OAuth users
        role: 'student', // Default role
        is_verified: true,
      });
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Clerk login error:', error);
    res.status(400).json({ message: 'Invalid token' });
  }
};