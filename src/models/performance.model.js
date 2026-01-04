const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  athleteName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['High Performance', 'Progressing Well', 'In Development'],
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

module.exports = mongoose.model('Performance', performanceSchema);