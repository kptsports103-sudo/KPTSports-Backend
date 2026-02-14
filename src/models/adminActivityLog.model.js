const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema({
  adminId: {
    type: String,  // Store as string to avoid ObjectId type issues
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'creator', 'coach', 'student'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  pageName: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Index for faster queries
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
