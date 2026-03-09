const mongoose = require('mongoose');

const webVitalSchema = new mongoose.Schema(
  {
    metricName: {
      type: String,
      required: true,
      enum: ['CLS', 'INP', 'LCP', 'FCP', 'TTFB'],
    },
    value: {
      type: Number,
      required: true,
    },
    rating: {
      type: String,
      default: 'unknown',
      enum: ['good', 'needs-improvement', 'poor', 'unknown'],
    },
    metricId: {
      type: String,
      default: '',
      trim: true,
    },
    path: {
      type: String,
      default: '/',
      trim: true,
    },
    navigationType: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    effectiveType: {
      type: String,
      default: '',
      trim: true,
    },
    language: {
      type: String,
      default: '',
      trim: true,
    },
    viewportWidth: {
      type: Number,
      default: 0,
    },
    viewportHeight: {
      type: Number,
      default: 0,
    },
    deviceMemory: {
      type: Number,
      default: 0,
    },
    hardwareConcurrency: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    receivedAtClient: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

webVitalSchema.index({ createdAt: -1 });
webVitalSchema.index({ metricName: 1, createdAt: -1 });
webVitalSchema.index({ path: 1, createdAt: -1 });
// Auto-delete after 180 days to keep storage bounded.
webVitalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('WebVital', webVitalSchema);
