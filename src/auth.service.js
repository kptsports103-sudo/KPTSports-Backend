const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const otpService = require('./services/otp.service');
const emailService = require('./services/email.service');
const { validateRole } = require('./auth.validation');

const loginUser = async (email, password, role) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  try {
    console.log('=== LOGIN ATTEMPT ===', requestId);
    console.log('Request ID:', requestId);
    console.log('Email:', email.toLowerCase());
    console.log('Requested role:', role);
    console.log('Password provided:', !!password);
    console.log('Password length:', password ? password.length : 'N/A');
    console.log('Password chars:', password ? password.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ') : 'N/A');
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    
    // Find user by email first (separate from role check)
    let user = await User.findOne({ email: normalizedEmail });
    console.log('User found by email:', !!user);
    
    if (!user) {
      console.log('ERROR: User not found with email:', normalizedEmail);
      throw new Error('User not found');
    }
    
    console.log('User found - Email:', user.email, 'Role:', user.role, 'ID:', user._id);
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      console.log('ERROR: Password does not match');
      throw new Error('Invalid credentials');
    }
    
    // Validate role (case insensitive)
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      console.log('ERROR: Role mismatch - DB role:', user.role, 'Requested role:', role);
      throw new Error(`Invalid role. User role is ${user.role}, but ${role} was requested.`);
    }
    if (['superadmin', 'admin', 'creator'].includes(user.role)) {
      await generateOTPForUser(user, email);
      return { message: 'OTP sent to your email' };
    } else {
      // Direct login for other roles like coach
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
          name: user.name,
          profileImage: user.profileImage,
        },
      };
    }
  } catch (error) {
    throw error;
  }
};

async function generateOTPForUser(user, email) {
  try {
    const otp = otpService.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await User.findOneAndUpdate({ _id: user._id }, { otp, otp_expires_at: expiresAt });
    console.log(`OTP for ${email}: ${otp}`);
    // Send OTP via email
    await emailService.sendOTP(email, otp);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error in generateOTPForUser:', error);
    throw new Error('Failed to generate and send OTP: ' + error.message);
  }
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
        name: user.name,
        profileImage: user.profileImage,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { loginUser, verifyUserOTP };