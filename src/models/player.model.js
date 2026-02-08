const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Canonical identifier - used in all results
  playerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  // Academic tracking
  firstParticipationYear: {
    type: Number,
    required: true
  },
  baseDiplomaYear: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  // Current values (may change each year)
  currentDiplomaYear: {
    type: Number,
    min: 1,
    max: 3
  },
  year: {
    type: Number,
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast lookups
playerSchema.index({ playerId: 1 });
playerSchema.index({ name: 1 });
playerSchema.index({ firstParticipationYear: 1 });

module.exports = mongoose.model('Player', playerSchema);
