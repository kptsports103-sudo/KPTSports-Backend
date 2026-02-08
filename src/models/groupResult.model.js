const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  diplomaYear: {
    type: Number,
    required: false,
    min: 1,
    max: 3
  }
}, { _id: false });

const groupResultSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Store members with their academic year at meet time
  members: {
    type: [memberSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Group must have at least one member'
    }
  },
  // Legacy support - array of IDs only (for old data)
  memberIds: {
    type: [String]
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
}, {
  timestamps: true
});

// Indexes for fast lookups
groupResultSchema.index({ 'members.playerId': 1 });
groupResultSchema.index({ year: 1 });
groupResultSchema.index({ medal: 1 });

module.exports = mongoose.model('GroupResult', groupResultSchema);
