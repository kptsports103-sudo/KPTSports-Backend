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
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

resultSchema.index({ year: 1, order: 1 });

module.exports = mongoose.model('Result', resultSchema);