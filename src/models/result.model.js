const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  // Optional link to player record; manual entries can be saved without playerId
  playerId: {
    type: String,
    default: ''
  },
  // Denormalized for display (auto-filled from player)
  name: {
    type: String,
    required: true
  },
  // Optional display field
  branch: {
    type: String,
    default: ''
  },
  event: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // REQUIRED - academic year at meet time
  diplomaYear: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  medal: {
    type: String,
    required: true,
    enum: ['Gold', 'Silver', 'Bronze'],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Indexes for fast lookups
resultSchema.index({ playerId: 1 });
resultSchema.index({ year: 1, order: 1 });
resultSchema.index({ diplomaYear: 1 });

module.exports = mongoose.model('Result', resultSchema);
