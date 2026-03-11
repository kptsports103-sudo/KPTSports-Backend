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
    enum: ['superadmin', 'admin', 'creator', 'viewer', 'coach', 'student'],
    required: true
  },
  source: {
    type: String,
    enum: ['manual', 'api', 'navigation', 'auth', 'system'],
    default: 'manual'
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
  method: {
    type: String,
    default: ''
  },
  route: {
    type: String,
    default: ''
  },
  clientPath: {
    type: String,
    default: ''
  },
  statusCode: {
    type: Number,
    default: 0
  },
  userAgent: {
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
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Index for faster queries
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ source: 1, createdAt: -1 });
adminActivityLogSchema.index({ role: 1, createdAt: -1 });
// Auto-delete logs permanently after 30 days
adminActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
