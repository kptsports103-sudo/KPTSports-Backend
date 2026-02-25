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
  adminEmail: {
    type: String,
    default: ''
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
  },
  changes: {
    type: [
      {
        field: { type: String, required: true },
        before: { type: String, default: '' },
        after: { type: String, default: '' }
      }
    ],
    default: []
  }
}, { timestamps: true });

// Index for faster queries
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });
// Auto-delete logs permanently after 30 days
adminActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
