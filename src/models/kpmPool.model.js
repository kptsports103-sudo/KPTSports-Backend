const mongoose = require('mongoose');

const kpmPoolSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'GLOBAL'
  },
  available: {
    type: [Number],
    default: []
  },
  allocated: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KpmPool', kpmPoolSchema);
