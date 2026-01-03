const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  name: {
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
  medal: {
    type: String,
    required: true,
    enum: ['Gold', 'Silver', 'Bronze'],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Result', resultSchema);