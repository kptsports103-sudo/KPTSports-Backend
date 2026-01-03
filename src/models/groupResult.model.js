const mongoose = require('mongoose');

const groupResultSchema = new mongoose.Schema({
  teamName: {
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
  members: {
    type: [String],
    required: true,
  },
  medal: {
    type: String,
    enum: ['Gold', 'Silver', 'Bronze'],
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('GroupResult', groupResultSchema);