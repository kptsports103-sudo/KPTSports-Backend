const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  diplomaYear: {
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

module.exports = mongoose.model('Player', playerSchema);