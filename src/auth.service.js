const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const otpService = require('./services/otp.service');
const emailService = require('./services/email.service');
const { validateRole } = require('./auth.validation');

const loginUser = async (email, password, role) => {
  validateRole(role);
  try {
    let user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) {
      if (['superadmin', 'admin', 'creator'].includes(role)) {
        throw new Error('User not found. Please contact administrator.');
      }
      // Create new user for coach/student (if added back)
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email: email.toLowerCase(), password: hashedPassword, role, clerkUserId: email.toLowerCase() });
      await user.save();
    } else {
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
    }
    if (['superadmin', 'admin', 'creator'].includes(role)) {
      await generateOTPForUser(user, email);
      return { message: 'OTP sent to your email' };
    } else {
      // For coach and student, no OTP
      // Generate JWT directly
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      };
    }
  } catch (error) {
    throw error;
  }
};

async function generateOTPForUser(user, email) {
  const otp = otpService.generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await User.findOneAndUpdate({ email: email.toLowerCase() }, { otp, otp_expires_at: expiresAt });
  // Send OTP via email
  await emailService.sendOTP(email, otp);
}

const verifyUserOTP = async (email, otp) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase(), otp });
    if (!user || new Date(user.otp_expires_at) < new Date()) {
      throw new Error('Invalid or expired OTP');
    }
    // Clear OTP
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { otp: null, otp_expires_at: null, is_verified: true });
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { loginUser, verifyUserOTP };