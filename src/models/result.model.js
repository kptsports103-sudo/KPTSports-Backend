const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  // Canonical player identity across years
  playerMasterId: {
    type: String,
    default: ''
  },
  // Optional link to player record; manual entries can be saved without playerId
  // Legacy per-year identity kept for backward compatibility.
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
    enum: ['Gold', 'Silver', 'Bronze', 'Participation'],
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
resultSchema.index({ playerMasterId: 1 });
resultSchema.index({ playerId: 1 });
resultSchema.index({ year: 1, order: 1 });
resultSchema.index({ diplomaYear: 1 });
resultSchema.index({ playerMasterId: 1, year: 1 });
resultSchema.index({ medal: 1 });
resultSchema.index({ event: 1 });
resultSchema.index(
  { playerMasterId: 1, event: 1, year: 1 },
  { unique: true, name: 'uq_result_player_event_year' }
);

module.exports = mongoose.model('Result', resultSchema);
