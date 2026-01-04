const mongoose = require('mongoose');

const trainingScheduleSchema = new mongoose.Schema({
  slNo: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  session: {
    type: String,
    enum: ['Morning', 'Evening'],
    required: true
  },
  time: {
    type: String,
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingSchedule', trainingScheduleSchema);