const mongoose = require('mongoose');

const mediaActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    userRole: {
      type: String,
      default: '',
      trim: true,
    },
    mediaId: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'pdf', 'audio', 'other'],
      default: 'other',
    },
    action: {
      type: String,
      enum: ['view', 'play', 'open', 'download'],
      default: 'view',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

mediaActivitySchema.index({ mediaId: 1, timestamp: -1 });
mediaActivitySchema.index({ mediaType: 1, timestamp: -1 });
mediaActivitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('MediaActivity', mediaActivitySchema);
