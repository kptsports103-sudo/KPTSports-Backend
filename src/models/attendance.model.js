const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  records: [{
    playerName: {
      type: String,
      required: true
    },
    morning: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: true
    },
    evening: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: true
    }
  }],
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);