const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'coach'],
    required: true,
  },
  otp: {
    type: String,
  },
  otp_expires_at: {
    type: Date,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index on email and role
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);