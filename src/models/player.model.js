const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Canonical identifier - used in all results
  playerId: {
    type: String,
    required: true,
    unique: true
  },
  // Permanent identity across years for the same student
  masterId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  // Unique institutional player number
  kpmNo: {
    type: String,
    default: '',
    trim: true
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
  // Semester at time of record save (1-6)
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6'],
    default: '1'
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
playerSchema.index({ masterId: 1 });
playerSchema.index({ kpmNo: 1 });
playerSchema.index({ name: 1 });
playerSchema.index({ firstParticipationYear: 1 });

module.exports = mongoose.model('Player', playerSchema);
