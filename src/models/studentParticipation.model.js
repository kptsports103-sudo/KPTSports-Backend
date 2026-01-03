const mongoose = require('mongoose');

const studentParticipationSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  sport: {
    type: String,
    required: true,
  },
  event: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('StudentParticipation', studentParticipationSchema);